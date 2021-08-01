import config from '../config/config'
import client from './client'
import TransactionManager from './TransactionManager';
import { shouldRetry } from '../server/helpers/helpers';
import db from '../config/sequelize'
import { getTransactionCount, signTransaction, web3 } from '../server/lib/web3';
import logger from '../config/winston'
import "babel-polyfill";
import Sequelize from 'sequelize'

const transactionManager = new TransactionManager();

let Model = db.Transaction;

const add = (queueType, transaction, delay = 0) => {
    client.rpush(config.queue.name, JSON.stringify(transaction), (err, res) => {
        if (err) {
            logger.error(err)
        }
    });
};

const setStatus = (transaction, status, params) => {
    return new Promise((resolve, reject) => {
        Model.findOne({ where: { id: transaction.id } })
            .then((newTransaction) => {
                if (newTransaction) {
                    params = params || {};
                    params.status = status;
                    return newTransaction.update(params, {
                        hooks: false,
                        validate: false,
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

const filterProcessedTransactions = (transactions) => {
    const ids = transactions.map(transaction => {
        transaction = JSON.parse(transaction)
        return transaction.id
    })
    return Model.findAll({
        where: {
            status: {
                [Sequelize.Op.notIn]: ['pending', 'completed'],
            },
            id: {
                [Sequelize.Op.in]: ids,
            },
        },
        include: [
            { model: db.sequelize.models.Account, as: 'fromAcc'},
            { model: db.sequelize.models.Account, as: 'toAcc'},
            { model: db.sequelize.models.Currency, as: 'currency'},
        ],
        limit: 100,
    });
}

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

        logger.info(`nonce: ${nonceInt}, web3Nonce: ${web3Nonce} at:  ${new Date()}`)

        const transactions   = await client.lrangeAsync(config.queue.name, 0, config.batch.size - 1);
        const removeCommand  = await client.ltrimAsync(config.queue.name, transactions.length, 100000);
        const nonceIncrement = 1 + nonceInt;
        const multi          = client.multi()
                                     .set(config.queue.name + ":" + default_address, nonceIncrement);

        logger.info(`Transaction to process: ${transactions.length} at: ${new Date()}`);                  
        if (transactions.length > 0) {

            const filteredTransactions = await filterProcessedTransactions(transactions)
            if (filteredTransactions.length <= 0) {
                logger.info(`No new transactions ${new Date()}`);
                setTimeout(() => {
                    processQueue();
                }, config.batch.time)
                return;
            }
            transactionManager.sendBatchTransactions(nonceInt, filteredTransactions, 
                (transaction, transactionHash, nonce) => {
                    setStatus(transaction, 'pending', {
                        statusDescription: '',
                        transactionHash: transactionHash,
                        store_id: nonce,
                        processedAt: new Date(),
                    }).catch((err) => {
                        logger.warn(err)
                    });
                }, (transaction, receipt) => {
                    setStatus(transaction, 'completed', {
                        statusDescription: JSON.stringify(receipt),
                    }).catch((err) => {
                        logger.warn(err)
                    });
                }, (transaction, error, nonce) => {
                    setStatus(transaction, 'failed', {
                        statusDescription: error.toString()
                    }).then(() => {
                        add(config.queue.name, transaction);
                    }).catch((err) => {
                        logger.warn(err)
                    });
                }, (err) => {
                    if (!err) {
                        multi
                            .execAsync()
                            .then(() => setTimeout(() => {
                                processQueue();
                            }, config.batch.time))
                            .catch((err) => setTimeout(() => {
                                processQueue();
                            }, config.batch.time));
                    } else {
                        logger.error(err)
                        setTimeout(() => {
                            processQueue();
                        }, config.batch.time);
                    }
                });
        } else {
          setTimeout(() => {
              processQueue();
          }, config.batch.time)
        }
    });
};

const processNextBatch = () => {
    const batchHoldTime = setInterval(() => {
        console.log("Check time");
        let iterCount = 0;
        const interval = setInterval(async () => {
            console.log("Check size", iterCount);
            iterCount++;
            const transactions   = await client.lrangeAsync(config.queue.name, 0, config.batch.size);
            if (transactions.length >= config.batch.size) {
                console.log("Size found");
                clearInterval(interval);
                processQueue();
            } else if(iterCount >= 5) {
                clearInterval(interval);
                processQueue();
            }
        }, Math.min(config.batch.time, 1000));

    }, config.batch.time);
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

        try {
            const count    = await getTransactionCount(default_address);
            const multi    = await client.multi().set(config.queue.name + ":" + default_address, parseInt(count));
            const results  = await multi.execAsync();
            if (results !== null) {
                // Start first batch of the queue immediately
                console.log("start time", config.batch.time)
                setTimeout(() => {
                    processQueue();
                }, config.batch.time)
            }    
        } catch(e) {
            logger.error(e)
        }
        
    });

};

export default {
    add,
    processQueue,
    initQueue,
};
