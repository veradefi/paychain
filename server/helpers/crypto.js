import crypto from 'crypto';
import config from '../../config/config';

const encrypt = (data, secretKey) => {
    const cipher = crypto.createCipher('aes-256-cbc', secretKey || config.secretKey);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

const decrypt = (data, secretKey) => {
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey || config.secretKey);
    let dec = decipher.update(data, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};

module.exports = {
    encrypt,
    decrypt,
};
