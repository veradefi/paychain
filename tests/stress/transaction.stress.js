/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import config from '../../config/config';

chai.config.includeStack = true;

let apiAccounts = [];
const all_transactions = [];
let tokenContract = {

};

function getRandom (minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

function getApiAccounts() {
    return new Promise((resolve, reject) => {
        request(config.api_url)
            .get('/api/accounts')
            .expect(httpStatus.OK)
            .then((res) => {

                apiAccounts = res.body;
                resolve(apiAccounts);
            })
            .catch(reject);
    });
};

function getRandomAccountId(balanceCheck = false, count = 0) {
    const randomNumber = getRandom(0, apiAccounts.length - 1);
    const randomAccount = apiAccounts[randomNumber];
    
    if (randomAccount && (randomAccount.balance > 100 || !balanceCheck)) {
        return randomAccount.id;
    }

    if (count < 5) {
        return getRandomAccountId(balanceCheck, ++count);
    }
}

function sendTransactionRequests(size = 100) {
    let transactions = [];

    for (let i = 0 ; i < size ; i++ ) {
        const transaction = {
            amount: '100',
            currency_id: 1,
        };

        transactions.push(transaction);
    }

    const promises = [];

    transactions.map((transaction) => {
        it('should create a transaction', (done) => {
            transaction.from = getRandomAccountId(true);
            transaction.to = getRandomAccountId();
            request(config.api_url)
                .post('/api/transactions')
                .send(transaction)
                .expect(httpStatus.CREATED)
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

// function waitForTransactionConfirmation(transaction, retries) { 
//     return new Promise((fulfill, reject) => {
//         if (retries >= 50) {
//             reject(new Error("Max tried reached"));
//             return;
//         }
//         setTimeout(() => {
//             request(config.api_url)
//                 .get(`/api/transactions/${transaction.id}`)
//                 .expect(httpStatus.OK)
//                 .then((res) => {
//                     expect(res.body.to).to.equal(transaction.to);
//                     expect(res.body.from).to.equal(transaction.from);
//                     console.log(retries, res.body.status)
//                     if (res.body.status == "initiated") {
//                         waitForTransactionConfirmation(transaction, ++retries);
//                     } else if (res.body.status == "failed") {
//                         reject(new Error("Transaction failed: " + transaction.id));
//                     } else {
//                         expect(res.body.status).to.be.oneOf(['pending', 'completed']);
//                         fulfill();
//                     }
//                 })
//                 .catch(reject);
//         }, 3000);
//     });
// };

function waitForTransactionConfirmation(transactions, done) { 
    let tries = 0;
    let interval = setInterval(() => {
        tries++;
        console.log("Transaction confirmation #", tries, ", remaining transactions: ", all_transactions.length)
        const checkStatus = (transaction, cb) => {
            request(config.api_url)
                .get(`/api/transactions/${transaction.id}`)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.to).to.equal(transaction.to);
                    expect(res.body.from).to.equal(transaction.from);

                    if (res.body.status == "failed") {
                        return cb(new Error("Transaction failed: " + transaction.id));
                    } else if (res.body.status == "pending" || res.body.status == "completed") {
                        return cb();
                    }
                })
                .catch(cb);
        }

        for (let i = 0; i < all_transactions.length; i++) {
            const index = i;
            checkStatus(all_transactions[index], (err) => {
                if (err) {
                    clearInterval(interval);
                    return done(err)
                }
                all_transactions.splice(index, 1);
                if(all_transactions.length == 0) {
                    clearInterval(interval);
                    return done();
                }
            })
        }

        if (tries >= 10) {
            clearInterval(interval);
            return done(new Error("Max tries reached for transactions confirmation"))
        }

    }, 30000);
};

describe('## Transaction APIs', () => {
    describe('# POST /api/transactions', () => {

        before((done) => {
            getApiAccounts().then(() => done()).catch(done);
        });

        sendTransactionRequests(config.test.tx_per_sex);

        it('should wait for transaction confirmation', (done) => {
            waitForTransactionConfirmation(all_transactions, done);
        });
    });
});
