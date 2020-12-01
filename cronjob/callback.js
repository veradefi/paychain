import request from 'request';
import config from '../config/config'
import db from '../config/sequelize';
import logger from '../config/winston'

const Transaction = db.Transaction;

const getTransactions = () => {
    return Transaction.findAll({
        where: {
            status: 'completed',
            callback_sent: {
                $ne: true
            }
        },
        limit: parseInt(config.callback.size),
    });
};

const updateCallbackStatus = (transactionIds) => {
    return new Promise((resolve, reject) => {
        Transaction
            .update({
                callback_sent: true,
            }, { 
              where: { 
                id: {
                  $in: transactionIds
                }
              },
              hooks: false,
              validate: false,
            })
            .then((newTransaction) => {
                resolve();
            })
            .catch(reject);
    });
};
const interval = setInterval(() => {
    getTransactions()
        .then((transactions) => {
            request({
                url: config.callback.url,
                method: "POST",
                json: transactions,
            }, (error, response, body) => {
                if(!error) {
                    const transactionIds = transactions.map((transaction => transaction.id))
                    updateCallbackStatus(transactionIds)
                        .then(() => logger.info)
                        .catch(() => logger.warn)
                }
            });
        })
}, config.callback.time);
