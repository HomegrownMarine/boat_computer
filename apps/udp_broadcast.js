//! udp_broadcast.js
//! Re-broadcast all NMEA messages over UDP.
//! version : 1.0
//! homegrownmarine.com

// Currently hardcoded port number, but could be configured.

var dgram = require('dgram');
var winston = require('winston');

var broadcastSocket = null;
var failureCount = 0;

function attachBroadcastSocket(boat_data) {
    var socket = dgram.createSocket("udp4");
    var broadcastAddress = '255.255.255.255';
    var broadcastPort = 37001;
    
    var onMessage = function(message) {
        try {
            var buffer = new Buffer(message+'\r\n');
            socket.send(buffer, 0, buffer.length, broadcastPort, broadcastAddress);
        }
        catch(e) {
            //TODO: buffer may overflow
            winston.error('buffer overflow? with: ' + JSON.stringify(message) );
        }
    }

    socket.on('error', function(err) {
        failureCount++;
        winston.error("server error: " + failureCount + "\n" + err.stack);

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