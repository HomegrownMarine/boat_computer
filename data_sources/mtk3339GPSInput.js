//! mtk3339GPSInput.js
//! SerialInput subclass for mtk3339 based GPS (see adafruit ultimate gps)
//! Sends setup messages, to get ideal message rates and baud.  Translates
//! messages into better formats, where necessary.
//! version : 0.2
//! homegrownmarine.com

var util = require('util');
var nmea = require('../modules/nmea');

var _ = require('lodash');
var winston = require('winston');


var SerialInput = require('./serialInput');

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // local object constructor


var defaultOptions = {
            "name": "default",
            "whitelist": ["GPRMC","GPGGA","GPGSA","GPGSV"],
            "write": false
        };

function mkt3339GPSInput(options) {
    options = _.extend({}, defaultOptions, options);
    SerialInput.call(this, options);

    var _this = this;

    var onLowSpeedConnect = function() {
        winston.info('mkt3339GPS: onLowSpeedConnect');

        // first, set baud to 115200
        var message = 'PMTK251,115200';
        _this.serialPort.write( nmea.format(message) + '\r\n' );

        setTimeout(function() {
            // reconnect after 500ms
            _this.serialPort.close();

            _this.serialPort = new SerialPort(_this._options.path, {
                baudrate: 115200,
                parser: serialport.parsers.readline("\r\n")
            }, onHighSpeedConnect);

            _this.serialPort.on('data', _.bind(_this.onNewLine, _this));
        }, 500);
    };

    var onHighSpeedConnect = function() {
        winston.info('mkt3339GPS: onHighSpeedConnect');

        //set up message rates
        var messages = ['PMTK220,200',  // set position fix to 5Hz
                        'PMTK301,2',    // set DGPS to WAAS
                        'PMTK314,0,1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0']; // set update rates - multiples of position fix rate above

        _.each(messages, function(message) {
            _this.serialPort.write( nmea.format(message) + '\r\n' );
        });

        _this._serialPortReady = true;
    };

    this.start = function() {
        _this.serialPort = new SerialPort(_this._options.path, {
                baudrate: 9600,
                parser: serialport.parsers.readline("\r\n")
            }, onLowSpeedConnect);
    };
}
util.inherits(mkt3339GPSInput, SerialInput);

//handle new message from message pump (Tail)
mkt3339GPSInput.prototype.onNewLine = function(message) {
    message = message.trim();
    
    // The mkt3339 sometimes overruns it's buffer and sends
    // overlapped messages.
    var lastDollarIndex = message.lastIndexOf('$');
    if ( lastDollarIndex > 0 )
        message = message.substring(lastDollarIndex);

    var messageId = nmea.messageId(message);
    if ( 'whitelist' in this._options ) {
        if ( !_.contains(this._options.whitelist, messageId) ) {
            return;
        }
    }

    //TODO: emit status as seperate message?
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
};

mkt3339GPSInput.prototype.close = function() {
    this.serialPort.close();
    this._serialPortReady = false;
};

module.exports = mkt3339GPSInput;
