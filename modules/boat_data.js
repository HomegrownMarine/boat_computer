//! nmea.js
//! parse and format NMEA 0183 sentences.
//! version : 0.1
//! homegrownmarine.com
//! TODO: license

//  Module will "tail" latest file, switching on the hour
//  parse messages and send out events that they've arrived
//  maintain object of current state for /now
//  switch to new file when created


var path = require('path');
var util = require('util');
var fs = require('fs');

//TODO: checkout https://github.com/whitesheep/node-tail-native
var Tail = require('tail').Tail;
var EventEmitter = require('events').EventEmitter;

var _ = require('underscore-node');
var moment = require('moment');
var nmea = require('./nmea');


var config = require('../config.json');
var DATA_DIR = config.logDataDir;


function boat_data() {
    EventEmitter.call(this);

    this._currentFile = null;
    this._currentTail = null;

    //
    this._current = {};
    this._filters = [];
};
util.inherits(boat_data, EventEmitter);

// Filter some messages from the data stream entirely
boat_data.prototype.addFilters = function(filters) {
    this._filters = _.union(this._filters, filters);
};

// Start message pump
boat_data.prototype.start = function() {
    this.timeout = setInterval(_.bind(this.checkCurrentFile, this), 5000);
};


//make sure we're using the file for right now
boat_data.prototype.checkCurrentFile = function() {
    var rightFile = path.join(DATA_DIR, moment().format('YYYYMMDDHH')+'.txt');

    if ( this._currentFile !== rightFile ) {
        if ( this._currentTail !== null) {
            var oldFile = this._currentTail;
            //give us a few seconds to get the last out of the old file,
            // --not sure if this is necessary.
            setTimeout(function() {
                oldFile.unwatch();
                //TODO: do I need to remove the event handler, too?
            }, 3000);
            
        }
        
        if ( fs.existsSync(rightFile) ) {
            this._currentTail = new Tail(rightFile);
            this._currentTail.on("line", _.bind(this.onNewLine, this));
            this._currentFile = rightFile;            
        }
    }
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
    var messageId = message.substring(1,6);

    if ( _.contains(this._filters(messageId)) ) {
        return;
    }

    data = nmea.parse(message);
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
        //TODO: append message to end of file.
    }
};

module.exports = new boat_data();
