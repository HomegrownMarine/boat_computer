// this app will monitor all nmea messages output by boat_data, and re-broadcast them
// over udp.  Currently hardcoded port number, but could be configured.

var dgram = require('dgram');
var broadcastSocket = null;

var failureCount = 0;

function attachBroadcastSocket(boat_data) {
    var socket = dgram.createSocket("udp4");
    var broadcastAddress = '255.255.255.255';
    var broadcastPort = 37001;
    
    var onMessage = function(message) {
        var buffer = new Buffer(message);
        socket.send(buffer, 0, buffer.length, broadcastPort, broadcastAddress);
    }

    socket.on('error', function(err) {
        failureCount++;
        console.error("server error: " + failureCount + "\n" + err.stack);

        socket.close();
        boat_data.stopListening('nmea', onMessage);

        //try again up to 10 times:: this number may change in the future
        if ( failureCount < 10 ) {
            setTimeout(function(){attachBroadcastSocket(boat_data)}, 1000);
        }
    });

    socket.bind(broadcastPort, function() {
        socket.setBroadcast(true);
        socket.setMulticastTTL(4);
    });

    boat_data.on('nmea', onMessage);
}

// instantiate udp server and broadcast on data_processor.update
exports.load = function(server, boat_data, settings) {
    attachBroadcastSocket(boat_data);
};