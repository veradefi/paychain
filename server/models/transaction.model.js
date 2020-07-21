
import { add as addToQueue, setModel } from '../helpers/queue';
import async from 'async';
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
            type: DataTypes.ENUM('initiated', 'committed', 'pending', 'completed', 'cancelled', 'failed'),
            allowNull: false,
        },
        statusDescription: {
            type: DataTypes.TEXT,
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
    }, {
        hooks: {
            beforeCreate: function(transaction, options) {
                async.parallel([
                    (callback) => {
                        sequelize.models.Account.findOne({
                            where: {
                                id: transaction.from,
                            },
                        })
                        .then(fromAcc => {
                            if (!fromAcc) {
                                callback(new Error("From account does not exist"))
                            } else {
                                callback(null);
                            }
                        })
                        .catch(err => {
                            callback(err);
                        });
                    },
                    (callback) => {
                        sequelize.models.Account.findOne({
                            where: {
                                id: transaction.to,
                            },
                        })
                        .then(toAcc => {
                            if (!toAcc) {
                                callback(new Error("To account does not exist"))
                            } else {
                                callback(null);
                            }
                        })
                        .catch(err => {
                            callback(err);
                        });
                    },
                    (callback) => {
                        sequelize.models.Currency.findOne({
                            where: {
                                id: transaction.currency_id,
                            },
                        })
                        .then(currency => {
                            if (!currency) {
                                callback(new Error("Currency does not exist"))
                            } else {
                                callback(null);
                            }
                        })
                        .catch(err => {
                            callback(err);
                        });
                    }
                ],
                    (err, results) => {
                        if (err) {
                            throw err;
                        }
                    }
                );
            },
            afterCreate: function(transaction, options) {
                sequelize.models.Transaction.findOne({
                    where: {
                        id: transaction.id
                    },
                    include: [
                        { model: sequelize.models.Account, as: 'fromAcc'},
                        { model: sequelize.models.Account, as: 'toAcc'},
                        { model: sequelize.models.Currency, as: 'currency'}
                    ]
                })
                .then(newTransaction => {
                    addToQueue('transactions', newTransaction);
                });
            }
        }
    });

    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'from', targetKey: 'id', as: 'fromAcc', onDelete: 'cascade'});
    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'to', targetKey: 'id', as: 'toAcc', onDelete: 'cascade'});
    Transaction.belongsTo(sequelize.models.Currency, {foreignKey: 'currency_id', targetKey: 'id', as: 'currency', onDelete: 'cascade'});

    setModel(Transaction);
    return Transaction;
};
