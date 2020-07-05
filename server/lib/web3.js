import Web3 from 'web3';
import Tx from 'ethereumjs-tx';
import config from '../../config/config';

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
    return web3.eth.getTransactionCount(address);
};

const getReceipt = (transactionHash) => {
    return web3.eth.getTransactionReceipt(transactionHash);
};

const signTransaction = (txOptions, privateKey) => {
    const pkBuffer = new Buffer(privateKey.substring(2), 'hex');
    const transaction = new Tx(txOptions);
    transaction.sign(pkBuffer);
    const serializedTx = transaction.serialize().toString('hex');
    return `0x${serializedTx}`;
};

// const transfer = (txOptions, encryptedPrivKey) => {
//     const signedTx = signTransaction(txOptions, decryptedPrivKey);
//     return web3.eth.sendSignedTransaction(signedTx);
// };

init();

module.exports = {
    createAccount,
    getAllAccounts,
    getTransactionCount,
    signTransaction,
    web3,
    getReceipt,
};
