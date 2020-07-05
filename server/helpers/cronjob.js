import cron from 'node-cron';
import db from '../../config/sequelize';
import { getReceipt } from '../lib/web3';

const Transaction = db.Transaction;

const generateBulkQuery = (transactions) => {
    for (let i = 0; i < transactions.length; i++) {
        getReceipt(transactions[i].statusDescription)
            .then((receipt) => {
                console.log(receipt);
                if (receipt) {
                    updateStatus(transactions[i], 'completed', JSON.stringify(receipt));
                }
            })
            .catch(console.error);
    }
};

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
                } else {
                    reject();
                }
            })
            .catch(reject);
    });
};


const fetchTransactions = () => {
    return Transaction.findAll({
        where: {
            status: 'pending'
        },
        attributes: ['status', 'id', 'statusDescription']
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
const task = cron.schedule('* * * * *', function(){
    fetchTransactions()
        .then((transactions) => {
            generateBulkQuery(transactions);
        })
        .catch(console.log);
});

task.start();

startProcessing();
export default cron;