//! tacktick.js
//! Create tacktick proprietary messages to display
//! custom values.
//! version : .1
//! homegrownmarine.com

// CURRENTLY DISABLED :: untested, provided as example

function formatTacktickMessage(data) {
    var key = data.subtype === 'heading'?'FFP':'FFD';
    key += data.index;

    var parts = ["PTAK",key].concat(data.values);
    return parts.join(',');
};

exports.load = function(server, boatData, settings) {
    //add tacktick formatter to boatData's nmea parser
    boatData.nmea.parsers.PTAK = {
        format: formatTacktickMessage
    };

    //every time we get a heading message, make a custom 
    //tacktick message and send it back out.
    boatData.on('data:hdg', function(data) {
        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'data',
            'index': 1,
            parts: [Math.abs(data.heel)]
        });
    });

    //every 5s rebroadcast the heading label
    setInterval(function() {
        boatData.broadcast({
            'type': 'ptak',
            'subtype': 'heading',
            'index': 1,
            parts: ['HEEL','@']
        });
    }, 5000);
};