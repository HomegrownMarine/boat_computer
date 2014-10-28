var assert = require('chai').assert;

var boatData = require('../modules/boatData.js');

describe('boatData', function() {
    var boat_data;


    beforeEach(function() {
        //TODO: use test source.
        boat_data = new boatData.BoatData();
    });


    it(' emit nmea events for new messages.', function(done){
        var message = "$HCHDG,192.5,0.0,E,,*26";
        boat_data.on('nmea', function(event_message) {
            assert.equal(event_message, message);

            done();
        });

        boat_data.onMessage(message);
    });

    it(' emit data events for new messages.', function(done){
        var message = "$HCHDG,192.5,0.0,E,,*26";
        boat_data.on('data', function() {
            // assert.equal(event_message, message);

            done();
        });

        boat_data.onMessage(message);
    });

    it(' emit data:type events for new messages.', function(done){
        var message = "$HCHDG,192.5,0.0,E,,*26";
        boat_data.on('data:hdg', function() {
            // assert.equal(event_message, message);

            done();
        });

        boat_data.onMessage(message);
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
            type: 'notype', //not formattable
            heel: 0.01,
            trim: 0.0
        };
        boat_data.on('data', function(event_data) {
            assert.deepEqual(event_data, data);
            done();
        });

        boat_data.broadcast(null, data);
    });

    it(' emit data events for broadcast messages.', function(done){
        var data = {
            type: 'notype', //not formattable
            heel: 0.01,
            trim: 0.0
        };
        boat_data.on('data', function(event_data) {
            assert.deepEqual(event_data, data);
            done();
        });

        boat_data.broadcast(data);
    });
});