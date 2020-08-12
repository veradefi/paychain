import kue from 'kue';
import redis from 'redis';
import bluebird from 'bluebird';
import config from '../../config/config'
import TransactionManager from './TransactionManager';
import { shouldRetry } from './helpers';
import { getTransactionCount, signTransaction, web3 } from '../lib/web3';
import "babel-polyfill";


const client = redis.createClient();
bluebird.promisifyAll(redis);

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

    client.rpush('transactions', JSON.stringify(transaction), (err, res) => console.log(err, res));

    // const job = queue
    //                 .create(queueType, transaction)
    //                 .priority('high')
    //                 .delay(delay)
    //                 .save();
    // job.on('start', () => {
    //     console.log('Queue job started', job.id);
    // });
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

    const default_address = process.env.DEFAULT_ADDRESS;

    client.watch(config.queue.name + ":" + default_address, async ( err ) => {

        const nonce = await client.getAsync(config.queue.name + ":" + default_address);
        const nonceInt = parseInt(nonce);
        console.log("nonce", nonce)

        const transactions = await client.lrangeAsync(config.queue.name, 0, 99);
        const multi        = client.multi();
        const setCommand   = multi.set(config.queue.name + ":" + default_address, parseInt(nonceInt + transactions.length));
        const trimCommand  = multi.ltrim(config.queue.name, 99, 10000000000, redis.print);
        const results      = await multi.execAsync();

        if (results !== null && transactions.length > 0) {

            transactionManager.sendBatchTransactions(nonceInt, transactions, 
                (transaction, transactionHash, nonce) => {
                    console.log(transactionHash);
                    setStatus(transaction, 'pending', {
                        statusDescription: '',
                        transactionHash: transactionHash,
                        store_id: nonce,
                        processedAt: new Date(),
                    }).then(() => {
                        // done(null, transactionHash);
                    });
                }, (transaction, receipt) => {
                    // console.log("receipt", JSON.stringify(receipt));
                    setStatus(transaction, 'completed', {
                        statusDescription: JSON.stringify(receipt),
                    }).then(() => {
                        // done(null, receipt);
                    });
                }, (transaction, error, nonce) => {
                    console.log(error.toString());
                    setStatus(transaction, 'failed', {
                        statusDescription: error.toString()
                    }).then(() => {
                        // done(error);
                        if (shouldRetry(error)) {
                            add(config.queue.name, transaction);
                        }
                    });
                });
        }
    });
};

const startQueue = () => {
    setInterval(() => {
        processQueue();
    }, 10000);
};

const stopQueue = () => {
    // clearInterval();
};

const initQueue = () => {
    const default_address = process.env.DEFAULT_ADDRESS;
    client.watch(config.queue.name + ":" + default_address, async ( err )=> {
        if(err) throw err;

        const count    = await getTransactionCount(default_address);
        const multi    = await client.multi().set(config.queue.name + ":" + default_address, parseInt(count));
        const results  = await multi.execAsync();
        if (results !== null) {
            // Start first batch of the queue immediately
            processQueue();

            startQueue();
        }
    });

};

export default {
    setModel,
    add,
    processQueue,
    initQueue,
};
