import cronjob from './cronjob'
import logger from '../config/winston'

process
  .on('unhandledRejection', (reason, p) => {
      console.error(reason, 'Unhandled Rejection at Promise');
      logger.warn(reason);
  })
  .on('uncaughtException', err => {
      console.error(err, 'Uncaught Exception thrown');
      logger.error(err);
  });