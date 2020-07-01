import kue from 'kue';
import TransactionManager from './TransactionManager';
import config from '../../config/config';

const queue = kue.createQueue();
const transactionManager = new TransactionManager();

let Model;
const setModel = (TransactionModel) => {
    Model = TransactionModel;
};

const add = (transaction) => {
    const job = queue
                    .create('transactions', transaction)
                    .priority('high')
                    .attempts(3)
                    .backoff({delay: 6000, type:'fixed'})
                    .save();
    job.on('start', () => {
        console.log('Queue job started', job.id);
        // const t_data = job.data;
    });

    job.on('complete', (result) => {
        console.log('Job completed with data ');
    });

    job.on('failed', (errorMessage) => {
        console.log(`Job failed ${errorMessage}`);
    });
};

const setStatus = (transaction, status, statusDescription) => {
    return new Promise((resolve, reject) => {
        Model.findOne({ where: { id: transaction.id } })
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

const sendTransaction = (transaction, done) => {
    const params = {
        to: transaction.toAcc.address,
        from: "0x908991b223b90e730d8274df43b741b61c77f47f",//transaction.fromAcc.address,
        privateKey: transaction.fromAcc.privateKey,
        amount: transaction.amount,
        contractAddress: transaction.currency.address, // Need this address to be of token
    };

    return setStatus(transaction, 'pending').then(() => {
        transactionManager.addTransaction(params, (receipt) => {
            setStatus(transaction, 'completed', JSON.stringify(receipt)).then(() => {
                done(null, receipt);
            });
        }, (error) => {
            setStatus(transaction, 'failed', error.toString()).then(() => {
                done(error);
            });
        });
        done(null, transaction);
        return null;
    });
};

const processQueue = () => {
    queue.process('transactions', (job, done) => {
        sendTransaction(job.data, done);
        // done();
    });
};

processQueue();  

export default {
    setModel,
    add,
};
