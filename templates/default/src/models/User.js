/**
 * User Model
 *
 * User model definition for {{projectName}}
 * @author {{author}}
 */

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        },
        set(value) {
          // Trim to prevent issues with NO PAD collation (utf8mb4_0900_ai_ci)
          this.setDataValue('email', value ? value.trim() : value);
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, 255]
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50]
        },
        set(value) {
          // Trim to prevent issues with NO PAD collation (utf8mb4_0900_ai_ci)
          this.setDataValue('firstName', value ? value.trim() : value);
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50]
        },
        set(value) {
          // Trim to prevent issues with NO PAD collation (utf8mb4_0900_ai_ci)
          this.setDataValue('lastName', value ? value.trim() : value);
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async user => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async user => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        }
      }
    }
  );

  // Instance methods
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  // Class methods
  User.associate = function (_models) {
    // Define associations here
    // User.hasMany(models.Post, { foreignKey: 'userId' });
  };

  return User;
};
