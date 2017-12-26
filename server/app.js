// app.js
const net = require('net');
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
});
