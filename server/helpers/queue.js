import kue from 'kue';
import config from '../../config/config'
import TransactionManager from './TransactionManager';
import { shouldRetry } from './helpers';
import redis from 'redis';
import { getTransactionCount, signTransaction, web3 } from '../lib/web3';

const client = redis.createClient();

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

const setStatus = (transaction_id, status, params) => {
    return new Promise((resolve, reject) => {
        Model.findOne({ where: { id: transaction_id } })
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

    client
        .watch("transactions:0x908991b223b90e730d8274df43b741b61c77f47f", function( err ){

            client.get('transactions:0x908991b223b90e730d8274df43b741b61c77f47f', (err, nonce) => {
                nonce = parseInt(nonce);
                console.log("nonce", nonce)
                client.lrange('transactions', 0, 999, (err, transactions) => {
                    if (err) throw err;
                    client
                        .multi()
                        .set("transactions:0x908991b223b90e730d8274df43b741b61c77f47f", parseInt(nonce + transactions.length))
                        .ltrim('transactions', 999, 10000000000, redis.print)
                        .exec(function(err, results) {
                            if(err) throw err;
                            
                            if(results !== null) {
                                transactionManager.sendBatchTransactions(parseInt(nonce), transactions, 
                                    (transaction_id, transactionHash, nonce) => {
                                        setStatus(transaction_id, 'pending', {
                                            statusDescription: '',
                                            transactionHash: transactionHash,
                                            store_id: nonce,
                                            processedAt: new Date(),
                                        }).then(() => {
                                            // done(null, transactionHash);
                                        });
                                    }, (transaction_id, receipt) => {
                                        // console.log("receipt", JSON.stringify(receipt));
                                        setStatus(transaction_id, 'completed', {
                                            statusDescription: JSON.stringify(receipt),
                                        }).then(() => {
                                            // done(null, receipt);
                                        });
                                    }, (transaction_id, error, nonce) => {
                                        setStatus(transaction_id, 'failed', {
                                            statusDescription: error.toString()
                                        }).then(() => {
                                            // done(error);
                                            if (shouldRetry(error)) {
                                                initQueue();
                                            }
                                        });
                                    });
                            }
                        });
                });
            });
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
    console.log('processing queue');
    // queue.process(config.queue.name, (job, done) => {
    //     sendTransaction(job.data, done);
    // });

    client.watch("transactions:0x908991b223b90e730d8274df43b741b61c77f47f", function( err ){
        if(err) throw err;

        getTransactionCount('0x908991b223b90e730d8274df43b741b61c77f47f').then((count) => {
            client
                .multi()
                .set("transactions:0x908991b223b90e730d8274df43b741b61c77f47f", count)
                .exec(function(err, results) {
                    
                    if(err) throw err;
                    
                    if(results !== null) {
                        startQueue();
                    }
                });
        });
    });

};

export default {
    setModel,
    add,
    processQueue,
    initQueue,
};
