import cron from 'node-cron';
import db from '../../config/sequelize';
import { getReceipt } from '../lib/web3';

const Transaction = db.Transaction;

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
                }
            })
            .catch(console.error);
    }
};

const fetchTransactions = () => {
    return Transaction.findAll({
        where: {
            status: 'pending',
        },
        attributes: ['status', 'id', 'transactionHash'],
    });
};

const startProcessing = () => {
    fetchTransactions()
      .then((transactions) => {
          generateBulkQuery(transactions);
      })
      .catch(console.log);
};

// Runs a task every minute
const task = cron.schedule('* * * * *', () => {
    fetchTransactions()
        .then((transactions) => {
            generateBulkQuery(transactions);
        })
        .catch(console.log);
});

task.start();
// task.stop();
startProcessing();
export default cron;
