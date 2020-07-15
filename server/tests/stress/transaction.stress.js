/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import config from '../../../config/config';
import { getAllAccounts, web3 } from '../../lib/web3';

const loadtest = require('loadtest');
const jsonAccounts = require('../../json/accounts.json');

chai.config.includeStack = true;

const apiAccounts = [];
const all_transactions = [];
let tokenContract = {

};
/**
 * root level hooks
 */
before(() => {

});

describe('## Transaction stress tests', () => {
    describe('# Deploy token and balance transfer', () => {
        before((done) => {
            done();
        });

        after((done) => {
            const currency = {
                address: tokenContract.address,
            };
            request(config.api_url)
                .put(`/api/currency/1`)
                .send(currency)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.address).to.equal(tokenContract.address);
                    done();
                })
                .catch(done);


            // db.Currency.findOne({
            //     where: {
            //         symbol: 'DC',
            //     }
            // })
            // .then((currency) => {
            //     if (currency) {
            //         return currency.updateAttributes({
            //             address: tokenContract._address,
            //         })
            //         .then(() => {
            //             done();
            //         })
            //         .catch(done)
            //     } else {
            //         db.Currency.create({
            //             symbol: 'DC',
            //             address: tokenContract._address,
            //             full_name: 'Dummy Coin',
            //             short_name: 'Dummy',
            //         })
            //         .then(() => {
            //             done()
            //         })
            //         .catch(done)
            //     }
            // })
        });

        it('deploy token and init tests', (done) => {
            request(config.api_url)
                .post('/tests/init')
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.success).to.equal(true);
                    expect(res.body.accounts).to.have.lengthOf(10);

                    tokenContract.accounts = res.body.accounts;
                    tokenContract.address = res.body.contractAddress;
                    done();
                })
                .catch(done);
        });
    });


    describe('# Create api accounts', () => {
        after((done) => {
            done();
            // startLoadTesting(done);
        });

        for (let i = 0; i < jsonAccounts.length; i += 1) {
            const account = {
                balance: 0,
                address: jsonAccounts[i].address,
                privateKey: jsonAccounts[i].privateKey,
            };

            it('should create 10 api accounts', (done) => {
                request(config.api_url)
                    .post('/api/accounts')
                    .send(account)
                    .expect(httpStatus.OK)
                    .then((res) => {
                        apiAccounts.push(res.body);
                        done();
                    })
                    .catch(done);
            });
        }
    });
});

// function startLoadTesting(done){
//     const promises = [];
//     const maxRequests = 1000;
//     const requestsPerSecond = 100;

//     const options = {
//         url: 'http://localhost:4000/api/transactions',
//         maxRequests: maxRequests,
//         concurrency: 1,
//         method: 'POST',
//         requestsPerSecond: requestsPerSecond,
//         headers: {
//             'content-type': 'application/json'
//         },
//         contentType: 'application/json',
//         body: {
//             amount: 100,
//             to: 2,
//             from: 1,
//             currency_id: 1,
//         },
//         statusCallback: (error, result, latency) => {
//             const promise = waitForTransactionConfirmation(JSON.parse(result.body), maxRequests);
//             promises.push(promise);
//         }
//     };

//     loadtest.loadTest(options, function(error, result)
//     {   
//         if (error)
//         {
//             done(error);
//             return console.error('Got an error: %s', error);
//         }

//         Promise.all(promises).then((res) => {
//             console.log('Tests run successfully');
//             done();
//         }).catch(done)
//     });
// }

function getRandom (minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

function sendTransactionRequests(size = 100) {
    let transactions = [];

    for (let i = 0 ; i < size ; i++ ) {
        const transaction = {
            amount: 100,
            to: getRandom(1,10),
            from: 1,
            currency_id: 1,
        };

        transactions.push(transaction);
    }

    const promises = [];

    transactions.map((transaction) => {
        it('should create a transaction', (done) => {
            request(config.api_url)
                .post('/api/transactions')
                .send(transaction)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.amount).to.equal(transaction.amount);
                    expect(res.body.to).to.equal(transaction.to);
                    expect(res.body.from).to.equal(transaction.from);
                    expect(res.body.status).to.equal('initiated');

                    all_transactions.push(res.body);
                    done();
                })
                .catch(done);
        });
    });
};

// function sendBulkTransactionRequests(size = 100) {
//     let transactions = [];

//     for (let i = 0 ; i < size ; i++ ) {
//         const transaction = {
//             amount: 100,
//             to: getRandom(1,10),
//             from: getRandom(1,10),
//             currency_id: 1,
//         };

//         transactions.push(transaction);
//     }

//     const promises = [];
//     it('should create transactions in bulk', (done) => {

//         transactions.map((transaction) => {
//             request(app)
//                 .post('/api/transactions')
//                 .send(transaction)
//                 .expect(httpStatus.OK)
//                 .then((res) => {
//                     expect(res.body.amount).to.equal(transaction.amount);
//                     expect(res.body.to).to.equal(transaction.to);
//                     expect(res.body.from).to.equal(transaction.from);
//                     expect(res.body.status).to.equal('initiated');

//                     const p = waitForTransactionConfirmation(res.body, transactions.length);
//                     promises.push(p);

//                     if (promises.length >= transactions.length) {
//                         Promise.all(promises).then((res) => {
//                             done();
//                         }).catch(done)
//                     }
//                 })
//                 .catch(done);
//         });
//     });
// };

function waitForTransactionConfirmation(transaction, length) { 
    return new Promise((fulfill, reject) => {
        setTimeout(() => {
            request(config.api_url)
                .get(`/api/transactions/${transaction.id}`)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.to).to.equal(transaction.to);
                    expect(res.body.from).to.equal(transaction.from);
                    expect(res.body.status).to.be.oneOf(['pending', 'completed']);
                    fulfill();
                })
                .catch(reject);
        }, 30000);
    });
};

describe('## Transaction APIs', () => {
    after(() => {
        // db.Transaction.drop();
    });

    describe('# POST /api/transactions', () => {
        sendTransactionRequests(config.test.tx_per_sec);

        it('should wait for transaction confirmation', (done) => {
            const promises = [];
            for (let i = 0; i < all_transactions.length; i++) {
                const promise = waitForTransactionConfirmation(all_transactions[i], all_transactions.length);
                promises.push(promise);
            }

            Promise.all(promises).then(() => {
                done();
            })
            .catch(done);
        });
    });
});
