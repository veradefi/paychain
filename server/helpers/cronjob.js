import cron from 'node-cron';
import db from '../../config/sequelize';
import { getReceipt } from '../lib/web3';
import { add as addToQueue, setModel } from './queue';

const Transaction = db.Transaction;
setModel(Transaction);

const updateStatus = (transaction, status, statusDescription) => {
    return new Promise((resolve, reject) => {
        Transaction.findOne({ where: { id: transaction.id } })
            .then((newTransaction) => {
                if (newTransaction) {
                    return newTransaction.updateAttributes({
                        status,
                        statusDescription,
                    })
                    .then(() => {
                        resolve(newTransaction);
                    })
                    .catch(reject);
                }
                return reject();
            })
            .catch(reject);
    });
};

const generateBulkQuery = (transactions) => {
    for (let i = 0; i < transactions.length; i += 1) {
        getReceipt(transactions[i].transactionHash)
            .then((receipt) => {
                if (receipt) {
                    updateStatus(transactions[i], 'completed', JSON.stringify(receipt));
                } else {

                }
            })
            .catch(console.error);
    }
};

const fetchStuckTransactions = () => {
    // const interval = 300 + 5; // 300 minutes
    return Transaction.findAll({
        where: {
            status: 'pending',
            processedAt: {
                $lt: db.sequelize.fn('DATE_SUB', db.sequelize.fn('NOW'), db.sequelize.literal('INTERVAL 5 MINUTE'))
            }
        },
        include: [
            { model: db.sequelize.models.Account, as: 'fromAcc'},
            { model: db.sequelize.models.Account, as: 'toAcc'},
            { model: db.sequelize.models.Currency, as: 'currency'},
        ],
    });
};

const fetchPendingTransactions = () => {
    return Transaction.findAll({
        where: {
            status: 'pending',
            processedAt: {
                $gt: db.sequelize.fn('DATE_SUB', db.sequelize.fn('NOW'), db.sequelize.literal('INTERVAL 5 MINUTE'))
            }
        },
        attributes: ['status', 'id', 'transactionHash', 'processedAt'],
    });
}

const processStuckTransactions = () => {
    fetchStuckTransactions()
      .then((transactions) => {
          for (let i = 0; i < transactions.length; i++) {
              addToQueue('transactions', transactions[i]);
          }
      })
      .catch(console.log);
};

const processPendingTransactions = () => {
    fetchPendingTransactions()
      .then((transactions) => {
          generateBulkQuery(transactions);
      })
      .catch(console.log);
};

// Runs a task every minute
const completedTask = cron.schedule('* * * * *', () => {
    processStuckTransactions();
});

const pendingTask = cron.schedule('* * * * *', () => {
    processPendingTransactions();
});

completedTask.start();
completedTask.stop();

pendingTask.start();
pendingTask.stop();

// startProcessing();

setTimeout(() => {
    // processStuckTransactions();
    // processPendingTransactions();
}, 1000);

export default cron;
