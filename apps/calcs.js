//! calcs.js
//! Calculate synthetic data from sensor data
//! custom values.
//! version : .1
//! homegrownmarine.com

var _ = require('lodash')

var calcs = require('homegrown-sailing').Calcs;
var delayedInputs = require('homegrown-sailing').Utilities.delayedInputs;

exports.load = function(server, boatData, settings) {
    console.info("calcs:loaded")

    var functions = [
        //TODO: how to ignore system tws and direction?
        delayedInputs(calcs.tws),
        delayedInputs(calcs.twa),
        delayedInputs(calcs.twd),
        delayedInputs(calcs.vmg)
    ];
    var setX = delayedInputs(calcs.set);
    var driftX = delayedInputs(calcs.drift);

    boatData.on('data', function(data) {
        var syntheticData = {};

        _.each(functions, function(f) {
            var result = f(_.assign({}, data, syntheticData));

            if (result) {
                _.extend(syntheticData, result);
            }
        });

        if ( _.size(syntheticData) ) {
            boatData.broadcast(syntheticData);
        }

        var set = setX(data);
        var drift = driftX(data);
        if (set) {
            //broadcast the new bit of data. boatData will handle
            //NMEA formatting.
            boatData.broadcast(_.extend({type: 'vdr'}, set, drift));
        }
    });
};
