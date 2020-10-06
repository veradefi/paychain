import winston from 'winston';
import Papertrail from 'winston-papertrail';
import config from './config'

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true,
        }),
        new (winston.transports.Papertrail)({
            host: config.papertrail.host,
            port: config.papertrail.port,
        }),
    ],
});

export default logger;
