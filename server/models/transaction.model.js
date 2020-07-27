
import { add as addToQueue, setModel } from '../helpers/queue';
import async from 'async';
import BN from 'bn.js';
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
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true,
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
        transactionHash: {
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
    }, {
        validate: {
            fromAccountExists: function (next) {
                sequelize.models.Account.findOne({
                    where: {
                        id: this.from,
                    },
                })
                .then((fromAcc) => {
                    if (!fromAcc) {
                        next(new Error("From account does not exist"));
                    } else {
                        next();
                    }
                })
                .catch(next);
            },
            toAccountExists: function (next) {
                sequelize.models.Account.findOne({
                    where: {
                        id: this.to,
                    },
                })
                .then((fromAcc) => {
                    if (!fromAcc) {
                        next(new Error("To account does not exist"));
                    } else {
                        next();
                    }
                })
                .catch(next);
            },
            currencyExists: function (next) {
                sequelize.models.Currency.findOne({
                    where: {
                        id: this.currency_id,
                    },
                })
                .then(currency => {
                    if (!currency) {
                        next(new Error("Currency does not exist"));
                    } else {
                        next();
                    }
                })
                .catch(next);
            },
            hasEnoughBalance: function (next) {
                sequelize.models.Account.findOne({
                    where: {
                        id: this.from,
                    },
                })
                .then((fromAcc) => {
                    if (fromAcc.balance < this.amount) {
                        next(new Error("Insufficient balance"));
                    } else {
                        next();
                    }
                })
                .catch(next);
            }
        },
        hooks: {
            beforeUpdate: function (instance, options){
                const updatedAttributes = instance.changed();
                if (updatedAttributes.indexOf('status') >= 0 && ['failed','completed'].indexOf(instance.status) >= 0) {
                    instance.processedAt = new Date();
                }
            },
            afterCreate: function(transaction, options) {
                sequelize.models.Transaction.findOne({
                    where: {
                        id: transaction.id,
                    },
                    include: [
                        { model: sequelize.models.Account, as: 'fromAcc'},
                        { model: sequelize.models.Account, as: 'toAcc'},
                        { model: sequelize.models.Currency, as: 'currency'},
                    ],
                })
                .then(newTransaction => {
                    sequelize.transaction((t) => {
                        let fromBalance = new BN(newTransaction.fromAcc.balance);
                        fromBalance = fromBalance.sub(new BN(newTransaction.amount));
                        return newTransaction.fromAcc.updateAttributes({
                            balance: fromBalance.toString(),
                        })
                        .then(() => {
                            let toBalance = new BN(newTransaction.toAcc.balance);
                            toBalance = toBalance.add(new BN(newTransaction.amount));
                            return newTransaction.toAcc.updateAttributes({
                                balance: toBalance.toString(),
                            });
                        });
                    })
                    .then((result) => {
                        addToQueue('transactions', newTransaction);
                    })
                    .catch((err) => {
                        throw err;
                    });
                });
            },
        }
    });

    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'from', targetKey: 'id', as: 'fromAcc', onDelete: 'cascade'});
    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'to', targetKey: 'id', as: 'toAcc', onDelete: 'cascade'});
    Transaction.belongsTo(sequelize.models.Currency, {foreignKey: 'currency_id', targetKey: 'id', as: 'currency', onDelete: 'cascade'});

    setModel(Transaction);
    return Transaction;
};
