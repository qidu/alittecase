// ip loc
var libqqwry = require('lib-qqwry');
var qqwry = libqqwry.init();
var http = require('http');
var url=require('url');
var mime=require('./mime.js').types;

qqwry.speed();

http.createServer(function(request,response) {
	var uri = url.parse(request.url).pathname;
	var ts = new Date().getTime();
	var ip = getClientIP(request);
	var info = {};

	info.ts = ts;
	info.ip = ip;

	response.writeHead(200, {'Content-Type': mime['json']});
	//response.write('');
	if (uri === '/loc') {
		var wry = qqwry.searchIP("123.125.1.1");
		var loc = {};
		loc.isp = wry.Area;
		loc.area = wry.Country;
		info.loc = loc;
	}
	response.end('' + JSON.stringify(info));
}).listen(8080);

function getClientIP(req)
{
	return req.headers['x-forward-for'] || 
		req.headers['X-FORWARD-FOR'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;
}

//var ip1 = qqwry.searchIP("123.125.1.1");
//for(var i=0; i<200000; i++) {
//	ip1 = qqwry.searchIP("111.206.71.1");
//}
//console.log(ip1);
