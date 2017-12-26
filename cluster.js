var Port = 8000;

var http = require('http');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

function sleep(ms)
{
	var s = new Date().getTime();
	while(new Date().getTime() < s + ms) ;
//	return new Promise(resolve=>setTimeout(resolve,ms));
}
 
if (cluster.isMaster) {
	console.log('[master] ' + "start master...");
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
		sleep(300);
	}
 
	var worker_ports = new Array();
  	cluster.on('listening', function (worker, address) {
    		console.log('[master] ' + 'listening: worker' + worker.id + ',pid:' + worker.process.pid + ', Address' + ": " + address.port);
    		worker_ports.push(address.port);
  	});
	http.createServer(function(req,resp) {
		resp.writeHead(200, {'Content-Type':'text/plain'});
		var info = {};
		info.ports = worker_ports;
		resp.end(JSON.stringify(info));
	}).listen(Port);
 
} else if (cluster.isWorker) {
  require('./signal.js');
  //require('./iploc.js');
  //require('./app.js');
}
