import redis from 'redis';
import bluebird from 'bluebird';
import config from '../config/config'
  
let client;

if (!client) {
  client = redis.createClient({
    prefix: 'q',
    redis: {
      port: config.queue.port,
      host: config.queue.host,
      auth: config.queue.password,
    },
  });
}

bluebird.promisifyAll(redis);

module.exports = client