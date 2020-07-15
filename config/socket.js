import app from './express';

const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', function (socket) {
    console.log("connected");
});

server.listen(8080);
export default io;