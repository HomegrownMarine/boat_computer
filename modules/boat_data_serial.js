//! serial_boat_data.js
//! monitor serial port, parse all NMEA messages incoming, and emit
//! events for rest of app
//! version : 0.1
//! homegrownmarine.com

//  Module will stream all NMEA data from serial port, broadcasting
//  events for nmea data and parsed JSON data.

//TODO : this should be considered a best practice and used to make a base class

var path = require('path');
var util = require('util');
var fs = require('fs');

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var moment = require('moment');
var nmea = require('./nmea');

function boat_data() {
    EventEmitter.call(this);

    //
    this._current = {};
    this._filters = [];
};
util.inherits(boat_data, EventEmitter);

// Filter some messages from the data stream entirely
boat_data.prototype.addFilters = function(filters) {
    if ( filters ) {
        this._filters = _.union(this._filters, filters);    
    }
};

// Start message pump
boat_data.prototype.start = function(config) {
    this.addFilters(config['boatData:filter']);

    this.serialPort = new SerialPort(config.serialport.path, {
        baudrate: config.serialport.baudrate,
        parser: serialport.parsers.readline("\r\n")
    });

    this.serialPort.on('data', _.bind(this.onNewLine, this));
};

// Fire events for nmea message, and parsed data (where appropriate)
boat_data.prototype.emitData = function(message, data) {
    if ( message ) {
        this.emit('nmea', message);  
    }

    if ( data ) {
        this.emit('data:'+data.type, data);
        this.emit('data', data);
        this._current = _.extend( this._current, _.omit(data, 'message','type') );
    }
};

//handle new message from message pump (Tail)
boat_data.prototype.onNewLine = function(message) {
    message = message.trim();
    var messageId = message.substring(1,6);

    var data;
    if ( !_.contains(this._filters, messageId) ) {
        data = nmea.parse(message);
    }

    this.emitData(message, data);
};

//get our current state
boat_data.prototype.current = function() {
    //TODO: time stamp fields
    return this._current;
};

// Broadcast a new piece of data.  If a NMEA message is supplied,
// or generatable, it will be broadcast on the NMEA network as well
boat_data.prototype.broadcast = function(message, data) {
    if ( data && !message ) {
        message = nmea.format(data);    
    }

    this.emitData(message, data);

    if ( message ) {
        this.serialPort.write(message);
    }
};

module.exports = boat_data;