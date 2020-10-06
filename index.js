import config from './config/config';
import app from './config/express';
import io from './config/socket';
/* eslint-disable no-unused-vars */
import db from './config/sequelize';
import logger from './config/papertrail';

require("babel-polyfill");

const debug = require('debug')('amida-api-boilerplate:index');
/* eslint-enable no-unused-vars */

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// module.parent check is required to support mocha watch
if (!module.parent) {
    // listen on port config.port
    app.listen(config.port, () => {
        console.log(`server started on port ${config.port} (${config.env})`);
    });
}

process
  .on('unhandledRejection', (reason, p) => {
      console.error(reason, 'Unhandled Rejection at Promise');
      logger.warn(reason);
  })
  .on('uncaughtException', err => {
      console.error(err, 'Uncaught Exception thrown');
      logger.error(err);
  });
export default app;
