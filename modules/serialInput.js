//! serial_port.js
//! 
//! version : 0.1
//! homegrownmarine.com

var util = require('util')

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // local object constructor
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

var defaultOptions = {
            "name": "default",
            // "whitelist": [],
            "write": true
        };

function SerialInput(options) {
    EventEmitter.call(this);

    //
    this._options = _.extend({}, defaultOptions, options);
    this._serialPortReady = false;
    if ( this._options.rateLimit > 0 ) {
        this._lastSent = {};
    }
};
util.inherits(SerialInput, EventEmitter);

// Start message pump
SerialInput.prototype.start = function() {
    var _this = this;
    this.serialPort = new SerialPort(this._options.path, {
            baudrate: this._options.baud,
            parser: serialport.parsers.readline("\r\n")
        }, function() {
            _this._serialPortReady = true;
        });

    this.serialPort.on('data', _.bind(this.onNewLine, this));
};

//handle new message from message pump (Tail)
SerialInput.prototype.onNewLine = function(message) {
    message = message.trim();
    
    if ( 'whitelist' in this._options ) {
        var messageId = message.substring(1,6);
        if ( !_.contains(this._options.whitelist, messageId) ) {
            return;
        }
    }

    this.emit('message', message);
};

SerialInput.prototype.write = function(message) {

    //TODO: ratelimiting
    if ( this._serialPortReady ) {
        var messageId = message.substring(1,6);

        if ( 'whitelist' in this._options ) {
            if ( !_.contains(this._options.whitelist, messageId) ) {
                return;
            }
        }

        if ( this._options.rateLimit > 0 ) {
            var now = new Date().getTime();
            if ( messageId in this._lastSent && this._lastSent[messageId] + this._options.rateLimit > now ) {
                return;
            }
            this._lastSent[messageId] = now;
        }

        try {
            this.serialPort.write(message);
        }
        catch(e) {
            console.error('error with serial port '+this._options.name, message);
            throw e;
        }
    }
};

module.exports = SerialInput;
