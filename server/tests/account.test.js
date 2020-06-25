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
});

after(() => {
    db.Account.drop();
});

describe('## Account APIs', () => {
    let account = {
        balance: 10,
    };

    describe('# POST /api/accounts', () => {
        it('should create a new account', (done) => {
            request(app)
                .post('/api/accounts')
                .send(account)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.balance).to.equal(account.balance);
                    account = res.body;
                    done();
                })
                .catch(done);
        });
    });

    describe('# GET /api/accounts/:accountId', () => {
        it('should get account details', (done) => {
            request(app)
                .get(`/api/accounts/${account.id}`)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.balance).to.equal(account.balance);
                    expect(res.body.address).to.equal(account.address);
                    done();
                })
                .catch(done);
        });

        it('should report error with message - Not found, when account does not exist', (done) => {
            request(app)
                .get('/api/accounts/12345')
                .expect(httpStatus.NOT_FOUND)
                .then((res) => {
                    expect(res.body.message).to.equal('Not Found');
                    done();
                })
                .catch(done);
        });
    });
});
