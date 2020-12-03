/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import config from '../config/config';

chai.config.includeStack = true;

describe('## Misc', () => {
    describe('# GET /api/health-check', () => {
        it('should return OK', (done) => {
            request(config.api_url)
                .get('/api/health-check')
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });
    });
});
