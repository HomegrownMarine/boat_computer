var assert = require('chai').assert;
var moment = require('moment');

var nmea = require('../modules/nmea.js');

describe('checksum', function(){
    it(' should calculate checksum correctly', function(){
        assert.equal(nmea.checksum('GPRMC,204658,A,4740.2949,N,12228.5660,W,005.4,300.8,100410,018.2'), '0A');
        assert.equal(nmea.checksum('GPRMC,030000.6,A,4740.36415,N,12225.35953,W,000.02,059.5,160612,016.6,E'), '4A');
        assert.equal(nmea.checksum('IIHDG,298,,,18,E'), '18');
    });
});
