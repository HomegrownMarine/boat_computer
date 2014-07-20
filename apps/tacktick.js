//! tacktick.js
//! Create tacktick proprietary messages to display
//! custom values.
//! version : .1
//! homegrownmarine.com

function formatTacktickMessage(data) {
    var key = data.subtype === 'heading' ? 'FFP' : 'FFD';
    key += data.index;

    var parts = ["PTAK", key].concat(data.values);
    return parts.join(',');
};

exports.load = function(server, boatData, settings) {
    //add tacktick formatter to boatData's nmea parser
    boatData.nmea.parsers.PTAK = {
        format: formatTacktickMessage
    };

    //TODO: internal: don't log?

    //every time we get a heading message, make a custom 
    //tacktick message and send it back out.
    //TODO: rateLimiting will throttle this.
    boatData.on('data:xhr', function(data) {
        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'data',
            'index': 1,
            values: [Math.abs(data.heel)]
        });
    });

    //every time we get a polar target message, 
    //format and rebroadcast it.
    boatData.on('data:targets', function(data) {
        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'data',
            'index': 2,
            values: [data.targetSpeed]
        });

        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'data',
            'index': 3,
            values: [data.targetAngle]
        });
    });

    //every 15s rebroadcast the heading label
    setInterval(function() {
        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'heading',
            'index': 1,
            values: ['HEEL', '###@']
        });

        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'heading',
            'index': 2,
            values: ['TGTSPD', 'kts']
        });

        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'heading',
            'index': 3,
            values: ['TGTTWA', '###@']
        });
    }, 15000);
};
