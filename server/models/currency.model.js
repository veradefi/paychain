const uuidv1 = require('uuid/v1');


/**
 * Account Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Currency = sequelize.define('Currency', {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: () => {
              const uuid = uuidv1();
              const sorted_uuid = (uuid.substring(14, 18) + '-' + uuid.substring(9, 13)
                     + '-' + uuid.substring(0, 8) + '-' + uuid.substring(19, 23) + '-' + uuid.substring(24));
              return sorted_uuid;
            }
        },
        Type: {
            /* eslint-disable */
            type: DataTypes.ENUM('ERC20'),
            allowNull: false,
            defaultValue: 'ERC20'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.NOW,
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        short_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        symbol: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'currencies'
    });

    return Currency;
};
