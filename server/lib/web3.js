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
};
