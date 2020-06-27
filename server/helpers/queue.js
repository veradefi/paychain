import kue from 'kue';
import { transfer } from '../lib/web3';

const queue = kue.createQueue();

const add = (transaction) => {
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

const sendTransaction = (transaction, done) => {
    const params = {
        to: transaction.toAcc.address,
        from: transaction.fromAcc.address,
        privateKey: transaction.fromAcc.privateKey,
        amount: transaction.amount,
        contractAddress: transaction.currency.address, // Need this address to be of token
    };

    transfer(params).then((receipt) => {
        console.log(receipt);
        done(receipt);
    })
    .catch((error) => {
        console.error(error);
        done(error);
    });
};

const processQueue = () => {
    queue.process('transactions', (job, done) => {
        sendTransaction(job.data, done);
    });
};

processQueue();

module.exports = {
    add,
};
