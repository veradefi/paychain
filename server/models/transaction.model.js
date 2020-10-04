
import client from '../../queue/client'
import config from '../../config/config'
import async from 'async';
import BN from 'bn.js'
const uuidv1 = require('uuid/v1');
/**
 * Transaction Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: () => {
              const uuid = uuidv1();
              const sorted_uuid = (uuid.substring(14, 18) + '-' + uuid.substring(9, 13)
                     + '-' + uuid.substring(0, 8) + '-' + uuid.substring(19, 23) + '-' + uuid.substring(24));
              return sorted_uuid;
            }
        },
        amount: {
            type: DataTypes.STRING,
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
        tableName: 'transactions',
        getterMethods: {
            amount() {
                return this.getDataValue('amount').toString();
            },
        },
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
                    let fromBalance = new BN(fromAcc.balance);
                    let amount = new BN(this.amount);
                    if (!fromAcc || fromBalance.cmp(amount) == -1) {
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
                const updatedAttributes = instance.changed() || [];
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
                .then(async newTransaction =>  {
                    if (newTransaction.fromAcc.id != newTransaction.toAcc.id) {
                      try {
                        
                        transaction = await sequelize.transaction();

                        let fromBalance = new BN(newTransaction.fromAcc.balance);
                        fromBalance = fromBalance.sub(new BN(newTransaction.amount));
                        await newTransaction.fromAcc.updateAttributes({
                            balance: fromBalance.toString(),
                        }, transaction);

                        let toBalance = new BN(newTransaction.toAcc.balance);
                        toBalance = toBalance.add(new BN(newTransaction.amount));
                        await newTransaction.toAcc.updateAttributes({
                            balance: toBalance.toString(),
                        }, transaction);

                        // commit
                        await transaction.commit();
                      } catch(err) {
                        await transaction.rollback()
                      }
                      
                    }
                    client.rpush(config.queue.name, JSON.stringify(newTransaction), (err, res) => {});
                });
            },
        }
    });

    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'from', targetKey: 'id', as: 'fromAcc', onDelete: 'cascade'});
    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'to', targetKey: 'id', as: 'toAcc', onDelete: 'cascade'});
    Transaction.belongsTo(sequelize.models.Currency, {foreignKey: 'currency_id', targetKey: 'id', as: 'currency', onDelete: 'cascade'});

    return Transaction;
};
