import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import path from 'path';
import httpStatus from 'http-status';
import expressWinston from 'express-winston';
import expressValidation from 'express-validation';
import helmet from 'helmet';
import winstonInstance from './winston';
import routes from '../server/routes/index.route';
import testRoutes from '../server/routes/test.route';
import config from './config';
import APIError from '../server/helpers/APIError';
import { processQueue } from '../server/helpers/queue';

const app = express();

if (config.env === 'development') {
    app.use(logger('dev'));
}

if (config.env === 'development' || config.env === 'production') {
    processQueue();
}

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

app.use("/tests", express.static(path.join(__dirname, '../server/public')));

// enable detailed API logging in dev env
if (config.env === 'development') {
    expressWinston.requestWhitelist.push('body');
    expressWinston.responseWhitelist.push('body');
    app.use(expressWinston.logger({
        winstonInstance,
        meta: true, // optional: log meta data about request (defaults to true)
        msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
        colorStatus: true, // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
    }));
}

// mount all routes on /api path
app.use('/api', routes);

app.use('/tests', testRoutes);

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing message[]
        const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
        const error = new APIError(unifiedErrorMessage, err.status, true);
        return next(error);
    } else if (!(err instanceof APIError)) {
        const apiError = new APIError(err.message, err.status, err.isPublic);
        return next(apiError);
    }
    return next(err);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new APIError('API not found', httpStatus.NOT_FOUND);
    return next(err);
});

// log error in winston transports except when executing test suite
if (config.env !== 'test') {
    app.use(expressWinston.errorLogger({
        winstonInstance,
    }));
}

// error handler, send stacktrace only during development
app.use((err, req, res, next) => {// eslint-disable-line no-unused-vars
    let respMessage = {
        "statusCode": err.status,
        "error": httpStatus[err.status],
        "message": err.isPublic ? err.message : (err.message || httpStatus[err.status]),
        "data": {
            "code": 13003
        }
    }

    if (config.env === 'development') {
        respMessage.stack = err.stack;
    }

    res.status(err.status).json(respMessage);
});

export default app;
