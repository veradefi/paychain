import Sequelize from 'sequelize';
import _ from 'lodash';
import config from '../config/config';
import redis from 'redis';

const checkDB = () => {
    // connect to mysql db
    const sequelize = new Sequelize(config.postgres.db,
        config.postgres.user,
        config.postgres.passwd,
        {
            dialect: 'mysql',
            port: 3378,
            host: config.postgres.host,
            logging: false,
            pool: {
                max: 5,
                min: 0,
                idle: 20000,
                acquire: 20000,
            },
            timezone: '+05:00'
        }
    );

    sequelize
        .authenticate()
        .then(() => {
            console.log('MySql connection has been established successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err.toString());
            process.exit(1);
        });
};

const checkRedis = () => {
    const client = redis.createClient({
        prefix: 'q',
        port: 1234 || config.queue.port,
        host: config.queue.host,
        password: config.queue.password,
    });

    client.on("connect", () => {
        console.log("Redis connection is working!");
        process.exit(0);
    })

    client.on('error', (err) => {
        console.log('Unable to connect to the redis:', err.toString());
        client.quit();
        process.exit(1);
    })
};

checkDB();
checkRedis();