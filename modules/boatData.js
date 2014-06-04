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

var SerialInput = require('./serialInput');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var moment = require('moment');
var nmea = require('./nmea');

function BoatData(sources) {
    EventEmitter.call(this);

    //
    this._now = {};
    this.nmea = nmea;

    this._sources = _.map(sources, function(config) {
        if ( 'driver' in config ) {
            var driver = require(config.driver)
            return new driver(config);
        }
        //default to serial driver
        return new SerialInput(config);
    });
};
util.inherits(BoatData, EventEmitter);

// Start message pump
BoatData.prototype.start = function() {
    var _this = this;
    _.each( this._sources, function(source) {
        source.start();
        source.on('message', function(message) {
            _this.onMessage.call(_this, message, source);
        });
    });
};

// Fire events for nmea message, and parsed data (where appropriate)
BoatData.prototype.emitData = function(message, data) {
    if ( message ) {
        this.emit('nmea', message);  
    }

    if ( data ) {
        this.emit('data:'+data.type, data);
        this.emit('data', data);
        this._now = _.extend( this._now, _.omit(data, 'message','type') );
    }
};

//handle new message from message pump (Tail)
BoatData.prototype.onMessage = function(message, sender) {
    message = message.trim();
    var messageId = message.substring(1,6);

    // re-broadcast (ie. MUX)
    _.each(this._sources, function(source) {
        if (sender != source) {
            source.write(message);
        }
    });

    var data = this.nmea.parse(message);

    this.emitData(message, data);
};

//get our now state
BoatData.prototype.now = function() {
    //TODO: time stamp fields
    return this._now;
};

// Broadcast a new piece of data.  If a NMEA message is supplied,
// or generatable, it will be broadcast on the NMEA network as well
BoatData.prototype.broadcast = function(message, data) {
    if ( message != null && !_.isString(message) ) {
        data = message;
        message = null;
    }

    if ( data && !message ) {
        message = this.nmea.format(data);    
    }

    this.emitData(message, data);

    // send message to all streams
    if ( message ) {
        _.each( this._sources, function(source) {
            source.write(message);
        });
    }
};

module.exports.BoatData = BoatData;