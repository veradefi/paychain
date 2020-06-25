
import { add as addToQueue } from '../helpers/queue';
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
        // from: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: 'accounts',
        //         key: 'id',
        //     },
        // },
        // to: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: 'accounts',
        //         key: 'id',
        //     },
        // },
        currency_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'currencies',
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
    }, {
        hooks: {
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
                .then(t => {
                    // console.log(t.toJSON());
                    addToQueue(t.toJSON());
                });
            }
        }
    });

    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'from', targetKey: 'id', as: 'fromAcc'});
    Transaction.belongsTo(sequelize.models.Account, {foreignKey: 'to', targetKey: 'id', as: 'toAcc'});
    Transaction.belongsTo(sequelize.models.Currency, {foreignKey: 'currency_id', targetKey: 'id', as: 'currency'});

    return Transaction;
};
