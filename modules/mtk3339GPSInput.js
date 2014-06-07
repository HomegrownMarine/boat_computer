//! mtk3339GPSInput.js
//! SerialInput subclass for mtk3339 based GPS (see adafruit ultimate gps)
//! Sends setup messages, to get ideal message rates and baud.  Translates
//! messages into better formats, where necessary.
//! version : 0.2
//! homegrownmarine.com

var util = require('util')
var nmea = require('./nmea')

var SerialInput = require('./serialInput');

var _ = require('lodash');

var defaultOptions = {
            "name": "default",
            "whitelist": ["GPRMC","GPGGA","GPGSA","GPGSV"],
            "write": false
        };

function mkt3339GPSInput(options) {
    options = _.extend({}, defaultOptions, options);
    SerialInput.call(this, options);


    //onstart
    //// serial.write('$PMTK314,0,1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0*2C\r\n');
};
util.inherits(mkt3339GPSInput, SerialInput);

//handle new message from message pump (Tail)
mkt3339GPSInput.prototype.onNewLine = function(message) {
    message = message.trim();
    
    var messageId = message.substring(1,6);
    if ( 'whitelist' in this._options ) {
        if ( !_.contains(this._options.whitelist, messageId) ) {
            return;
        }
    }

    if (messageId == "GPRMC") {
        message = mkt3339GPSInput.cleanUpRMC(message);
    }

    this.emit('message', message);
};

mkt3339GPSInput.cleanUpRMC = function(message) {
    // $GPRMC,214930.000,A,4741.1764,N,12224.1899,W,0.02,0.00,010614,,,D*78
    // $GPRMC,152337,V,4741.0220,N,12224.3803,W,,,210412,018.2,E*74
    var parts = message.split(',');

    parts[0] = "GPRMC";                     //remove the $
    parts[1] = parts[1].substring(0, 8);    //shorten date
    parts[10] = '018.2';                    //add variance
    parts[11] = 'E';
    parts.pop();                       //remove new nmea 2.3 field

    message = parts.join(',');
    return '$' + message + '*' + nmea.checksum(message);
}


module.exports = mkt3339GPSInput;
