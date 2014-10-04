//! polars.js
//! broadcast target speed, angle, and heel on network.
//! version : 0.1
//! homegrownmarine.com

var PolarTable = require('homegrown-polars').PolarTable;

exports.load = function(server, boat_data, settings) {
    var filename = settings.get('polars:table');
    if (filename) {
        PolarTable.fromTSV(filename, function(polars) {
            //once per second broadcast current target.
            setInterval(function() {
                var now = boat_data.now();
                var upwind = Math.abs(now.twa) < 90;
                var targets = {
                    type: 'targets',
                    targetSpeed: polars.targetSpeed(now.tws, upwind),
                    targetAngle: polars.targetAngle(now.tws, upwind),
                    targetHeel: polars.targetHeel(now.tws, upwind)
                };

                boat_data.broadcast(null, targets);
            }, 1000);
        });
    }
};