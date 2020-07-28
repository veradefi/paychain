import { encrypt } from '../helpers/crypto';
import { getBalance } from '../lib/web3';
/**
 * Account Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
        balance: {
            type: DataTypes.DECIMAL(40,0),
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
            afterCreate: function(account, options) {
                sequelize.models.Currency.findOne({
                    where: {
                        symbol: 'DC',
                    },
                })
                .then((currency) => {
                    getBalance(currency.address, account.address)
                        .then((balance) => {
                            account.updateAttributes({
                                balance: balance,
                            })
                            .catch((err) => console.error(err));
                        });
                })
                .catch(console.error);
            }
        }
    });

    Account.prototype.toJSON = function () {
        const account = Object.assign({}, this.get());

        delete account.privateKey;
        return account;
    };

    return Account;
};
