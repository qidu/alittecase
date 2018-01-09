var Port = 8080;
var SeedNum = 30;
var N = require('os').cpus().length;

var WebSocketServer = require('ws').Server;
var wss = null;

var port = Port + (process.pid % N); //Math.floor(Port + N * Math.random());
for(var i=0; i < N; i++) {
    try {
	wss = new WebSocketServer({
		'port': port,
		'host': '0.0.0.0',
		verifyClient: sockVerify
	});
	break;
    }
    catch(e)
    {
	port = Port + ((port+1) % N);
	console.log('[signal] listen retry +1')
    }
}

function sockVerify(info)
{
	console.log('[signal] ' + info.origin + ' ' + info.req.t + ' ' + info.secure);
	return true;
}

function encodeMsg(s)
{
    var str = encodeURI(s);
    var data = new Uint8Array(str.length);
    console.log('[signal] send ' + s.length + 'to' + str.length + ' ' + s);
    for(var i = 0; i < str.length; i++)
    {
        data[i] = str[i].charCodeAt() + str.length + i;
    }
    return data;
}

function decodeMsg(data)
{
//  MAYBE: if(data instanceof ArrayBuffer) data = new Uint8Array(data);
    var str = "";
    for(var i = 0; i < data.byteLength; i++)
    {
        var num = data[i] - data.byteLength - i;
        while(num < 0) { num += 256;}
        str += String.fromCharCode(num);
    }
    return decodeURI(str);
}

function sendMsg(ws, msg)
{
	var m = encodeMsg(JSON.stringify(msg));
	ws.send(m);
}

var mapOffers = {};
var mapAnswers = {};
var mapCustomers = new Array();
var mapResouces = new Array();
var mapSockets = new Array();
var mapFlux = new Array();
var tstagFlux = 0;

mapCustomers['testabc'] = 1;

var cusconf = require('./cusconfig.js').cusconfig;

wss.on('connection', function(ws) {
    console.log('[signal] connected ' + ws._socket.remoteAddress + ':' + ws._socket.remotePort);
    //ws.binaryType = "arraybuffer";
    ws.on('message', function(message) {
    	var msg = JSON.parse(decodeMsg(message));
        console.log('[signal] received: %s', decodeMsg(message));
	if (msg.type === "hello")
	{
		msg.pid = wss.getPid(ws);
		msg.customer = {};
		msg.customer.config = cusconf;
		sendMsg(ws, msg); // echo
		wss.checkCus(ws, msg);
	}
	else if(msg.type === "candidate")
	{
        	wss.notifyOther(ws, msg); // from one to others
	}
	else if(msg.type === "offer")
	{
		mapOffers[ws] = message;
		wss.notifyOther(ws, msg);
	}
	else if(msg.type === "answer")
	{
		mapAnswers[ws] = message;
		wss.notifyOther(ws, msg);
	}
	else if(msg.type === "add")
	{
		wss.addResouce(ws, msg);
	}
	else if(msg.type === "query")
	{
		wss.queryNodes(ws, msg);
	}
	else if(msg.type === "report")
	{
		wss.reportStatus(ws, msg);
	}
	else
	{
	}
    });
    
    ws.on('close', function(err) {
	wss.closeSocket(ws);
    });
    ws.on('error', function(err) {
	wss.closeSocket(ws);
    });
    ws.on('open', function(err) {
	console.log('[signal] opened');
    });
});

function isNull(data) {
	return (typeof(data) == "undefined" || data == null);
}

wss.checkCus = function checkCus(ws,msg) {
	if (!isNull(ws) && !isNull(msg.customer))
	{
		ws.customer = msg.customer;
		if (ws.customer in mapCustomers) {
			return;
		}
	}
	else {
		// close socket
	}
}

wss.getPid = function getPid(ws) {
	if (!isNull(ws)) {
		if (!isNull(ws.pid)) {
			return ws.pid;
		}
		else if (!isNull(ws._socket)) {
			var pid = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
			ws.pid = pid.replace(/:/g,'_').replace(/\./g,'_');
			return ws.pid;
		}
		else {
			return '_none1_';
		}
	}
	else {
		return '_none0_';
	}
}

