import Joi from 'joi';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string()
        .allow(['development', 'production', 'test', 'provision'])
        .default('development'),
    PORT: Joi.number()
        .default(4000),
    API_URL: Joi.string()
        .default('http://localhost:4000')
        .description('Api url'),
    SECRET_KEY: Joi.string().required()
        .description('Secret required to sign'),
    MYSQL_DB: Joi.string().required()
        .description('MYSQL database name'),
    MYSQL_PORT: Joi.number()
        .default(3606),
    MYSQL_HOST: Joi.string()
        .default('localhost'),
    MYSQL_USER: Joi.string().required()
        .description('MYSQL username'),
    MYSQL_PASSWD: Joi.string().allow('')
        .description('MYSQL password'),
    PROVIDER_URL: Joi.string()
        .default('http://localhost:8545'),
    ENTROPY: Joi.string()
        .default('54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534'),
    TX_PER_SEC: Joi.number()
        .default(100),
    QUEUE_NAME: Joi.string()
        .default('transactions'),
}).unknown()
    .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    secretKey: envVars.SECRET_KEY,
    api_url: envVars.API_URL,
    queue: {
        name: envVars.QUEUE_NAME,
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
        entropy: envVars.ENTROPY,
    },
    test: {
        tx_per_sex: envVars.TX_PER_SEC,
    },
};

export default config;
