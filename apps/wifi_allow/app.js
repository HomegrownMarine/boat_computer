/* some devices call home before accepting a wifi access point.  Spoof those responses. */

var path = require('path');

exports.load = function(server, boatData, settings) {
    
    var endpointMap = [
    	{'route': '/kindle-wifi/wifiredirect.html', 'responseFile': 'kindle.html'} ,
        {'route': '/kindle-wifi/wifistub.html', 'responseFile': 'kindle.html'} //http://spectrum.s3.amazonaws.com
    ];

    _.each(endpointMap, function(endpoint) {
        server.get(endpoint.route, function(req, res) {
            res.sendFile(path.join(__dirname + endpoint.responseFile));
        });
    });
};