var Port = 8080;
var SeedNum = 30;
var N = require('os').cpus().length;

var WebSocketServer = require('ws').Server;
var wss = null;

var port = Port + (process.pid % N); //Math.floor(Port + N * Math.random());
for(var i=0; i < N; i++) {
    try {
	wss = new WebSocketServer({'port': port});
	break;
    }
    catch(e)
    {
	port = Port + ((port+1) % N);
	console.log('[signal] listen retry +1')
    }
}

var mapOffers = {};
var mapAnswers = {};
var mapResouces = new Array();
var mapSockets = new Array();

wss.on('connection', function(ws) {
    console.log('[signal] connected ' + ws._socket.remoteAddress + ':' + ws._socket.remotePort);
    ws.on('message', function(message) {
    	var msg = JSON.parse(message);
        console.log('[signal] received: %s', message);
	if (msg.type === "hello")
	{
		ws.send(JSON.stringify(msg)); // echo
	}
	else if(msg.type === "candidate")
	{
        	wss.notifyCandidate(ws, message); // from one to others
	}
	else if(msg.type === "offer")
	{
		mapOffers[ws] = message;
		wss.notifyOffer(ws, message);
	}
	else if(msg.type === "answer")
	{
		mapAnswers[ws] = message;
		wss.notifyOffer(ws, message);
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
	}
	else
	{
	}
    });
    
    ws.on('close', function(err) {
	wss.closeSocket(ws);
    });
});

function isNull(data) {
	return (data == undefined || data == null);
}

wss.notifyCandidate = function notifyCandidate(ws, msg) {
	wss.clients.forEach(function each(client) {
		if(client == ws) {
			console.log('[signal] skip self');
		}
		else {
			console.log('[signal] notify candidate');
			client.send(msg);
		}
	});
}

wss.notifyOffer = function notifyOffer(ws, msg) {
	wss.clients.forEach(function each(client) {
		if(client == ws) {
			console.log('[signal] skip self');
		}
		else {
			console.log('[signal] notify offer');
			client.send(msg);
		}
	});
}

wss.updateSocket = function updateSocket(ws, rid) {
    	var pid = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
	var peer = {};
	if (!(pid in mapSockets)) {
		peer.socket = ws;
		peer.rids = new Array();
		peer.rids[msg.rid] = 1;
		mapSockets[pid] = peer;
	}
	else {
		peer = mapSockets[pid];
		if (isNull(peer.rids)) {
			peer.rids = new Array();
		}
		if(!(rid in peer.rids)) {
			peer.rids[msg.rid] = 1;
		}
	}
}

// rid => obj{rid,seedslist[pid=>seed],ispcounter,areacounter}
//
wss.addResouce = function addResouce(ws, msg) {
    	var pid = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
	var res = null;
	if(!mapResouces.hasOwnProperty(msg.rid)) {
		res = {};
		res.rid = msg.rid;
		res.seedslist = new Array();
		res.ispcnt = new Array();
		//res.areacnt = new Array();
		var seed = {};
		seed.isp = msg.isp;
		seed.area = msg.area;
		res.seedslist[pid] = seed;
		mapResouces[msg.rid] = res;

		wss.updateSocket(pid, msg.rid);
	}
	else {
		res = mapResouces[msg.rid];
		if (isNull(res.seedslist)) {
			res.seedslist = new Array();
		}
		var seed = {};
		seed.isp = msg.isp;
		seed.area = msg.area;
		res.seedslist[pid] = seed;
		
		wss.updateSocket(pid, msg.rid);
		
		if (isNull(res.ispcnt)) {
			res.ispcnt = new Array();
		}
		if(!(msg.isp in res.ispcnt)) {
			res.ispcnt[ispcnt] = 1;
		}
		else {
			var cnt = res.ispcnt[ispcnt];
			res.ispcnt[ispcnt] = 1 + cnt;
		}
	}
}

wss.queryNodes = function queryNodes(ws, msg) {
    	var pid = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
	var resp = {};
	if (msg.rid in mapResouces) {
		var res = mapResouces[msg.rid];
		var start = res.seedslist.indexOf(pid);
		if (start == -1) {
			start = Math.floor(res.seedslist.length * Math.random());
		}
		var seeds = res.seedslist.slice(start, start+SeedNum);
		if (isNull(seeds))
		{
			resp.seeds= seeds;
		}
	}
	else {
		wss.addResouce(ws, msg);
	}
	resp.type = 'query';
	ws.send(JSON.stringify(resp));
}

wss.closeSocket = function closeSocket(ws) {
	var pid = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
	if (pid in mapSockets) {
		var rids = mapSockets[pid].rids;
		delete mapSockets[pid];
		for(id in Object.keys(rids)) {
			wss.removeResoucesById(pid, id);
		}
	}
}

wss.removeResource = function removeResouceById(pid, rid) {
	var res = mapResouces[rid];
	if (isNull(res) && (rid in res.seedslist)) {
		delete res.seedslist[rid];
	}
}


