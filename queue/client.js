import redis from 'redis';
import bluebird from 'bluebird';
import config from '../config/config'
  
let client;
if (!client) {
  client = redis.createClient({
    prefix: 'q',
    port: config.queue.port,
    host: config.queue.host,
    password: config.queue.password,
  });
}

bluebird.promisifyAll(redis);

module.exports = client