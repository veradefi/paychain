

/**
 * Transaction Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.NOW,
        },
        status: {
            /* eslint-disable */
            type: DataTypes.ENUM('initiated', 'committed', 'pending', 'completed', 'cancelled'),
            allowNull: false,
        },
        from: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id',
            },
        },
        to: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id',
            },
        },
        statusDescription: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        application_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        store_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        storetransaction_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });

    return Transaction;
};
