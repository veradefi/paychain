/* eslint-env mocha */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import db from '../../../config/sequelize';
import app from '../../../index';
import config from '../../../config/config';
import queue from '../../helpers/queue';
import { getAllAccounts, web3 } from '../../lib/web3';
const loadtest = require('loadtest');

var _accounts = require('../../json/accounts.json');
var Token = require("../../../build/contracts/TestERC20.json");

chai.config.includeStack = true;

let accounts = [];
let apiAccounts = [];
let tokenOwner;
let tokenContract;
let totalSupply = 0;
/**
 * root level hooks
 */
before(() => {
    db.sequelize.sync();
});

// after(() => {
//     // db.Transaction.drop();
// });

describe('## Transaction stress tests', () => {
    describe('# Deploy token and balance transfer', () => {

        after ((done) => {
            db.Currency.update({address: tokenContract._address},
                {where:{id:1}})
            done();
        });

        it ('fetch all accounts', (done) => {
            getAllAccounts().then((_accounts) => {
                accounts = _accounts;
                done();
            });
        });

        it("deploy token", (done) => {
            tokenOwner = accounts[0];
            const ContractAbi = new web3.eth.Contract(Token.abi);
            ContractAbi
                .deploy({data: Token.bytecode})
                .send({
                    from: tokenOwner,
                    gas: 1500000,
                    gasPrice: '3000000000'
                })
                .then((result) => {
                    tokenContract = result;
                    return tokenContract.methods.balanceOf(tokenOwner).call({from: tokenOwner});        
                }).then((result) => {
                    totalSupply = result.valueOf();
                    done();
                })
        });
    });


    describe('# Create api accounts', () => {
        after((done) => {
            db.Account.drop();
            done();
            // startLoadTesting(done);
        });

        for (let i = 0; i < _accounts.length; i++) {
            let account = {
                balance: 0,
                address: _accounts[i].address,
                privateKey: _accounts[i].privateKey,
            };

            it('should create 10 api accounts', (done) => {

                db.Account.create(account)
                    .then((res) => {
                        apiAccounts.push(res.body);
                        done();
                    })
                    .catch(done);

                // request(app)
                //     .post('/api/accounts')
                //     .send(account)
                //     .expect(httpStatus.OK)
                //     .then((res) => {
                //         expect(res.body.balance).to.equal(account.balance);
                //         apiAccounts.push(res.body);
                //         done();
                //     })
                //     .catch(done);
            });
        }
    });
});

// function startLoadTesting(done){
//     const options = {
//         url: 'http://localhost:4000/api/transactions',
//         maxRequests: 1,
//         concurrency: 1,
//         method: 'POST',
//         requestsPerSecond: 1,
//         headers: {
//             'content-type': 'application/json'
//         },
//         contentType: 'application/json',
//         body: {
//             amount: 100,
//             to: 2,
//             from: 1,
//             currency_id: 1,
//         }
//     };

//     loadtest.loadTest(options, function(error, result)
//     {
//         if (error)
//         {
//             return console.error('Got an error: %s', error);
//         }
//         console.log('Tests run successfully');
//         done();
//     });
// }

function sendTransactionRequests (size = 100) {
    let transaction = {
        amount: 100,
        to: 2,
        from: 1,
        currency_id: 1,
    };

    for (var i = 0; i < size; ++i) {
        it('should create a new transaction', (done) => {
            request(app)
                .post('/api/transactions')
                .send(transaction)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.amount).to.equal(transaction.amount);
                    expect(res.body.to).to.equal(transaction.to);
                    expect(res.body.from).to.equal(transaction.from);
                    // transaction = res.body;
                    done();
                })
                .catch(done);
        });
    }
}

describe('## Transaction APIs', () => {
    
    let count = 0;
    describe('# POST /api/transactions', () => {

        sendTransactionRequests(100);
    });
});
