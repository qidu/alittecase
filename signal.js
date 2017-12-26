var Port = 8080;
var N = require('os').cpus().length;

var WebSocketServer = require('ws').Server;
var wss = null;

var AsyncLock = require('async-lock');
var lock = new AsyncLock();

var port = Port + (process.pid % N); //Math.floor(Port + N * Math.random());
var retry = true;
//while(retry) {
//lock.acquire('listento', function(cb) {
//	console.log('lock by ' + process.pid);
	for(var i=0; i < N; i++) {
	    try {
		wss = new WebSocketServer({'port': port});
		break;
	    }
	    catch(e)
	    {
		port = Port + ((port+1) % N);
		console.log('try +1')
	    }
	}
//	retry = false;
//}, function(err,ret) {
//	retry = true;
//});
//}

wss.notifyCandidate = function notifyCandidate (ws, msg) {
	wss.clients.forEach(function each(client) {
		if(client == ws) {
			console.log('skip self');
		}
		else {
			console.log('notify candidate');
			client.send(msg);
		}
	});
}

wss.notifyOffer = function notifyOffer(ws, msg) {
	wss.clients.forEach(function each(client) {
		if(client == ws) {
			console.log('skip self');
		}
		else {
			console.log('notify offer');
			client.send(msg);
		}
	});
}

var mapOffers = {};
var mapAnswers = {};

wss.on('connection', function(ws) {
    console.log('connected ' + ws._socket.remoteAddress);
    ws.on('message', function(message) {
    	var msg = JSON.parse(message);
        console.log('received: %s', message);
	if (msg.type === "hello")
	{
		ws.send(JSON.stringify(msg));
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
	else
	{
	}

	//for(var ws2 in wsc) {
     	//   if(ws2 != ws) { 
        //        console.log('exchange sdp');
	//	ws2.send(message, function(error) {
	//   		if(error) {
	//		    console.log(desc,error);
	//    		}
	//		else { console.log('send sdp');}
	//    	}); 
      	//    }
	//    else { console.log('skip self');}
        // }
    });
    //ws.send(JSON.stringify({'message':{'event':'hi','data':{'sdp':{}}}}));
});


 
