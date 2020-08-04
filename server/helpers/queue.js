import kue from 'kue';
import config from '../../config/config'
import TransactionManager from './TransactionManager';
import { shouldRetry } from './helpers';

const queue = kue.createQueue({
  prefix: 'q',
  redis: {
    port: config.queue.port,
    host: config.queue.host,
    auth: config.queue.password,
  },
});

const transactionManager = new TransactionManager();

let Model;
const setModel = (TransactionModel) => {
    Model = TransactionModel;
};

const add = (queueType, transaction, delay = 0) => {
    const job = queue
                    .create(queueType, transaction)
                    .priority('high')
                    .delay(delay)
                    .save();
    job.on('start', () => {
        console.log('Queue job started', job.id);
    });
};

const setStatus = (transaction, status, params) => {
    return new Promise((resolve, reject) => {
        Model.findOne({ where: { id: transaction.id } })
            .then((newTransaction) => {
                if (newTransaction) {
                    params = params || {};
                    params.status = status;
                    return newTransaction.updateAttributes(params)
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

const sendTransaction = (transaction, done) => {
    const params = {
        to: transaction.toAcc.address,
        from: transaction.fromAcc.address,
        privateKey: transaction.fromAcc.privateKey,
        amount: transaction.amount,
        contractAddress: transaction.currency.address, // Need this address to be of token
    };

    return setStatus(transaction, 'committed', {
        statusDescription: '',
        transactionHash: '',
        store_id: '',
        processedAt: null
    }).then(() => {
        transactionManager.addTransaction(params, (transactionHash, nonce) => {
            // console.log("transactionHash", JSON.stringify(transactionHash));
            setStatus(transaction, 'pending', {
                statusDescription: '',
                transactionHash: transactionHash,
                store_id: nonce,
                processedAt: new Date(),
            }).then(() => {
                // done(null, transactionHash);
            });
        }, (receipt) => {
            // console.log("receipt", JSON.stringify(receipt));
            setStatus(transaction, 'completed', {
                statusDescription: JSON.stringify(receipt),
            }).then(() => {
                // done(null, receipt);
            });
        }, (error, nonce) => {
            setStatus(transaction, 'failed', {
                statusDescription: error.toString()
            }).then(() => {
                // done(error);
                if (shouldRetry(error)) {
                  add(config.queue.name, transaction, 10000);
                }
            });
        });
        done(null, transaction);
        return null;
    });
};

const processQueue = () => {
    console.log('processing queue');
    queue.process(config.queue.name, (job, done) => {
        sendTransaction(job.data, done);
    });
};

export default {
    setModel,
    add,
    processQueue,
};
