import cron from 'node-cron';
import db from '../config/sequelize';
import config from '../config/config'

import { getReceipt } from '../server/lib/web3';
import { add as addToQueue } from '../queue/queue';
import logger from '../config/winston'
import Sequelize from 'sequelize'

const Transaction = db.Transaction;

const updateStatus = (transaction, status) => {
    return new Promise((resolve, reject) => {
        Transaction
            .update({
                status,
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
                    if (receipt.status) {
                        updateStatus(transactions[i], 'completed', JSON.stringify(receipt));
                    } else {
                        updateStatus(transactions[i], 'failed', JSON.stringify(receipt));
                    }
                }
            })
            .catch(logger.warn);
    }
};

// Re-queue transactions that are not processed by the queue handler for a long time
const fetchTransactionStuckInRedis = () => {
    // const interval = 300 + 5; // 300 minutes
    return Transaction.findAll({
        where: {
            status: 'initiated',
            updatedAt: {
                [Sequelize.Op.lt]: db.sequelize.fn('DATE_SUB', db.sequelize.fn('NOW'), db.sequelize.literal('INTERVAL 1 DAY'))
            }
        },
        include: [
            { model: db.sequelize.models.Account, as: 'fromAcc'},
            { model: db.sequelize.models.Account, as: 'toAcc'},
            { model: db.sequelize.models.Currency, as: 'currency'},
        ],
        limit: 100,
    });
};

const fetchTransactionStuckInBlockchain = () => {
    // const interval = 300 + 5; // 300 minutes
    return Transaction.findAll({
        where: {
            status: 'pending',
            processedAt: {
                [Sequelize.Op.lt]: db.sequelize.fn('DATE_SUB', db.sequelize.fn('NOW'), db.sequelize.literal('INTERVAL 1 DAY'))
            }
        },
        include: [
            { model: db.sequelize.models.Account, as: 'fromAcc'},
            { model: db.sequelize.models.Account, as: 'toAcc'},
            { model: db.sequelize.models.Currency, as: 'currency'},
        ],
        limit: 100,
    });
};

const fetchTransactionPendingConfirmation = () => {
    return Transaction.findAll({
        where: {
            status: 'pending',
            processedAt: {
                [Sequelize.Op.gt]: db.sequelize.fn('DATE_SUB', db.sequelize.fn('NOW'), db.sequelize.literal('INTERVAL 1 DAY'))
            }
        },
        group: ['transactionHash'],
        attributes: ['transactionHash'],
        limit: 100,
    });
}

const processTransactionsStuckInBlockchain = () => {
    fetchTransactionStuckInBlockchain()
      .then((transactions) => {
          console.log("stuck in blockchain: ", transactions.length)
          for (let i = 0; i < transactions.length; i++) {
              addToQueue(config.queue.name, transactions[i]);
          }
      })
      .catch(logger.warn);
};

const processTransactionsStuckInRedis = () => {
    fetchTransactionStuckInRedis()
      .then((transactions) => {
          console.log("stuck in queue: ", transactions.length)
          for (let i = 0; i < transactions.length; i++) {
              addToQueue(config.queue.name, transactions[i]);
          }
      })
      .catch(logger.warn);
};

const processTransactionsPendingConfirmation = () => {
    fetchTransactionPendingConfirmation()
      .then((transactions) => {
          generateBulkQuery(transactions);
          console.log("pending confirmation: ", transactions.length)
          // console.log(transactions.length)
      })
      .catch(logger.warn);
};

// Runs a task every minute
const pendingConfirmation = cron.schedule('* * * * *', () => {
    processTransactionsPendingConfirmation();
});

const stuckInBlockchain = cron.schedule('* * * * *', () => {
    processTransactionsStuckInBlockchain();
});

const stuckInRedis = cron.schedule('* * * * *', () => {
    processTransactionsStuckInRedis();
});

pendingConfirmation.start();
// completedTask.stop();

stuckInBlockchain.start();
// pendingTask.stop();

stuckInRedis.start();
// startProcessing();

setTimeout(() => {
    processTransactionsStuckInRedis();
    processTransactionsStuckInBlockchain();
    processTransactionsPendingConfirmation();
}, 1000);

export default cron;
