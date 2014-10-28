var assert = require('chai').assert;

var boatData = require('../modules/boatData.js');

describe('serialInput', function() {
    var boat_data;

    beforeEach(function() {
        boat_data = new boatData.BoatData();
    });

    it(' should not emit events for non-whitelisted messages.');

    it(' should not write non-whitelisted messages to serial port.');

    it(' should always add \r\n to the end of messages before writing to the serial port.');

    it(' should rate limit.');
});