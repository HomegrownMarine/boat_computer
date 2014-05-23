//! ReplayInput_replay.js
//! load log file, and slowly replay.  Currently coded to assume hdg is
//! broadcast at 10Hz.
//! version : 0.7
//! homegrownmarine.com

var path = require('path');
var util = require('util');
var fs = require('fs');
var readline = require('readline');

var _ = require('lodash');

var EventEmitter = require('events').EventEmitter;

function ReplayInput(options) {
    EventEmitter.call(this);

    this._currentFile = null;

    //
    this._options = options;
    this._now = {};
    this._queue = [];
}
util.inherits(ReplayInput, EventEmitter);

ReplayInput.prototype.start = function() {
    if ( this._currentFile == null ) {
        
        //TODO: make this configurable
        var file = this._options.file;

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

ReplayInput.prototype.processQueue = function() {
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

ReplayInput.prototype.onNewLine = function(message) {
    message = message.trim();
    var messageId = message.substring(1,6);

    this.emit('message', message);

    //using heading message for timing
    if ( messageId == 'HCHDG' ) {
        return false;
    }
    return true;
}

ReplayInput.prototype.write = function() {
    //noop
}

module.exports = ReplayInput;
