/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import config from '../../../config/config';

const jsonAccounts = require('../../json/accounts.json');

chai.config.includeStack = true;

const apiAccounts = [];
const all_transactions = [];
let tokenContract = {

};

describe('## Transaction stress tests', () => {
    describe('# Deploy token and balance transfer', () => {
        after((done) => {
            const currency = {
                query: {
                    symbol: 'DC',
                },
                update: {
                    address: tokenContract.address,
                    full_name: 'Dummy Coin',
                    short_name: 'Dummy',
                }
            };
            request(config.api_url)
                .post(`/api/currency/upsert`)
                .send(currency)
                .then((res) => {
                    expect(res.body.address).to.equal(tokenContract.address);
                    done();
                })
                .catch(done);
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
        for (let i = 0; i < jsonAccounts.length; i += 1) {
            const account = {
                address: jsonAccounts[i].address,
                privateKey: jsonAccounts[i].privateKey,
            };

            it('should create an api account', (done) => {
                request(config.api_url)
                    .post('/api/accounts')
                    .send(account)
                    .expect(httpStatus.CREATED)
                    .then((res) => {
                        apiAccounts.push(res.body);
                        done();
                    })
                    .catch(done);
            });
        }
    });
});

function getRandom (minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

function getRandomAccountId() {
    const randomNumber = getRandom(0, apiAccounts.length - 1);
    const randomAccount = apiAccounts[0];

    if (randomAccount) {
        return randomAccount.id;
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
            transaction.from = getRandomAccountId();
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
