import app from './express';
import config from './config';

const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', function (socket) {
    console.log("connected");
});

server.listen(config.socket_port);
export default io;