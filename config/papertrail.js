import winston from 'winston';
import Papertrail from 'winston-papertrail';
import config from './config'

const winstonPapertrail = new winston.transports.Papertrail({
    host: config.papertrail.host,
    port: config.papertrail.port,
    program: config.papertrail.program,
    colorize: true,
})
 
const logger = new winston.Logger({
    transports: [winstonPapertrail]
});

export default logger;