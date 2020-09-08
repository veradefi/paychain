import kue from 'kue';
import redis from 'redis';
import bluebird from 'bluebird';
import config from '../config/config'
import TransactionManager from './TransactionManager';
import { shouldRetry } from '../server/helpers/helpers';
import { getTransactionCount, signTransaction, web3 } from '../server/lib/web3';
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

    client.rpush(config.queue.name, JSON.stringify(transaction), (err, res) => {});
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

const processQueue = () => {

    const default_address = process.env.DEFAULT_ADDRESS;

    client.watch(config.queue.name + ":" + default_address, async ( err ) => {

        if (err) throw err;
        const nonce = await client.getAsync(config.queue.name + ":" + default_address);
        const web3Nonce = await getTransactionCount(default_address);
        let nonceInt = parseInt(nonce);

        // If a transaction is made outside of the app or nonce lags behind actual transaction count
        if (web3Nonce > nonceInt) {
            nonceInt = parseInt(web3Nonce);
            await client.set(config.queue.name + ":" + default_address, nonceInt);
        };

        console.log("nonce: ", nonceInt, ", web3Nonce: " , web3Nonce);

        const transactions   = await client.lrangeAsync(config.queue.name, 0, 199);
        const removeCommand  = await client.ltrimAsync(config.queue.name, 199, 100000);
        const nonceIncrement = 1 + nonceInt;
        const multi          = client.multi()
                                     .set(config.queue.name + ":" + default_address, nonceIncrement);

        if (transactions.length > 0) {

            transactionManager.sendBatchTransactions(nonceInt, transactions, 
                (transaction, transactionHash, nonce) => {
                    setStatus(transaction, 'pending', {
                        statusDescription: '',
                        transactionHash: transactionHash,
                        store_id: nonce,
                        processedAt: new Date(),
                    }).then(() => {
                        // done(null, transactionHash);
                    });
                }, (transaction, receipt) => {
                    setStatus(transaction, 'completed', {
                        statusDescription: JSON.stringify(receipt),
                    }).then(() => {
                        // done(null, receipt);
                    });
                }, (transaction, error, nonce) => {
                    setStatus(transaction, 'failed', {
                        statusDescription: error.toString()
                    }).then(() => {
                        add(config.queue.name, transaction);
                    });
                }, (err) => {
                    if (!err) {
                        multi
                            .execAsync()
                            .then(() => processQueue())
                            .catch((err) => processQueue());
                    } else {
                        processQueue();
                    }
                });
        } else {
          setTimeout(() => {
              processQueue();
          }, 1000)
        }
    });
};

// const startQueue = () => {
//     setInterval(() => {
//         processQueue();
//     }, 2000);
// };

// const stopQueue = () => {
//     // clearInterval();
// };

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
        }
    });

};

export default {
    setModel,
    add,
    processQueue,
    initQueue,
};