wss.notifyOther = function notifyOther(ws, msg) {
    	var pid = wss.getPid(ws);
	msg.from = pid;
	if (!isNull(msg.to) && !isNull(msg.data))
	{
		if(msg.to in mapSockets)
		{
			var peer = mapSockets[msg.to];
			if (!isNull(peer) && !isNull(peer.socket)) {
				sendMsg(peer.socket, msg);
			}
			else {
				var resp = {};
				resp.type = 'info';
				resp.error = 'invalid ' + msg.to;
				sendMsg(ws, resp);
				console.log('[signal] invalid ' + msg.to);
			}
		}
		else {
			var resp = {};
			resp.type = 'info';
			resp.error = 'can not find ' + msg.to;
			sendMsg(ws, resp);
			console.log('[signal] can not find ' + msg.to);
		}
	}
	else {
		wss.clients.forEach(function each(client) {
			if(client != ws) {
				sendMsg(client, msg);
			}
		});
	}
}

wss.updateSocket = function updateSocket(ws, rid) {
    	var pid = wss.getPid(ws);
	var peer = {};
	if (!(pid in mapSockets)) {
		peer.socket = ws;
		peer.rids = new Array();
		peer.rids[rid] = 1;
		mapSockets[pid] = peer;
		console.log('[signal] map ' + pid + ' ' + rid);
	}
	else {
		peer = mapSockets[pid];
		if (isNull(peer.rids)) {
			peer.rids = new Array();
		}
		if(!(rid in peer.rids)) {
			peer.rids[rid] = 1;
		}
	}
}

// rid => obj{rid,seedslist[pid=>seed],ispcounter,areacounter}
//
wss.addResouce = function addResouce(ws, msg) {
    	var pid = wss.getPid(ws);
	var list = null;
	var res = null;
	var seed = {};

	if(!(msg.rid in mapResouces)) {
		res = {};
		res.rid = msg.rid;
		res.seedslist = new Array();
		res.mapispcount = new Array();
		//res.areacnt = new Array();

		seed.isp = msg.isp;
		seed.area = msg.area;
		ws.seed = seed; //
		res.seedslist[pid] = seed;
		mapResouces[msg.rid] = res;
		wss.updateSocket(ws, msg.rid);
		console.log('[signal] create new ' + pid +' ' + (pid in res.seedslist));
	}
	else {
		res = mapResouces[msg.rid];
		if (isNull(res.seedslist)) {
			res.seedslist = new Array();
		}
		var seed = {};
		seed.isp = msg.isp;
		seed.area = msg.area;
		ws.seed = seed; //
		res.seedslist[pid] = seed;
		console.log('[signal] create another ' + pid +' ' + (pid in res.seedslist));
		
		wss.updateSocket(ws, msg.rid);
		
		if (isNull(res.mapispcount)) {
			res.mapispcount = new Array();
		}
		if(!(msg.isp in res.mapispcount)) {
			res.mapispcount[msg.isp] = 1;
		}
		else {
			var cnt = res.mapispcount[msg.isp];
			res.mapispcount[msg.isp] = 1 + cnt;
		}
	}
}

