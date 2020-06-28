import kue from 'kue';
import { transfer } from '../lib/web3';

const queue = kue.createQueue();
let Model;
const add = (transaction, TransactionModel) => {
    // TODO: Need a better way to handle this
    Model = TransactionModel;
    const job = queue
                    .create('transactions', transaction)
                    .priority('high')
                    .attempts(1)
                    .backoff({ type: 'exponential' })
                    .save();
    job.on('start', () => {
        console.log('Queue job started', job.id);
        // const t_data = job.data;
    });

    job.on('complete', (result) => {
        console.log('Job completed with data ', result);
    });

    job.on('failed', (errorMessage) => {
        console.log(`Job failed ${errorMessage}`);
    });
};

const setStatus = (transaction, status) => {
    return new Promise((resolve, reject) => {
        Model.findOne({ where: { id: transaction.id } })
            .then((newTransaction) => {
                if (newTransaction) {
                    newTransaction.updateAttributes({
                        status,
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
        from: transaction.fromAcc.address,
        privateKey: transaction.fromAcc.privateKey,
        amount: transaction.amount,
        contractAddress: transaction.currency.address, // Need this address to be of token
    };

    setStatus(transaction, 'pending').then(() => {
        transfer(params).then((receipt) => {
            console.log(receipt);
            setStatus(transaction, 'completed').then(() => {
                done(receipt);
            });
        })
        .catch((error) => {
            console.error(error);
            setStatus(transaction, 'failed').then(() => {
                done(error);
            });
        });
    });
};

const processQueue = () => {
    queue.process('transactions', (job, done) => {
        sendTransaction(job.data, done);
    });
};

processQueue();

export default {

    add,
};
