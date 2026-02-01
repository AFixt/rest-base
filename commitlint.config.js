/**
 * @file Commitlint configuration for enforcing conventional commits
 * @description Ensures all commit messages follow the Conventional Commits specification
 * @see https://www.conventionalcommits.org/
 * @see https://commitlint.js.org/
 */

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Enforce conventional commit types
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only changes
        "style", // Code style changes (formatting, semicolons, etc.)
        "refactor", // Code refactoring (neither fixes bug nor adds feature)
        "perf", // Performance improvements
        "test", // Adding or correcting tests
        "build", // Changes to build system or dependencies
        "ci", // CI configuration changes
        "chore", // Other changes that don't modify src or test files
        "revert", // Reverts a previous commit
      ],
    ],
    // Require lowercase type
    "type-case": [2, "always", "lower-case"],
    // Type must not be empty
    "type-empty": [2, "never"],
    // Subject must not be empty
    "subject-empty": [2, "never"],
    // Subject should not end with period
    "subject-full-stop": [2, "never", "."],
    // Subject should be sentence case (lowercase first letter)
    "subject-case": [2, "always", "sentence-case"],
    // Header should be max 100 characters
    "header-max-length": [2, "always", 100],
    // Body lines should be max 100 characters
    "body-max-line-length": [2, "always", 100],
    // Footer lines should be max 100 characters
    "footer-max-line-length": [2, "always", 100],
  },
};
