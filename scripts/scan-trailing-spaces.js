#!/usr/bin/env node

/**
 * @fileoverview Utility to scan MySQL databases for trailing spaces in string columns
 * @description Scans all string columns in specified tables for trailing spaces
 * that could cause issues with MySQL 9.0's NO PAD collation behavior
 */

const mysql = require('mysql2/promise');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Database configuration
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
};

/**
 * Get all string columns from a table
 * @param {Object} connection - MySQL connection
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} Array of column names
 */
async function getStringColumns(connection, tableName) {
  const query = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND DATA_TYPE IN ('varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext')
  `;

  const [columns] = await connection.query(query, [dbConfig.database, tableName]);
  return columns.map(col => col.COLUMN_NAME);
}

/**
 * Get all tables in the database
 * @param {Object} connection - MySQL connection
 * @returns {Promise<Array>} Array of table names
 */
async function getAllTables(connection) {
  const query = `
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ?
      AND TABLE_TYPE = 'BASE TABLE'
  `;

  const [tables] = await connection.query(query, [dbConfig.database]);
  return tables.map(t => t.TABLE_NAME);
}

/**
 * Scan a column for trailing spaces
 * @param {Object} connection - MySQL connection
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @returns {Promise<Object>} Scan results
 */
async function scanColumn(connection, tableName, columnName) {
  const query = `
    SELECT
      COUNT(*) as total_rows,
      SUM(CASE WHEN \`${columnName}\` != TRIM(\`${columnName}\`) THEN 1 ELSE 0 END) as trailing_space_count
    FROM \`${tableName}\`
    WHERE \`${columnName}\` IS NOT NULL
  `;

  const [results] = await connection.query(query);
  return {
    table: tableName,
    column: columnName,
    totalRows: results[0].total_rows,
    trailingSpaceCount: results[0].trailing_space_count,
  };
}

/**
 * Get sample rows with trailing spaces
 * @param {Object} connection - MySQL connection
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @param {number} limit - Number of samples to retrieve
 * @returns {Promise<Array>} Sample rows
 */
async function getSampleRows(connection, tableName, columnName, limit = 5) {
  const query = `
    SELECT
      id,
      \`${columnName}\` as value,
      CHAR_LENGTH(\`${columnName}\`) as char_length,
      LENGTH(\`${columnName}\`) as byte_length
    FROM \`${tableName}\`
    WHERE \`${columnName}\` != TRIM(\`${columnName}\`)
    LIMIT ?
  `;

  const [rows] = await connection.query(query, [limit]);
  return rows;
}

/**
 * Main scanning function
 */
async function scanDatabase() {
  if (!dbConfig.database) {
    console.error(chalk.red('Error: DB_NAME environment variable is required'));
    console.log(chalk.yellow('\nUsage:'));
    console.log('  DB_NAME=mydb DB_USER=user DB_PASSWORD=pass node scan-trailing-spaces.js');
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n=== MySQL Trailing Space Scanner ===\n'));
  console.log(chalk.gray(`Database: ${dbConfig.database}`));
  console.log(chalk.gray(`Host: ${dbConfig.host}:${dbConfig.port}\n`));

  let connection;
  const spinner = ora('Connecting to database...').start();

  try {
    connection = await mysql.createConnection(dbConfig);
    spinner.succeed('Connected to database');

    const tables = await getAllTables(connection);
    console.log(chalk.green(`\nFound ${tables.length} tables to scan\n`));

    const results = [];
    let totalIssues = 0;

    for (const table of tables) {
      spinner.start(`Scanning table: ${table}`);
      const columns = await getStringColumns(connection, table);

      for (const column of columns) {
        const result = await scanColumn(connection, table, column);

        if (result.trailingSpaceCount > 0) {
          results.push(result);
          totalIssues += result.trailingSpaceCount;

          spinner.warn(
            chalk.yellow(
              `${table}.${column}: ${result.trailingSpaceCount} / ${result.totalRows} rows have trailing spaces`
            )
          );

          const samples = await getSampleRows(connection, table, column);
          if (samples.length > 0) {
            console.log(chalk.gray('  Sample values:'));
            samples.forEach(sample => {
              console.log(
                chalk.gray(`    ID ${sample.id}: "${sample.value}" (length: ${sample.char_length})`)
              );
            });
          }
        }
      }

      spinner.succeed(`Completed: ${table}`);
    }

    console.log(chalk.bold.cyan('\n=== Scan Summary ===\n'));

    if (totalIssues > 0) {
      console.log(
        chalk.yellow(
          `⚠️  Found ${totalIssues} rows with trailing spaces across ${results.length} columns\n`
        )
      );
      console.log(chalk.bold('Affected columns:'));
      results.forEach(r => {
        console.log(chalk.yellow(`  • ${r.table}.${r.column}: ${r.trailingSpaceCount} rows`));
      });

      console.log(chalk.bold.yellow('\n⚠️  Action Required:'));
      console.log(
        chalk.gray('These trailing spaces may cause issues with MySQL 9.0 NO PAD collation.')
      );
      console.log(chalk.gray('Consider running UPDATE queries to trim these values:\n'));
      results.forEach(r => {
        console.log(
          chalk.cyan(`  UPDATE \`${r.table}\` SET \`${r.column}\` = TRIM(\`${r.column}\`);`)
        );
      });
    } else {
      console.log(chalk.green('✓ No trailing spaces detected in any string columns'));
      console.log(chalk.green('✓ Database is ready for MySQL 9.0 NO PAD collation'));
    }

    console.log('');
  } catch (error) {
    spinner.fail('Error during scan');
    console.error(chalk.red('\nError details:'));
    console.error(chalk.red(error.message));
    console.error(chalk.gray(error.stack));
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the scanner
if (require.main === module) {
  scanDatabase().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { scanDatabase, getStringColumns, scanColumn };
