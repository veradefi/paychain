import httpStatus from 'http-status';
import BN from 'bn.js';
import path from 'path';
import Mocha from 'mocha';
import fs from 'fs';
import io from '../../config/socket';
import config from '../../config/config';
import Token from '../../../build/contracts/TestERC20.json';
import { getAllAccounts, web3 } from '../lib/web3';

function index(req, res, next) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
}

function transactions(req, res, next) {
    return res.sendFile(path.join(__dirname, '../public/transaction.html'));
}
/**
 * Start test cases
 * @returns {Account}
 */
function start(req, res, next) {
    // Run the tests.
    const testCases = [];
    config.test.tx_per_sec = req.body.tx_per_sec || 100;

    // Instantiate a Mocha instance.
    const mocha = new Mocha({
        ui: 'bdd',
        reporter: 'min',
        useColors: false,
        timeout: 150000,
    });

    const testDir = path.join(__dirname, '../tests/stress');

    // Add each .js file to the mocha instance
    const files = fs.readdirSync(testDir).filter(function(file){
        // Only keep the .js files
        return file.substr(-3) === '.js';

    }).forEach(function(file){
        const _sPathSpec = path.join(testDir, file);
        delete require.cache[ _sPathSpec ];
        mocha.addFile(_sPathSpec);
    });

    const testRun = mocha.run(function(failures){
        process.exitCode = failures ? -1 : 0;
    });

    testRun.on('start', () => {
        io.emit('tests started');
    });

    testRun.on('end', () => {
        io.emit('tests finished');
        testRun.removeAllListeners();
    });

    testRun.on('pass', (test) => {
        const testResult = {
            success: true,
            title: test.title,
            id: testCases.length + 1,
        };

        io.emit('test result', testResult);
        testCases.push(testResult);
    });

    testRun.on('fail', (test, error) => {
        const testResult = {
            success: false,
            title: test.title,
            id: testCases.length + 1,
        };

        io.emit('test result', testResult);
        testCases.push(testResult);
    });

    return res.json({
        success: true,
    });
}

function init(req, res, next) {
    let accounts = [];
    let tokenOwner;
    let tokenContract;
    getAllAccounts()
        .then((_accounts) => {
            accounts = _accounts;
            tokenOwner = accounts[0];
            const ContractAbi = new web3.eth.Contract(Token.abi);
            ContractAbi
                .deploy({ data: Token.bytecode })
                .send({
                    from: tokenOwner,
                    gas: 1500000,
                    gasPrice: '3000000000',
                })
                .then((result) => {
                    tokenContract = result;
                    return tokenContract
                              .methods
                              .balanceOf(tokenOwner)
                              .call({ from: tokenOwner });
                })
                .catch((err) => {
                    console.error(err);
                })
                .then((result) => {
                    result = new BN(result);
                    const promises = [];
                    for (let i = 1; i < accounts.length; i++) {
                        const p = tokenContract.methods.transfer(accounts[i], result.div(new BN(10))).send({
                            from: tokenOwner
                        })
                        promises.push(p);
                    }

                    Promise.all(promises).then(() => {
                        res.json({
                            success: true,
                            accounts: accounts,
                            contractAddress: tokenContract._address,
                        });
                    })
                    .catch((err) => {
                        res.json({
                            success: true,
                            accounts: accounts,
                            contractAddress: tokenContract._address,
                        });
                    })
                })
                .catch((err) => {
                    next(err);
                })
        })
        .catch((err) => {
            next(err);
        });
}

export default { index, transactions, start, init };
