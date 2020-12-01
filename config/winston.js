import winston from 'winston';
import Papertrail from 'winston-papertrail';
import config from './config'
const { combine, timestamp, label, printf } = winston.format;

const colors = { 
    error: 'red', 
    warn: 'yellow', 
    info: 'green', 
    verbose: 'white', 
    debug: 'white', 
    silly: 'white' 
};

const levels = { 
    error: 0, 
    warn: 1, 
    info: 2, 
    verbose: 3, 
    debug: 4, 
    silly: 5 
};

var winstonPapertrail = new winston.transports.Papertrail({
	host: config.papertrail.host,
    port: config.papertrail.port,
    program: config.papertrail.program,
    level: 'error',
    meta: true,
})

var consolerLogger = new winston.transports.Console({
    json: true,
    colorize: true,
    format: winston.format.simple(),
})

const logger = winston.createLogger({
    levels: levels,
    level: 'info',
    format: winston.format.json(),
    transports: [
        
    ]
  });

if (config.env == "production") {
    logger.add(winstonPapertrail);
} else {
    logger.add(consolerLogger);
};

winstonPapertrail.on('error', function(err) {
    console.log("Could not connect to Winston: ", err.toString());
});

export default logger;
