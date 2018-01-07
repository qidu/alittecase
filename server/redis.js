var redis = require('redis');

var redisServerIP = '127.0.0.1';
var redisServerPort= '6379';

function setup_redis() {
    var client = redis.createClient(redisServerPort, redisServerIP);
    client.on('error', function(error) {
        console.log("RedisServer is error!\n" + error);
    });
    client.on("connect", function() {
        console.log("RedisServer is connected!");
    });
    client.on("end", function() {
        console.log("RedisServer is end!");
    });
    return client;
}
