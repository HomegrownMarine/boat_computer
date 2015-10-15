//! H2183CompassInput.js
//! SerialInput subclass for AIRMAR H2183 compass.  Must be put
//! into high speed mode on each startup
//! version : 0.2
//! homegrownmarine.com

var util = require('util');
var nmea = require('../modules/nmea');
var winston = require('winston');

var SerialInput = require('./serialInput');

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // local object constructor

var _ = require('lodash');

var defaultOptions = {
            "name": "default",
            "whitelist": ["HCHDG","YXXDR","TIROT"],
            "write": false
        };

function H2183CompassInput(options) {
    options = _.extend({}, defaultOptions, options);
    SerialInput.call(this, options);

    var _this = this;

    var onLowSpeedConnect = function() {
        winston.info('H2183Compass: onLowSpeedConnect');

        // first, set baud to 38400
        var messages = ["PAMTX,0",              // disable, for setting baud
                        "PAMTC,BAUD,38400"      // set baud
                        ];  
        _.each(messages, function(message) { _this.serialPort.write( nmea.format(message) + '\r\n' ); });

        setTimeout(function() {
            // reconnect after 500ms
            _this.serialPort.close();

            try {
                _this.serialPort = new SerialPort(_this._options.path, {
                        baudrate: 38400,
                        parser: serialport.parsers.readline("\r\n")
                    }, false);

                _this.serialPort.on('error', function(error) {
                    winston.error("H2183Compass: high speed - error event fired", error);
                });

                _this.serialPort.open( function(error) {
                    if (error) winston.error("H2183Compass: high speed - error on open", error);
                    onHighSpeedConnect();
                });

            } catch (error) {
                winston.error("H2183Compass: high speed - exception on open", error);
            }
        }, 1000);
    };

    var onHighSpeedConnect = function() {
        winston.info('H2183Compass: onHighSpeedConnect');

        //set up message rates
        var messages = ['PAMTX,1']; // re-enable message transmission.

        _.each(messages, function(message) { _this.serialPort.write( nmea.format(message) + '\r\n' ); });

        _this.serialPort.on('data', _.bind(_this.onNewLine, _this));
        _this._serialPortReady = true;
    };

    this.start = function() {
        try {
            _this.serialPort = new SerialPort(_this._options.path, {
                    baudrate: 4800,
                    parser: serialport.parsers.readline("\r\n")
                }, false);

            _this.serialPort.on('error', function(error) {
                winston.error("H2183Compass: low speed - error event fired", error);
            });

            _this.serialPort.open( function(error) {
                if (error) winston.error("H2183Compass: low speed - error on open", error);
                onLowSpeedConnect();
            });

        } catch (error) {
            winston.error("H2183Compass: low speed - exception on open", error);
        }
    };
}
util.inherits(H2183CompassInput, SerialInput);

H2183CompassInput.highSpeedCommands = function() {
    return [
        "PAMTC,EN,ALL,1,1",
        "PAMTC,EN,ROT,1,10",
        "PAMTC,EN,S"
    ];
};

module.exports = H2183CompassInput;
