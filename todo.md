# REST-SPEC TODO

## MySQL 9.0 Compatibility Tasks

### Priority 1 - Critical (Before MySQL 9.0 Upgrade) ✅ COMPLETED

- [x] Update mysql2 dependency from ^3.0.1 to ^3.11.5 in templates/default/package.json
- [x] Update sequelize dependency from ^6.28.0 to ^6.37.5 in templates/default/package.json
- [x] Add string trimming setters to User model (templates/default/src/models/User.js) for email, firstName, lastName fields to handle NO PAD collation behavior
- [x] Update database configuration (templates/default/src/config/database.js) to add explicit authPlugins configuration for caching_sha2_password
- [x] Add charset and collate configuration to dialectOptions in database.js
- [x] Set up test environment with MySQL 9.0.1+ for compatibility testing
- [x] Run full test suite against MySQL 9.0.1 to verify compatibility

### Priority 2 - High (During Migration Planning) ✅ COMPLETED

- [x] Update sql-standards-and-patterns.md to add section explaining NO PAD collation behavior and its impact on GROUP BY, UNIQUE constraints, and string comparisons
- [x] Add MySQL 9.0 compatibility section to sql-standards-and-patterns.md covering authentication changes and new features
- [x] Update technologies.md to change MySQL version requirement from "8.0.40+" to "8.4+ / 9.0.1+"
- [x] Update Docker configurations to change mysql:8.0 to mysql:9.0.1 in templates/microservice/docker-compose.yml
- [x] Update Docker configurations to change mysql:8.0 to mysql:9.0.1 in templates/websocket/docker-compose.yml
- [x] Test docker-compose configurations with MySQL 9.0.1 image
- [x] Scan existing data for trailing spaces in string columns and plan cleanup if needed
- [x] Create mysql-9-migration-guide.md with pre-migration checklist, breaking changes, step-by-step migration, and rollback procedures

### Priority 3 - Medium (Post-Migration) ✅ COMPLETED

- [x] Update deployment-procedures.md to reference MySQL 9.0.1 instead of 8.0
- [x] Update testing-standards.md Docker configuration examples to use MySQL 9.0.1
- [x] Update vscode-extension/snippets/json.json MySQL image references to 9.0.1
- [x] Add monitoring for MySQL deprecation warnings in production logs
- [x] Review and test query performance after MySQL 9.0 upgrade
- [x] Update VS Code snippets to include MySQL 9.0 examples and best practices
- [x] VECTOR data type and INTERSECT/EXCEPT operators documented in sql-standards-and-patterns.md MySQL 9.0 section

### Testing Checklist (To be performed during migration)

- [x] Test database authentication with default caching_sha2_password
- [ ] Test SSL database connections (if used in production)
- [x] Test connection pooling behavior
- [x] Test GROUP BY queries with string columns for NO PAD collation behavior
- [x] Verify UNIQUE constraints handle trailing spaces correctly
- [x] Test WHERE clause string comparisons
- [x] Verify JOIN operations on string columns
- [ ] Test Sequelize model creation and migrations
- [ ] Test Sequelize findOne/findAll operations
- [ ] Test bulk operations and transactions
- [ ] Test foreign key constraints and cascading deletes/updates
- [ ] Test ENUM fields behavior
- [ ] Test JSON columns (if used)
- [ ] Test DATETIME fields and timezone handling
- [ ] Test user registration/login flows
- [ ] Test JWT token generation
- [ ] Test password hashing with bcryptjs
- [ ] Test input validation and error handling
