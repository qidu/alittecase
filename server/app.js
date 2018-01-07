// app.js
const net = require('net');
//const fs = require('fs');
var lgf = require('./logger.js')
var log = lgf.logger('flux');

const server = net.createServer(function(socket) { //'connection' listener
  socket.on('end', function() {
    console.log('server disconnected');
  });
  socket.on('data', function() {
    socket.end('hello '+ socket.remoteAddress +'\r\n');
  });
});

server.listen(8080, function() { //'listening' listener
  console.log('working');
  log.info('ok started');
});
