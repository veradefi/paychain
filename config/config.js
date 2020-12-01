import Joi from 'joi';
import path from 'path';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
const result = require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (result.error) {
    throw result.error
}

// define validation for all the env vars
const envVarsSchema = Joi.object({
    NODE_ENV: process.env.NODE_ENV || Joi.string()
        .allow(['development', 'production', 'test', 'provision'])
        .default('development'),
    PORT: process.env.PORT || Joi.number()
        .default(4000),
    API_URL: process.env.API_URL || Joi.string()
        .default('http://localhost:4000')
        .description('Api url'),
    SECRET_KEY: process.env.SECRET_KEY || Joi.string().required()
        .description('Secret required to sign'),
    MYSQL_DB: process.env.MYSQL_DB || Joi.string().required()
        .description('MYSQL database name'),
    MYSQL_PORT: process.env.MYSQL_PORT || Joi.number()
        .default(3606),
    MYSQL_HOST: process.env.MYSQL_HOST || Joi.string()
        .default('localhost'),
    MYSQL_USER: process.env.MYSQL_USER || Joi.string().required()
        .description('MYSQL username'),
    MYSQL_PASSWD: process.env.MYSQL_PASSWD || Joi.string().allow('')
        .description('MYSQL password'),
    PROVIDER_URL: process.env.PROVIDER_URL || Joi.string()
        .default('http://localhost:8545'),
    PROVIDER_TYPE: process.env.PROVIDER_TYPE || Joi.string()
        .allow(['testrpc', 'rinkeby', 'mainnet'])
        .default('testrpc'),
    ENTROPY: process.env.ENTROPY || Joi.string()
        .default('54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534'),
    TX_PER_SEC: process.env.TX_PER_SEC || Joi.number()
        .default(100),
    QUEUE_NAME: process.env.QUEUE_NAME || Joi.string()
        .default('transactions'),
    QUEUE_HOST: process.env.QUEUE_HOST || Joi.string()
        .default('127.0.0.1'),
    QUEUE_PORT: process.env.QUEUE_PORT || Joi.number()
        .default(6379),
    QUEUE_PWD: process.env.QUEUE_PWD || Joi.string().allow('')
        .default(''),
    SOCKET_PORT: process.env.SOCKET_PORT || Joi.number()
        .default(1337),
    DEFAULT_ADDRESS: process.env.DEFAULT_ADDRESS || Joi.string().allow('')
        .default(''),
    PRIVATE_KEY: process.env.PRIVATE_KEY || Joi.string().allow('')
        .default(''),
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || Joi.string().allow('')
        .default(''),
    PAYMENT_ADDRESS: process.env.PAYMENT_ADDRESS || Joi.string().allow('')
        .default(''),
    PAPERTRAIL_HOST: process.env.PAPERTRAIL_HOST || Joi.string().allow('')
        .default(''),
    PAPERTRAIL_PORT: process.env.PAPERTRAIL_PORT || Joi.number(),
    PAPERTRAIL_PROGRAM: process.env.PAPERTRAIL_PROGRAM || Joi.string().allow('')
        .default(''),
    TX_BATCH_SIZE: process.env.TX_BATCH_SIZE || Joi.number()
        .default(200),
    TX_HOLD_TIME: process.env.TX_HOLD_TIME || Joi.number()
        .default(5000),
    CALL_BACK_BATCH_SIZE: process.env.CALL_BACK_BATCH_SIZE || Joi.number()
        .default(100),
    CALL_BACK_HOLD_TIME: process.env.CALL_BACK_HOLD_TIME || Joi.number()
        .default(60000),
    CALL_BACK_URL: process.env.CALL_BACK_URL || Joi.string()
        .required(),
}).unknown()
    .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
    process.exit(1)
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    socket_port: envVars.SOCKET_PORT,
    secretKey: envVars.SECRET_KEY,
    api_url: envVars.API_URL,
    queue: {
        name: envVars.QUEUE_NAME,
        port: envVars.QUEUE_PORT,
        host: envVars.QUEUE_HOST,
        password: envVars.QUEUE_PWD,
    },
    postgres: {
        db: envVars.MYSQL_DB,
        port: envVars.MYSQL_PORT,
        host: envVars.MYSQL_HOST,
        user: envVars.MYSQL_USER,
        passwd: envVars.MYSQL_PASSWD,
    },
    web3: {
        provider_url: envVars.PROVIDER_URL,
        provider_type: envVars.PROVIDER_TYPE,
        entropy: envVars.ENTROPY,
        contract_address: envVars.CONTRACT_ADDRESS,
        payment_address: envVars.PAYMENT_ADDRESS,
        default_address: envVars.DEFAULT_ADDRESS,
        private_key: envVars.PRIVATE_KEY,
    },
    test: {
        tx_per_sex: envVars.TX_PER_SEC,
    },
    papertrail: {
        host: envVars.PAPERTRAIL_HOST,
        port: envVars.PAPERTRAIL_PORT,
        program: envVars.PAPERTRAIL_PROGRAM,
    },
    batch: {
        size: envVars.TX_BATCH_SIZE,
        time: envVars.TX_HOLD_TIME,
    },
    callback: {
        size: envVars.CALL_BACK_BATCH_SIZE,
        time: envVars.CALL_BACK_HOLD_TIME,
        url: envVars.CALL_BACK_URL,
    },
};

console.log(config)

export default config;
