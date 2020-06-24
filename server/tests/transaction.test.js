/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import db from '../../config/sequelize';
import app from '../../index';

chai.config.includeStack = true;

/**
 * root level hooks
 */
before(() => {
    db.sequelize.sync();
    db.Currency.create({
        full_name: 'My Token',
        short_name: 'My Token',
        symbol: 'MYT',
    });
});

after(() => {
    db.Transaction.drop();
});

describe('## Transaction APIs', () => {
    let transaction = {
        amount: 100,
        to: 1,
        from: 1,
        currency_id: 1,
    };

    describe('# POST /api/transactions', () => {
        it('should create a new transaction', (done) => {
            request(app)
                .post('/api/transactions')
                .send(transaction)
                .expect(httpStatus.OK)
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
            request(app)
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
            request(app)
                .get('/api/transactions/12345')
                .expect(httpStatus.NOT_FOUND)
                .then((res) => {
                    expect(res.body.message).to.equal('Not Found');
                    done();
                })
                .catch(done);
        });
    });
});
