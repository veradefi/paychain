/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import config from '../config/config';

chai.config.includeStack = true;
let apiAccounts = []

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

describe('## Transaction APIs', () => {
    let transaction = {
        amount: '100'
    }
    describe('# POST /api/transactions', () => {
        before((done) => {
            getApiAccounts().then(() => done()).catch(done);
        });
          
        it('should create a new transaction', (done) => {
                
            transaction = {
                amount: '100',
                to: getRandomAccountId(),
                from: getRandomAccountId(),
            };

            request(config.api_url)
                .post('/api/transactions')
                .send(transaction)
                .expect(httpStatus.CREATED)
                .then((res) => {
                    expect(res.body.amount).to.equal(transaction.amount);
                    expect(res.body.to).to.equal(transaction.to);
                    expect(res.body.from).to.equal(transaction.from);
                    transaction = res.body;
                    done();
                })
                .catch(done);
        });
    });

    describe('# GET /api/transactions/:transactionId', () => {
        it('should get transaction details', (done) => {
            request(config.api_url)
                .get(`/api/transactions/${transaction.id}`)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.amount).to.equal(transaction.amount);
                    expect(res.body.to).to.equal(transaction.to);
                    expect(res.body.from).to.equal(transaction.from);
                    done();
                })
                .catch(done);
        });

        it('should report error with message - Not found, when transaction does not exist', (done) => {
            request(config.api_url)
                .get('/api/transactions/12345')
                .expect(httpStatus.NOT_FOUND)
                .then((res) => {
                    expect(res.body.message).to.equal('Transaction does not exist');
                    done();
                })
                .catch(done);
        });
    });
});
