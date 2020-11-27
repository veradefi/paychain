import winston from 'winston';
import Papertrail from 'winston-papertrail';
import config from './config'

const winstonPapertrail = new winston.transports.Papertrail({
    host: config.papertrail.host,
    port: config.papertrail.port,
    program: config.papertrail.program,
    colorize: true,
    maximumAttempts: 5,
    attemptsBeforeDecay: 3,
})

winstonPapertrail.on('error', function(err) {
    // console.log("Could not connect to Papertrail: ", err.toString());
});

const logger = new winston.Logger({
    transports: [winstonPapertrail]
});

export default logger;