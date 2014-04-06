//! boat_data_replay.js
//! load log file, and slowly replay.  Currently coded to assume hdg is
//! broadcast at 10Hz.
//! version : 0.7
//! homegrownmarine.com

var path = require('path');
var util = require('util');
var fs = require('fs');
var readline = require('readline');

var _ = require('lodash');
var moment = require('moment');
var nmea = require('./nmea');


var EventEmitter = require('events').EventEmitter;

function boat_data() {
    EventEmitter.call(this);

    this._currentFile = null;

    //
    this._current = {};
    this._queue = [];
    
}
util.inherits(boat_data, EventEmitter);

boat_data.prototype.start = function(config) {
    if ( this._currentFile == null ) {
        
        //TODO: make this configurable
        var file = path.join(config['log:dataDir'],'14030812.txt');

        this._currentFile = readline.createInterface({
            input: fs.createReadStream(file),
            output: process.stdout,
            terminal: false
        });

        this._currentFile.on('line', _.bind(function(line){
                //add read line to queue.  this happens faster
                //than we want to broadcast
                this._queue.push(line);
                if ( this._queue.length > 500 ) {
                    this._currentFile.pause();
                }
            }, this));
    }

    this.processQueue();
}

boat_data.prototype.processQueue = function() {
    if ( this._queue.length < 100 ) {
        this._currentFile.resume();
    }

    var loop = true;
    while (this._queue.length && loop) {
        var message = this._queue.shift();
        loop = this.onNewLine(message);
    }

    setTimeout(_.bind(this.processQueue, this), 100);
}


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

boat_data.prototype.onNewLine = function(message) {
    message = message.trim();
    var messageId = message.substring(1,6);

    var data = nmea.parse(message);

    this.emitData(message, data);

    if ( data && data.type == 'hdg' ) {
        return false;
    }
    return true;
}

boat_data.prototype.current = function() {
    return this._current;
}
boat_data.prototype.broadcast = function(message, data) {
    if ( data && message === null ) {
        message = nmea.format(data);    
    }
    this.emitData(message, data);
};
module.exports = boat_data;
