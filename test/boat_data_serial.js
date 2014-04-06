var assert = require('chai').assert;
var moment = require('moment');

var boat_data_serial = require('../modules/boat_data_serial.js');
// boat_data_serial.prototype.start = function() {};

describe('boat_data', function() {
    var boat_data;

    beforeEach(function() {
        boat_data = new boat_data_serial();
        boat_data.serialPort = {
            write: function() {}
        };
    });


    it(' emit nmea events for new messages.', function(done){
        var message = "$HCHDG,192.5,0.0,E,,*26";
        boat_data.on('nmea', function(event_message) {
            assert.equal(event_message, message);

            done();
        });

        boat_data.onNewLine(message);
    });

    it(' emit data events for new messages.', function(done){
        var message = "$HCHDG,192.5,0.0,E,,*26";
        boat_data.on('data', function() {
            // assert.equal(event_message, message);

            done();
        });

        boat_data.onNewLine(message);
    });

    it(' emit data:type events for new messages.', function(done){
        var message = "$HCHDG,192.5,0.0,E,,*26";
        boat_data.on('data:hdg', function() {
            // assert.equal(event_message, message);

            done();
        });

        boat_data.onNewLine(message);
    });

    it(' emit nmea events for broadcast messages.', function(done){
        var message = "$HCHDG,192.5,0.0,E,,*26";
        boat_data.on('nmea', function(event_message) {
            assert.equal(event_message, message);

            done();
        });

        boat_data.broadcast(message);
    });

    it(' emit data events for broadcast messages.', function(done){
        var data = {
            type: 'att',
            heel: 0.01,
            trim: 0.0
        };
        boat_data.on('data', function(event_message) {
            done();
        });

        boat_data.broadcast(null, data);
    });

});