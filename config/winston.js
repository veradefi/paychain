import winston from 'winston';
import Papertrail from 'winston-papertrail';
import config from './config'

var winstonPapertrail = new winston.transports.Papertrail({
	host: config.papertrail.host,
    port: config.papertrail.port,
})

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true,
        }),
        winstonPapertrail,
    ],
});

winstonPapertrail.on('error', function(err) {
    console.log("Could not connect to Papertrail: ", err.toString());
});

export default logger;
