

/**
 * Account Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Currency = sequelize.define('Currency', {
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
    });

    return Currency;
};
