/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import config from '../config/config';

chai.config.includeStack = true;

let account = {
    address: '0x4600AF44C9990a9F68255463B7Cb8F5Fa82A472B',
    privateKey: '0x26020dde5a28225faed8d6a6cbfb929e29473513ac0a91dfa02f598be81e02ff',
};

describe('## Account APIs', () => {
    after((done) => {
        request(config.api_url)
                    .delete('/api/accounts/' + account.id)
                    .expect(httpStatus.NO_CONTENT)
                    .then((res) => {
                        done();
                    })
                    .catch(done);
    });
    
    describe('# POST /api/accounts', () => {
        it('should create a new account', (done) => {
            request(config.api_url)
                .post('/api/accounts')
                .send(account)
                .expect(httpStatus.CREATED)
                .then((res) => {
                    expect(res.body.address).to.equal(account.address);
                    account = res.body;
                    done();
                })
                .catch(done);
        });
    });

    describe('# GET /api/accounts/:accountId', () => {
        it('should get account details', (done) => {
            request(config.api_url)
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
            request(config.api_url)
                .get('/api/accounts/12345')
                .expect(httpStatus.NOT_FOUND)
                .then((res) => {
                    expect(res.body.message).to.equal('Account does not exist');
                    done();
                })
                .catch(done);
        });
    });
});
