import Web3 from 'web3';
import Tx from 'ethereumjs-tx';
import config from '../../config/config';
import { decrypt } from '../helpers/crypto';

let web3;

const init = () => {
    if (!web3) {
        web3 = new Web3(config.web3.provider_url);
    }
    return web3;
};

const createAccount = () => {
    return web3.eth.accounts.create(config.web3.entropy);
};

const getAllAccounts = () => {
    return web3.eth.getAccounts();
};

const getTransactionCount = (address) => {
    return web3.eth.getTransactionCount(address, 'pending');
};

const getReceipt = (transactionHash) => {
    // transactionHash = transactionHash.slice(1, -1);
    return web3.eth.getTransactionReceipt(transactionHash);
};

const signTransaction = (txOptions, privateKey) => {
    const pkBuffer = new Buffer(privateKey.substring(2), 'hex');
    const transaction = new Tx(txOptions);
    transaction.sign(pkBuffer);
    const serializedTx = transaction.serialize().toString('hex');
    return `0x${serializedTx}`;
};

const approve = (ownerAddress, ownerPrivateKey, balance) => {
    return new Promise((resolve, reject) => {

        getTransactionCount(ownerAddress).then((nonce) => {
            const decryptedPrivKey = decrypt(ownerPrivateKey);
            const txOptions = {
                gasLimit: web3.utils.toHex('6000000'),
                gasPrice: web3.utils.toHex('3000000000'),
                from: ownerAddress,
                nonce: web3.utils.toHex(nonce),
            };

            txOptions.to = config.web3.payment_address;
            txOptions.data = web3.eth.abi.encodeFunctionCall({
                name: 'approve',
                type: 'function',
                inputs: [{
                    type: 'address',
                    name: 'spender',
                },{
                    type: 'uint256',
                    name: 'value',
                }],
            }, [config.web3.contract_address, balance]);

            const signedTx = signTransaction(txOptions, decryptedPrivKey);
            web3.eth.sendSignedTransaction(signedTx).then(resolve).catch(reject)
        }).catch(reject)
    });
};

const getBalance = (contractAddress, address) => {
    return new Promise((resolve, reject) => {
        let txOptions = {
          gas: web3.utils.toHex("210000"),
          gasPrice: web3.utils.toHex("3000000000"),
          to: contractAddress,
          data: web3.eth.abi.encodeFunctionCall({
              name: 'balanceOf',
              type: 'function',
              inputs: [{
                  type: 'address',
                  name: 'address'
              }]
          }, [address])
        }
        
        web3.eth.call(txOptions).then((resp) => {
            let balanceInWei = web3.utils.toBN(resp).toString();
            resolve(balanceInWei);
        })
        .catch(err => reject(err));
    });
}

init();

module.exports = {
    createAccount,
    getAllAccounts,
    getTransactionCount,
    signTransaction,
    web3,
    getReceipt,
    getBalance,
    approve,
};
