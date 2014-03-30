var path = require('path');
var util = require('util');
var fs = require('fs');
var readline = require('readline');

var _ = require('underscore-node');
var moment = require('moment');
var nmea = require('./nmea');

var config = require('../config.json');
var DATA_DIR = config['log:data-dir'];

var file = DATA_DIR+'14030812.txt';

//module will "tail" latest file, switching on the hour
// parse messages and send out events that they've arrived
// maintain object of current state for /now
//switch to new file when created

var EventEmitter = require('events').EventEmitter;

function boat_data() {
    EventEmitter.call(this);

    this._currentFile = null;

    //
    this._current = {};
    this._queue = [];
    
}
util.inherits(boat_data, EventEmitter);

boat_data.prototype.start = function() {
    if ( this._currentFile == null ) {
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

boat_data.prototype.onNewLine = function(message) {
    data = nmea.parse(message);  //TODO: where to parse NMEA
    if ( data ) {
        this.emit('data:'+data.type, data);
        this.emit('data', data);
        this._current = _.extend( this._current, _.omit(data, 'msg','type') );
    }
    if ( data && data.type == 'hdg' ) {
        return false;
    }
    return true;
}

boat_data.prototype.current = function() {
    return this._current;
}
boat_data.prototype.broadcast = function(message, data) {
    if ( data && !message ) {
        message = nmea.format(data);    
    }

    if ( data ) {
        this.emit('data:'+data.type, data);
        this.emit('data', data);
    }
};
module.exports = new boat_data();
