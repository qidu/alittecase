// ip loc
var Port = 8000;
var libqqwry = require('lib-qqwry');
var qqwry = libqqwry.init();
var http = require('http');
var url = require('url');
var mime = require('./mime.js').types;

qqwry.speed();

http.createServer(function(request,response) {
	var uri = url.parse(request.url).pathname;
	var ts = new Date().getTime();
	var ip = getClientIP(request);
	var info = {};

	info.ts = ts;
	info.ip = ip;

	response.writeHead(200, {
		'Content-Type': mime['json'],
		'Access-Control-Allow-Origin':'*'
	});
	//response.write('');
	if (uri === '/loc') {
		var wry = qqwry.searchIP(ip);
		var loc = {};
		loc.isp = wry.Area;
		loc.area = wry.Country;
		info.loc = loc;
		response.end('' + JSON.stringify(info));
	}
	else if(uri === '/ip') {
		response.end('' + JSON.stringify(info));
	}
	else if(uri === '/port') {
		if (typeof(worker_ports) === "undefined") {
			worker_ports = {};
		}
		response.end('' + JSON.stringify(worker_ports));
	}
	else {
		response.end('hello world!');
	}
}).listen(Port);

function getClientIP(req)
{
	var ip = req.headers['x-forward-for'] || 
		req.headers['X-FORWARD-FOR'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;
	return ip.replace(/::ffff:/,'');
}

