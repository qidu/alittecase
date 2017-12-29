// http://int.dpool.sina.com.cn/iplookup/iplookup.php?ip=123.11.11.1
//
var pc = null;
var pc0 = null;
var dc = null;

var ice = {"iceServers": [
//	{"url": "stun:stun.l.google.com:19302"},
//	{"url": "stun:stunserver.org"},
//	{"url": "stun:180.76.111.247"}
	{"url": "stun:10.3.15.30"}
]};

var mediaConstraints = {
  mandatory: {
      OfferToReceiveAudio: false,
      OfferToReceiveVideo: false
  }
};

var mapCandidates = {};
var mapOffers = {};

var signalWs = new WebSocket("ws://10.3.15.30:8080"); 


signalWs.onclose = function (evt) { console.log("ws close") }; 
signalWs.onerror = function (evt) { console.log("ws error") }; 

signalWs.onopen = function (evt) { 
	console.log("ws open"); 
	//evt.target.send(JSON.stringify("initfire")); 
    sayHello();
};

signalWs.onmessage = function (evt) { 
	var msg = JSON.parse(evt.data);

	if (msg.type === "candidate") {
		if (!mapCandidates.hasOwnProperty(JSON.stringify(msg.data))) {
			mapCandidates[JSON.stringify(msg.data)] = 1;
			console.log("add remote candidate: " + JSON.stringify(msg.data));
			pc.addIceCandidate(new RTCIceCandidate(msg.data)); // trickle mode
		}
		else
		{
		//	console.log("Got repeated candidate");
		}
	}
	else if(msg.type === "offer") {
		if (!mapOffers.hasOwnProperty(JSON.stringify(msg.data.sdp))) {
			console.log("Got offer");
			mapOffers[JSON.stringify(msg.data.sdp)] = 1;

            if (pc != null) {
                console.log("**** pc exists!");
                pc0 = pc;
            }
		    pc = setupPeerConnection();
		    dc = setupDataChannel(pc); 
            

    		pc.setRemoteDescription(new RTCSessionDescription(msg.data), function() {
	    	    console.log("set remote offer");
				if (pc.remoteDescription.type === 'offer') {
					pc.createAnswer(function(answer) {
						pc.setLocalDescription(answer);
						console.log("set local, answer created and sent");
						var msg = {};
						msg.type = "answer";
						msg.data = answer;
						evt.target.send(JSON.stringify(msg));
					}, logError, mediaConstraints);
				}
		    }, logError);
		}
		else
		{
		//	console.log("Got repeated sdp");
		}
	}
	else if(msg.type === "answer") {
		console.log("Got answer from signal");
		if (pc.remoteDescription.type) {
			
		}
		else
		{
			pc.setRemoteDescription(new RTCSessionDescription(msg.data), function(){
				console.log("set answer ok");
			}, logError);
		}
	}
	else if(msg.type === "hello") {
		pc = setupPeerConnection();
	//	dc = setupDataChannel(pc);

	//	pc.createOffer(function(offer) {
	//		pc.setLocalDescription(offer, function(){
	//			evt.target.send(JSON.stringify(pc.localDescription));
	//		    console.log("offer created and sent local desc: " + JSON.stringify(pc.localDescription));
	//		});
	//	}, logError, mediaConstraints);
	}
	else {
		console.log("unkown msg: " + JSON.stringify(msg));
	}
}; 

function initOffer()
{
    if(pc != null) {
		dc = setupDataChannel(pc);

		pc.createOffer(function(offer) {
			pc.setLocalDescription(offer, function(){
				var msg = {};
				msg.type = "offer";
				msg.data = pc.localDescription;
				signalWs.send(JSON.stringify(msg));
			    console.log("offer created and sent local desc: " + JSON.stringify(pc.localDescription));
			});
		}, logError, mediaConstraints);
    }
}

function setupPeerConnection()
{
	var pc = new webkitRTCPeerConnection(ice);
	pc.ondatachannel = handleChannel;

	console.log("ICE gathering state on setup: " + pc.iceGatheringState);

	pc.onicecandidate = function(evt) {
	    console.log("ICE gathering state change: " + evt.target.iceGatheringState);
		if (evt.candidate) {
			console.log("ICE got local candidate: " + JSON.stringify(evt.candidate));
			updateCandidates(evt.candidate);
		}
		if (evt.target.iceGatheringState === 'complete')
		{
		}
	}

	pc.oniceconnectionstatechange = function(evt) {
		console.log("ICE connection state change: " + evt.target.iceConnectionState);
		console.log("ICE connection finish: " + JSON.stringify(evt.target));
	}

	return pc;
}

function updateCandidates(candidate)
{
    var msg = {};
    msg.type = "candidate";
    msg.data = candidate;
    signalWs.send(JSON.stringify(msg));
}

function sayHello()
{
    var msg = {};
    msg.type = "hello";
    msg.data = null;
	signalWs.send(JSON.stringify(msg)); 
}

function query()
{
    var msg = {};
    msg.type = "query";
    msg.ver = "1";
    msg.isp = "1";
    msg.area = "1";
    msg.tag = "xyz" + Math.floor(100*Math.random());
    msg.rid = "aaa";
    //msg.rid = "aaa" + Math.floor(100*Math.random());
	signalWs.send(JSON.stringify(msg)); 
}


function setupDataChannel(pc)
{
	var dc = pc.createDataChannel("chat", {reliable: true});
	handleChannel(dc);
	return dc;
}

//navigator.webkitGetUserMedia({"audio": true, "video": false}, gotStream, logError);
//function gotStream(stream) {
//	pc.addStream(stream);
//	pc.createOffer(function(offer) {
//		pc.setLocalDescription(offer);
//		console.log("created offer");
//	//	console.log(offer.sdp);
//	});
//}

function logError(msg) {
	console.log("[debug] " + msg);
}

function handleChannel(chan) {
	console.log("setup datachannel");
	console.log(chan);

	if (chan.channel)
	{
		handleChannel(chan.channel);
	}
	else
	{
		chan.onerror = function(err) { console.log("channel error"); }
		chan.onclose = function() { console.log("channel closed"); }
		chan.onopen = function(evt) {
			console.log("ICE connection state: " + pc.iceConnectionState);
			sayHi(chan);
			setInterval(sayHi(chan), 10000);
		}
		chan.onmessage = function(msg) {
			if (msg.data instanceof ArrayBuffer) {
				console.log("datachannel got ArrayBuffer");
			}
			else {
				console.log("datachannel got " + msg.data);
			}
		}
	}
}

function sayHi(chan)
{
    return function() {
        if(chan.readyState === 'open') {
            chan.send("Hello World!");
            chan.send(new ArrayBuffer(6000));
            console.log("chat over datachannel"); 
        }
    }
}

