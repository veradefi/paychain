/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import db from '../../../config/sequelize';
import app from '../../../index';
import config from '../../../config/config';

chai.config.includeStack = true;
config.DISABLE_QUEUE = true;
/**
 * root level hooks
 */
before(() => {
    db.sequelize.sync();
});

// after(() => {
//     // db.Transaction.drop();
// });

describe('## Transaction APIs', () => {
    let transaction = {
        amount: 100,
        to: 2,
        from: 21,
        currency_id: 1,
    };

    describe('# POST /api/transactions', () => {
      for (var i = 0; i < 10; ++i) {
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
      }
    });
});