wss.queryNodes = function queryNodes(ws, msg) {
    	var pid = wss.getPid(ws);
	var resp = {};
	if (isNull(msg) || isNull(msg.rid))
	{
		resp.type = 'query';
		resp.error = 'no rid';
		sendMsg(ws, resp);
		return;
	}
	if (msg.rid in mapResouces) {
		var seeds = null;
		var res = mapResouces[msg.rid];
		var klist = Object.keys(res.seedslist);
		var start = 0; //klist.indexOf(pid);
		console.log('[signal] find res: ' + JSON.stringify(pid in res.seedslist) + ' ' + start);
		if (start == -1) {
			start = Math.floor(klist.length * Math.random());
			seeds = klist.slice(start, start+SeedNum);
		}
		else {
			var rand = Math.floor(klist.length*Math.random());
			start = 0; //rand > start ? (rand - start) : (start - rand);
			if(!isNull(msg.isp) && (msg.isp in res.mapispcount))
			{
				var cnt = res.mapispcount[msg.isp];
				if (cnt > 1000)
				{
					var candidates = klist.slice(start, start+10*SeedNum);
					for(var s in candidates)
					{
						if(candidates[s].isp == msg.isp)
						{
							seeds[s] = candidates[s];
						}
					}
					//if (seeds.length < SeedNum/2) {
					//	seeds.concat(klist.slice(start,start+SeedNum));
					//	seeds = seeds.slice(0,SeedNum);
					//}
				}
				else {
					seeds = klist.slice(start, start+SeedNum);
				}
			}
			else
			{
				seeds = klist.slice(start, start+SeedNum);
			}
		}
		if (!isNull(seeds))
		{
			resp.seeds = seeds;
		}
		else {
			resp.error = 'find nothing';
		}
	}
	else {
		resp.error = 'only you';
	}
	resp.type = 'query';
	sendMsg(ws, resp);
	wss.addResouce(ws, msg);
}

wss.closeSocket = function closeSocket(ws) {
	var pid = wss.getPid(ws);
	console.log('[signal] closing ' + pid);
	if (pid in mapSockets) {
		var rids = mapSockets[pid].rids;
		for(var rid in rids) {
			console.log('[signal] rids rm ' + JSON.stringify(rid));
			wss.removeResourcesById(pid, rid);
		}
		delete mapSockets[pid];
	}
	else {
		console.log('[signal] can not find ' + pid);
	}
}

wss.removeResourcesById = function removeResourcesById(pid, rid) {
	var res = mapResouces[rid];
	if (!isNull(res) && !isNull(res.seedslist) && (pid in res.seedslist)) {
		var seed = res.seedslist[pid];
		if (seed.isp in res.mapispcount) {
			var cnt = res.mapispcount[seed.isp];
			res.mapispcount[seed.isp] = cnt - 1;
		}
		console.log('[signal] remove ' + pid + ' in ' + rid);
		delete res.seedslist[pid];
	}
}

var fluxlog = require('./logger.js').logger('flux');

wss.reportStatus = function reportStatus(ws, msg) {
    	var pid = wss.getPid(ws);
	if (isNull(msg) || isNull(msg.p2p) || isNull(msg.cdn) || isNull(msg.customer)) {
		return;
	}

	var date = new Date();
	var tstag = Math.floor(date.getTime()/1000/300);
	var flux = {};

	if (tstag != tstagFlux) {
		// dump data; 
		for (var cus in mapFlux)
		{
			var fluxlist = mapFlux[cus];
			var p2psum = 0, cdnsum = 1;
			fluxlist.forEach(function(flx) {
				//flx.date + ',' + flx.customer + ',' + flx.pid + ',' + flx.cdn + ',' + flx.p2p
				if (!isNull(flx.isp)) {
					//flx.isp + ',' + flx.area;
				}
				cdnsum += flx.cdn;
				p2psum += flx.p2p;
			});
			console.log('[signal] flux total ' + tstagFlux + ',' + cus + ',' + JSON.stringify(cdnsum) + ',' + JSON.stringify(p2psum));
			var fluxsum = {};
			fluxsum.ts = tstagFlux; 
			fluxsum.p2p = p2psum;
			fluxsum.cdn = cdnsum;
			fluxsum.cus = cus;
			fluxlog.info(JSON.stringify(fluxsum));
			delete mapFlux[cus];
		}
		// then
		tstagFlux = tstag;
	}

	flux.pid = pid;
	flux.tstag = tstag;
	flux.date = date;
	flux.cdn = msg.cdn;
	flux.p2p = msg.p2p;
	flux.customer = msg.customer;
	if (!isNull(ws.seed)) {
		flux.isp = ws.seed.isp;
		flux.area = ws.seed.area;
	}
	if (!(msg.customer in mapFlux))
	{
		mapFlux[msg.customer] = new Array();
	}
	mapFlux[msg.customer].push(flux);
	console.log('[signal] flux ' + date + ',' + msg.customer + ',' + flux.cdn + ',' + flux.p2p + ',' + pid);
}
