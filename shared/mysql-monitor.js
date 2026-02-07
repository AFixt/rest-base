/**
 * @fileoverview MySQL 9.0 Monitoring Utility
 * @description Monitors MySQL connections for deprecation warnings, collation issues,
 * and provides utilities for detecting trailing space issues with NO PAD collation
 * @module shared/mysql-monitor
 */

const logger = require('./logger');

/**
 * MySQL Monitor class for tracking deprecation warnings and collation issues
 */
class MySQLMonitor {
  constructor(options = {}) {
    this.options = {
      logWarnings: options.logWarnings !== false,
      trackSlowQueries: options.trackSlowQueries !== false,
      slowQueryThreshold: options.slowQueryThreshold || 1000,
      ...options,
    };
    this.warnings = [];
    this.deprecationWarnings = [];
    this.slowQueries = [];
  }

  /**
   * Monitor a database connection for warnings
   * @param {Object} connection - Database connection object
   * @param {string} queryText - SQL query text
   * @param {number} executionTime - Query execution time in milliseconds
   */
  async checkWarnings(connection, queryText, executionTime) {
    try {
      const [warnings] = await connection.query('SHOW WARNINGS');

      if (warnings && warnings.length > 0) {
        warnings.forEach(warning => {
          const warningData = {
            timestamp: new Date().toISOString(),
            level: warning.Level,
            code: warning.Code,
            message: warning.Message,
            query: queryText,
            executionTime,
          };

          this.warnings.push(warningData);

          if (this.isDeprecationWarning(warning)) {
            this.deprecationWarnings.push(warningData);
            if (this.options.logWarnings) {
              logger.warn('MySQL Deprecation Warning', warningData);
            }
          }
        });
      }

      if (this.options.trackSlowQueries && executionTime > this.options.slowQueryThreshold) {
        this.slowQueries.push({
          timestamp: new Date().toISOString(),
          query: queryText,
          executionTime,
        });

        if (this.options.logWarnings) {
          logger.warn('Slow Query Detected', {
            query: queryText,
            executionTime,
            threshold: this.options.slowQueryThreshold,
          });
        }
      }
    } catch (error) {
      if (this.options.logWarnings) {
        logger.error('Error checking MySQL warnings', error);
      }
    }
  }

  /**
   * Check if a warning is a deprecation warning
   * @param {Object} warning - Warning object
   * @returns {boolean} True if deprecation warning
   */
  isDeprecationWarning(warning) {
    const deprecationKeywords = [
      'deprecated',
      'will be removed',
      'is obsolete',
      'no longer supported',
      'authentication_string',
    ];

    const message = warning.Message.toLowerCase();
    return deprecationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Scan a table for trailing spaces in string columns (NO PAD collation issue)
   * @param {Object} connection - Database connection
   * @param {string} tableName - Table name to scan
   * @param {Array<string>} columns - Array of column names to check
   * @returns {Promise<Array>} Array of rows with trailing spaces
   */
  async scanTrailingSpaces(connection, tableName, columns) {
    const results = [];

    for (const column of columns) {
      try {
        const query = `
          SELECT id, \`${column}\`,
                 CHAR_LENGTH(\`${column}\`) as char_length,
                 LENGTH(\`${column}\`) as byte_length
          FROM \`${tableName}\`
          WHERE \`${column}\` != TRIM(\`${column}\`)
        `;

        const [rows] = await connection.query(query);

        if (rows && rows.length > 0) {
          results.push({
            table: tableName,
            column,
            rowsAffected: rows.length,
            rows: rows.map(row => ({
              id: row.id,
              value: row[column],
              charLength: row.char_length,
              byteLength: row.byte_length,
              hasTrailingSpaces: row[column] !== row[column].trim(),
            })),
          });

          if (this.options.logWarnings) {
            logger.warn('Trailing spaces detected', {
              table: tableName,
              column,
              count: rows.length,
            });
          }
        }
      } catch (error) {
        if (this.options.logWarnings) {
          logger.error(`Error scanning column ${column} in table ${tableName}`, error);
        }
      }
    }

    return results;
  }

  /**
   * Get all deprecation warnings
   * @returns {Array} Array of deprecation warnings
   */
  getDeprecationWarnings() {
    return this.deprecationWarnings;
  }

  /**
   * Get all slow queries
   * @returns {Array} Array of slow queries
   */
  getSlowQueries() {
    return this.slowQueries;
  }

  /**
   * Get statistics summary
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      totalWarnings: this.warnings.length,
      deprecationWarnings: this.deprecationWarnings.length,
      slowQueries: this.slowQueries.length,
      avgSlowQueryTime:
        this.slowQueries.length > 0
          ? this.slowQueries.reduce((sum, q) => sum + q.executionTime, 0) / this.slowQueries.length
          : 0,
    };
  }

  /**
   * Clear all collected data
   */
  clear() {
    this.warnings = [];
    this.deprecationWarnings = [];
    this.slowQueries = [];
  }

  /**
   * Export warnings to JSON
   * @returns {string} JSON string of all warnings
   */
  exportWarnings() {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        stats: this.getStats(),
        warnings: this.warnings,
        deprecationWarnings: this.deprecationWarnings,
        slowQueries: this.slowQueries,
      },
      null,
      2
    );
  }
}

/**
 * Create a middleware for Express to monitor database queries
 * @param {MySQLMonitor} monitor - MySQLMonitor instance
 * @returns {Function} Express middleware
 */
function createMonitoringMiddleware(monitor) {
  return async (req, res, next) => {
    if (req.db && req.db.connection) {
      const originalQuery = req.db.connection.query.bind(req.db.connection);

      req.db.connection.query = async function monitoredQuery(...args) {
        const startTime = Date.now();
        const queryText = typeof args[0] === 'string' ? args[0] : args[0].sql;

        try {
          const result = await originalQuery(...args);
          const executionTime = Date.now() - startTime;

          await monitor.checkWarnings(req.db.connection, queryText, executionTime);

          return result;
        } catch (error) {
          const executionTime = Date.now() - startTime;
          await monitor.checkWarnings(req.db.connection, queryText, executionTime);
          throw error;
        }
      };
    }
    next();
  };
}

module.exports = {
  MySQLMonitor,
  createMonitoringMiddleware,
};
