var assert = require('chai').assert;
var moment = require('moment');

var mtk3339 = require('../modules/mtk3339GPSInput.js');

describe('mtk3339', function() {

    it(' can translate RMC messages to NMEA 2.0.', function(){
        var message = "$GPRMC,214930.000,A,4741.1764,N,12224.1899,W,0.02,0.00,010614,,,D*78";
        var translatedMessage = mtk3339.cleanUpRMC(message); 

        assert.equal("$GPRMC,214930.0,A,4741.1764,N,12224.1899,W,0.02,0.00,010614,018.2,E*70", translatedMessage);
    });
});