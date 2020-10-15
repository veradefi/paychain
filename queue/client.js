import redis from 'redis';
import bluebird from 'bluebird';
import config from '../config/config'
import logger from '../config/papertrail'  

let client;
if (!client) {
  client = redis.createClient({
    prefix: 'q',
    port: config.queue.port,
    host: config.queue.host,
    password: config.queue.password,
  });
}

client.on('error', function (err) {
  if(err.code == "ECONNREFUSED" || err.code == "NR_CLOSED" || err.code == "CONNECTION_BROKEN") {
    console.log("Redis Err: %j", err)
    logger.error(err)
    client.quit();
    setTimeout(() => {
      process.exit(1)
    }, 5000)
  }
});

bluebird.promisifyAll(redis);

module.exports = client