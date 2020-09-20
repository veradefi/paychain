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

function getRandomAccountId() {
    const randomNumber = getRandom(0, apiAccounts.length - 1);
    const randomAccount = apiAccounts[randomNumber];

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
                    expect(res.body.status).to.be.oneOf(['initiated','pending', 'completed']);
                    fulfill();
                })
                .catch(reject);
        }, 30000);
    });
};

describe('## Transaction APIs', () => {
    describe('# POST /api/transactions', () => {

        before((done) => {
            getApiAccounts().then(() => done()).catch(done);
        });

        sendTransactionRequests(config.test.tx_per_sex);

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
