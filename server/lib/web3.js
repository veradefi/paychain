import Web3 from 'web3';
import config from '../../config/config';

const web3 = new Web3(config.web3.provider_url);

const createAccount = () => {
    return web3.eth.personal.newAccount(config.web3.entropy);
};

const getAllAccounts = () => {
    return web3.eth.getAccounts();
};

module.exports = {
    createAccount,
    getAllAccounts,
};
