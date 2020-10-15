import Sequelize from 'sequelize';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import config from './config';
import logger from '../config/papertrail'  

const db = {};

// connect to mysql db
const sequelize = new Sequelize(config.postgres.db,
                                config.postgres.user,
                                config.postgres.passwd,
    {
        dialect: 'mysql',
        port: config.postgres.port,
        host: config.postgres.host,
        logging: false,
        pool: {
            max: 5,
            min: 0,
            idle: 20000,
            acquire: 20000,
        },
        timezone: '+05:00'
    });

const modelsDir = path.normalize(`${__dirname}/../server/models`);

// loop through all files in models directory ignoring hidden files and this file
fs.readdirSync(modelsDir)
    .filter(file => (file.indexOf('.') !== 0) && (file.indexOf('.map') === -1))
    // import model files and save model names
    .forEach((file) => {
        console.log(`Loading model file ${file}`);
        const model = sequelize.import(path.join(modelsDir, file));
        db[model.name] = model;
    });

// Synchronizing any model changes with database.
sequelize
    .sync({ force: false })
    .then(() => {
        console.log('Database synchronized');
    })
    .catch((err) => {
        console.log('An error occured %j', err);
        logger.error(err)
        setTimeout(() => {
            process.exit(1)
        }, 5000)
    });

// assign the sequelize variables to the db object and returning the db.
module.exports = _.extend({
    sequelize,
    Sequelize,
}, db);
