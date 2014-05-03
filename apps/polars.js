//! polars.js
//! calculate polar targets based on tws.
//! version : 0.1
//! homegrownmarine.com


var fs = require('fs');
var readline = require('readline');

var _ = require('lodash');

var loading = false;

function polarTable() {
    this.all = {};
    this.targets = {'up': {}, 'down': {}};
}

polarTable.prototype.getInterpolatedValue = function(tws, key, upwind) {
    var appropriateTargets = this.targets[upwind?'up':'down'];
    var twspeeds = _.keys(appropriateTargets);

    var found = [0,0];
    for (var i=1; i < twspeeds.length; i++) {
        if ( tws < twspeeds[i] ) {
            found[1] = twspeeds[i];
            found[0] = twspeeds[i-1];
            break;
        }
    }
    
    var percentFirst = 1-(tws-found[0]) / (found[1]-found[0]);
    var interpolatedValue = percentFirst * appropriateTargets[found[0]][key] + (1-percentFirst) * appropriateTargets[found[1]][key];
    return interpolatedValue;    
}

polarTable.prototype.targetSpeed = function(tws, upwind) {
    return this.getInterpolatedValue(tws, 'speed', upwind);
}

polarTable.prototype.targetAngle = function(tws, upwind) {
    return this.getInterpolatedValue(tws, 'twa', upwind);
}

polarTable.prototype.targetHeel = function(tws, upwind) {
    return this.getInterpolatedValue(tws, 'heel', upwind);
}

//creates polarTable from filename
polarTable.fromFile = function(filename, callback) {

    var polars = new polarTable();

    var rd = readline.createInterface({
        input: fs.createReadStream(filename),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', function(line) {
        line = line.trim();
        if ( line.length === 0 || line.indexOf('#') === 0 ) {
            return;
        }

        // TWS TWA VMG Heel Lee
        var target = false;
        var upwind = true;

        // if the line ends in a *, it's a target
        // for this wind speed
        if (line.substring(line.length-1) == '*') {
            target = true;
            line = line.substring(0,line.length-1);
        }


        var cols = line.split(' ');  //TODO: CSV
        var tws = +cols[0],
            twa = +cols[1],
            speed = +cols[2],
            heel = +cols[3],
            lee = +cols[4];


        upwind = twa < 90;
        if ( !(tws in polars.all) ) {
            polars.all[tws] = {};
        }

        polars.all[tws][twa] = {speed: speed, heel: heel, lee: lee};
        if (target) {
            polars.targets[upwind?'up':'down'][tws] = {twa: twa, speed: speed, heel: heel};
        }
    });

    rd.on('close', function() {
        callback(polars);
    });
}

exports.polarTable = polarTable;

exports.load = function(server, boat_data, settings) {
    var filename = settings.get('polars:table');
    if ( filename ) {
        polarTable.fromFile(filename, function(polars) {
            setInterval(function() {
                var now = boat_data.now();
                var upwind = Math.abs(now.twa) < 90;
                var targets = {
                    targetSpeed: polars.targetSpeed(now.tws, upwind),
                    targetAngle: polars.targetAngle(now.tws, upwind),
                    targetHeel: polars.targetHeel(now.tws, upwind)
                };

                boat_data.broadcast(null, targets);
            }, 1000);
        });
    }
};
