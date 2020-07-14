import httpStatus from 'http-status';
import BN from 'bn.js';

const { spawn } = require('child_process');
const bash = spawn('bash');

const Token = require('../../../build/contracts/TestERC20.json');
import { getAllAccounts, web3 } from '../lib/web3';

/**
 * Start test cases
 * @returns {Account}
 */
function start(req, res, next) {
    bash.stdin.write('npm run test\n');
    bash.stdin.end();

    bash.stdout.on('data', (data) => {
      console.log(`child stdout:\n${data}`);
    });

    bash.stderr.on('data', (data) => {
       console.error(`child stderr:\n${data}`);
    });

    bash.on('exit', function (code) {
        console.log('child process exited with code ' + code);
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
                }).then((result) => {
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
                })
        })
        .catch((err) => {
            res.json({
                success: false,
                error: err.toString(),
            });
        });
}

export default { start, init };
