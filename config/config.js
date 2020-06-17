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
    JWT_SECRET: Joi.string().required()
        .description('JWT Secret required to sign'),
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
}).unknown()
    .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    jwtSecret: envVars.JWT_SECRET,
    postgres: {
        db: envVars.MYSQL_DB,
        port: envVars.MYSQL_PORT,
        host: envVars.MYSQL_HOST,
        user: envVars.MYSQL_USER,
        passwd: envVars.MYSQL_PASSWD,
    },
};

export default config;
