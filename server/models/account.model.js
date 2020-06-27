

/**
 * Account Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
        balance: {
            type: DataTypes.INTEGER,
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
    });

    Account.prototype.toJSON = function () {
        const account = Object.assign({}, this.get());

        delete account.privateKey;
        return account;
    };
    return Account;
};
