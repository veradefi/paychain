import { encrypt } from '../helpers/crypto';
import { getBalance } from '../lib/web3';
/**
 * Account Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        balance: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.NOW,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        privateKey: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'accounts',
        validate: {
            noNegativeBalance: function (next) {
                if (this.balance < 0) {
                    next(new Error("Balance cannot be negative"));
                } else {
                    next();
                }
            }
        },
        setterMethods: {
            privateKey(value) {
                this.setDataValue('privateKey', encrypt(value));
            },
        },
        hooks: {
            beforeCreate: function(account, options) {
                return new Promise((resolve, reject) => {
                    sequelize.models.Currency.findOne({
                        where: {
                            symbol: 'DC',
                        },
                    })
                    .then((currency) => {
                        getBalance(currency.address, account.address)
                            .then((balance) => {
                                account.balance = balance;
                                resolve(account)
                            })
                            .catch((err) => {
                                console.log(err)
                                // reject(err)
                                resolve(account);
                            });
                    })
                    .catch(reject);
                });
            }
        }
    });

    Account.prototype.toJSON = function () {
        const account = Object.assign({}, this.get());

        delete account.privateKey;
        account.balance = account.balance.toString();
        return account;
    };

    return Account;
};
