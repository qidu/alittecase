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
var mapFlux = new Array();
var tstagFlux = 0;

wss.on('connection', function(ws) {
    console.log('[signal] connected ' + ws._socket.remoteAddress + ':' + ws._socket.remotePort);
    ws.on('message', function(message) {
    	var msg = JSON.parse(message);
        console.log('[signal] received: %s', message);
	if (msg.type === "hello")
	{
    		var pid = wss.getPid(ws);
		msg.pid = pid;
		ws.send(JSON.stringify(msg)); // echo
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
});

function isNull(data) {
	return (typeof(data) == "undefined" || data == null);
}

wss.getPid = function getPid(ws) {
	if (!isNull(ws) && !isNull(ws._socket)) {
		var pid = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
		ws.pid = pid.replace(/:/g,'_').replace(/\./g,'_');
	}
	return ws.pid;
}

wss.notifyOther = function notifyOther(ws, msg) {
    	var pid = wss.getPid(ws);
	msg.from = pid;
	if (!isNull(msg.to) && !isNull(msg.data))
	{
		if(msg.to in mapSockets)
		{
			var dst = mapSockets[msg.to];
			dst.send(JSON.stringify(msg));
		}
		else {
			console.log('[signal] can not find ' + msg.to);
		}
	}
	else {
		var message = JSON.stringify(msg);
		wss.clients.forEach(function each(client) {
			if(client != ws) {
				client.send(message);
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

	if(!mapResouces.hasOwnProperty(msg.rid)) {
		res = {};
		res.rid = msg.rid;
		res.seedslist = new Array();
		res.mapispcount = new Array();
		//res.areacnt = new Array();

		seed.isp = msg.isp;
		seed.area = msg.area;
		ws.seed = seed;
		res.seedslist[pid] = seed;
		mapResouces[msg.rid] = res;
		wss.updateSocket(pid, msg.rid);
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
		ws.seed = seed;
		res.seedslist[pid] = seed;
		console.log('[signal] create another ' + pid +' ' + (pid in res.seedslist));
		
		wss.updateSocket(pid, msg.rid);
		
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
		ws.send(JSON.stringify(resp));
		return;
	}
	if (msg.rid in mapResouces) {
		var seeds = null;
		var res = mapResouces[msg.rid];
		console.log('find res: ' + JSON.stringify(pid in res.seedslist));
		var klist =Object.keys(res.seedslist);
		var start = klist.indexOf(pid);
		console.log('find pid at: ' + JSON.stringify(start));
		if (start == -1) {
			start = Math.floor(klist.length * Math.random());
			seeds = klist.slice(start, start+SeedNum);
		}
		else {
			var rand = Math.floor(klist.length*Math.random());
			start = rand > start ? (rand - start) : (start - rand);
			if(!isNull(msg.isp) && (msg.isp in res.mapispcount))
			{
				var cnt = res.mapispcount[msg.isp];
				if (cnt > 1000)
				{
					var candidates = klist.slice(start, start+10*SeedNum);
					for(var s in candidates)
					{
						if(candidate[s].isp == msg.isp)
						{
							seeds[s] = candidates[s];
						}
					}
					if (seeds.length < SeedNum/2) {
						seeds.concat(klist.slice(start,start+SeedNum));
						seeds = seeds.slice(0,SeedNum);
					}
				}
				else {
					seeds = klist.slice(start, start+SeedNum);
				}
			}
			else
			{
				seeds = res.seedslist.slice(start, start+SeedNum);
			}
		}
		if (!isNull(seeds))
		{
			resp.seeds= seeds;
		}
		else {
			resp.error = 'find nothing';
		}
	}
	else {
		resp.error = 'only you';
	}
	resp.type = 'query';
	ws.send(JSON.stringify(resp));
	wss.addResouce(ws, msg);
}

wss.closeSocket = function closeSocket(ws) {
	var pid = ws.pid;
	console.log('[signal] closed ' + pid);
	if (pid in mapSockets) {
		var rids = mapSockets[pid].rids;
		delete mapSockets[pid];
		for(rid in Object.keys(rids)) {
			wss.removeResoucesById(pid, rid);
		}
	}
}

wss.removeResource = function removeResouceById(pid, rid) {
	var res = mapResouces[rid];
	if (isNull(res) && (pid in res.seedslist)) {
		var seed = res.seedslist[pid];
		if (seed.isp in res.mapispcount) {
			var cnt = res.mapispcount[seed.isp];
			res.mapispcount[seed.isp] = cnt - 1;
		}
		delete res.seedslist[pid];
	}
}

wss.reportStatus = function reportStatus(ws, msg) {
    	var pid = wss.getPid(ws);
	if (isNull(msg) || isNull(msg.p2p) || isNull(msg.cdn) || isNull(msg.customer)) {
		return;
	}
	if (!(msg.customer in mapFlux))
	{
		mapFlux[msg.customer] = new Array();
	}
	var date = new Date();
	var tstag = Math.floor(date.getTime()/1000/300);
	var flux = {};

	if (tstag != tstagFlux) {
		// dump data; 
		for (var cus in mapFlux)
		{
			var fluxlist = mapFlux[cus];
			var p2psum = 0, cdnsum = 0;
			for (var flx in fluxlist)
			{
				//flx.date + ',' + flx.customer + ',' + flx.pid + ',' + flx.cdn + ',' + flx.p2p
				if (!isNull(flx.isp)) {
					//flx.isp + ',' + flx.area;
				}
				p2psum += flx.p2p;
				cdnsum += flx.cdn;
			}
			// tstagFlux + ',' + cus + ',' + cdnsum + ',' + p2psum
			delete fluxlist;
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
	mapFlux[msg.customer].push(flux);
}
