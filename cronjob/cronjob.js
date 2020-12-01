import cron from 'node-cron';
import db from '../config/sequelize';
import config from '../config/config'

import { getReceipt } from '../server/lib/web3';
import { add as addToQueue } from '../queue/queue';
import logger from '../config/winston'

const Transaction = db.Transaction;

const updateStatus = (transaction, status, statusDescription) => {
    return new Promise((resolve, reject) => {
        Transaction
            .update({
                status,
                statusDescription,
            }, { 
              where: { 
                transactionHash: transaction.transactionHash 
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

const generateBulkQuery = (transactions) => {
    for (let i = 0; i < transactions.length; i += 1) {
        getReceipt(transactions[i].transactionHash)
            .then((receipt) => {
                if (receipt) {
                    updateStatus(transactions[i], 'completed', JSON.stringify(receipt));
                } else {

                }
            })
            .catch(logger.warn);
    }
};

// Re-queue transactions that are not processed by the queue handler for a long time
const fetchQueueTransactions = () => {
    // const interval = 300 + 5; // 300 minutes
    return Transaction.findAll({
        where: {
            status: 'initiated',
            updatedAt: {
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
                $gt: db.sequelize.fn('DATE_SUB', db.sequelize.fn('NOW'), db.sequelize.literal('INTERVAL 10 DAY'))
            }
        },
        group: ['transactionHash'],
        attributes: ['transactionHash'],
    });
}

const processStuckTransactions = () => {
    fetchStuckTransactions()
      .then((transactions) => {
          for (let i = 0; i < transactions.length; i++) {
              addToQueue(config.queue.name, transactions[i]);
          }
      })
      .catch(logger.warn);
};

const processQueueTransactions = () => {
    fetchQueueTransactions()
      .then((transactions) => {
          console.log("stuck in queue: ", transactions.length)
          for (let i = 0; i < transactions.length; i++) {
              addToQueue(config.queue.name, transactions[i]);
          }
      })
      .catch(logger.warn);
};

const processPendingTransactions = () => {
    fetchPendingTransactions()
      .then((transactions) => {
          generateBulkQuery(transactions);
          console.log("pending confirmation: ", transactions.length)
          // console.log(transactions.length)
      })
      .catch(logger.warn);
};

// Runs a task every minute
const completedTask = cron.schedule('* * * * *', () => {
    processStuckTransactions();
});

const pendingTask = cron.schedule('* * * * *', () => {
    processPendingTransactions();
});

const queueTask = cron.schedule('* * * * *', () => {
    processQueueTransactions();
});

completedTask.start();
completedTask.stop();

pendingTask.start();
// pendingTask.stop();

queueTask.start();
// startProcessing();

setTimeout(() => {
    // processStuckTransactions();
    
    processQueueTransactions();
    processPendingTransactions();
}, 1000);

export default cron;
