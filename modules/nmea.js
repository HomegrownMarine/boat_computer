//! nmea.js
//! parse and format NMEA 0183 sentences.
//! version : 0.1
//! homegrownmarine.com

var winston = require('winston');
var moment = require('moment');
var _ = require('lodash');

//TODO: move to util class
var coordinate = module.exports.coordinate = {
    parse: function(string, cardinalDir) {
        var value = +string;
        var degrees = parseInt(value/100);
        value -= degrees*100;
        degrees += value / 60.0;
        return (cardinalDir == 'S' || cardinalDir == 'W'?-1:1) * degrees;
    },
    format: function(value, latOrLon) {
        var direction = (value >= 0 ? 'E':'W');
        if (latOrLon === 'lat') {
            direction = (value >= 0 ? 'N':'S');
        }

        value = Math.abs(value);
        var degrees = parseInt(value);

        //TODO: pad?
        var string = ''+degrees+((value-degrees)*60).toFixed(6);

        return [string, direction];
    }
};

var parsers = {};
module.exports.parsers = parsers;

/*Parse RMC Message - Recommended Minimum Navigation Information
    
    Expected format:
                                                               12
                   1 2       3 4        5 6   7   8    9  10 11 |
                   | |       | |        | |   |   |    |   | |  |
    $--RMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,xxxx,x.x,a*hh

    1) Time (UTC) 
    2) Status, V = Navigation receiver warning 
    3) Latitude 
    4) N or S 
    5) Longitude 
    6) E or W 
    7) Speed over ground, knots 
    8) Track made good, degrees true 
    9) Date, ddmmyy
    10) Magnetic Variation, degrees 
    11) E or W 
    12) Checksum
    
    Example Messages:
    $GPRMC,204658,A,4740.2949,N,12228.5660,W,005.4,300.8,100410,018.2,E*63
    $GPRMC,225426,A,4741.9098,N,12225,2008,W,005.2,318.7,220412,018.0,E*65
    $GPRMC,152337,V,4741.0220,N,12224.3803,W,,,210412,018.2,E*74
    $GPRMC,030000.6,A,4740.36415,N,12225.35953,W,000.02,059.5,160612,016.6,E*4A   //GPS 18X 5Hz
    $GPRMC,030944.8,A,4738.3356,N,12221.6469,W,0.01,305.20,031014,018.2,E*75      //GPS 19X 10Hz

    -- NMEA 2.3 adds another column
    $GPRMC,214930.000,A,4741.1764,N,12224.1899,W,0.02,0.00,010614,,,D*78
*/
parsers.RMC = {
    parse: function(message,parts) {
        var data = {
            msg: message,
            type: 'rmc',
            lat: coordinate.parse(parts[3],parts[4]),
            latStr: parts[3]+','+parts[4],
            lon: coordinate.parse(parts[5],parts[6]),
            lonStr: parts[5]+','+parts[6],
            time: moment.utc(parts[9]+' '+parts[1], "DDMMYY HHmmssS"),
            variation: +parts[10] * (parts[11] == 'E'?-1:1)
        };

        if (parts[7])
            data.sog = +parts[7];
        if (parts[8])
            data.cog = +parts[8];

        return data;
    }
};

/*RMB Recommended Minimum Navigation Information

    Expected format:
                                                                14
           1   2 3    4    5       6 7        8 9  10  11  12 13 |
           |   | |    |    |       | |        | |   |   |   | |  |
    $--RMB,A,x.x,a,c--c,c--c,llll.ll,a,yyyyy.yy,a,x.x,x.x,x.x,A*hh

    1) Status, V = Navigation receiver warning 
    2) Cross Track error - nautical miles
    3) Direction to Steer, Left or Right
    4) TO Waypoint ID
    5) FROM Waypoint ID
    6) Destination Waypoint Latitude 
    7) N or S
    8) Destination Waypoint Longitude 
    9) E or W
    10) Range to destination in nautical miles 
    11) Bearing to destination in degrees True 
    12) Destination closing velocity in knots
    13) Arrival Status, A = Arrival Circle Entered 
    14) Checksum
*/
parsers.RMB = {
// GPRMB,A,{xte:.2f},{dts},{from_wp},{to_wp},{lat},{latDir},{lon},{lonDir},{dtw:.1f},{btw:.0f},{vmgwp:.2f},V

    format: function(data) {
        var toLat = coordinate.format(data.to.lat, 'lat');
        var toLon = coordinate.format(data.to.lon, 'lon');

        var parts = ["IIRMB",
            "A",
            data.xte.toFixed(2),
            data.dts,
            data.to.name,
            data.from.name,
            toLat[0],
            toLat[1],
            toLon[0],
            toLon[1],
            data.dtw.toFixed(1),
            data.btw.toFixed(0),
            data.vmgw.toFixed(2),
            'V'
        ];

        return parts.join(',');
    }
};

/*Parse HDG message - Heading, Deviation & Variation
    
    Expected format:
    
             1   2 3   4 5  6
             |   | |   | |  | 
    $--HDG,x.x,x.x,a,x.x,a*hh
    
    1) Magnetic Sensor heading in degrees
    2) Magnetic Deviation, degrees
    3) Magnetic Deviation direction, E = Easterly, W = Westerly
    4) Magnetic Variation degrees
    5) Magnetic Variation direction, E = Easterly, W = Westerly
    6) Checksum

    Example Messages:
    $IIHDG,298,,,18,E*18
    $HCHDG,192.5,0.0,E,,*26
*/
parsers.HDG = {
    parse: function(message,parts) {
        return {
            msg: message,
            type: 'hdg',
            hdg: +parts[1]  //TODO: convert to true
        };
    }
};


/*
Parse MWV Message - Wind Speed and Angle
    
    Expected format:

             1 2   3 4  5
             | |   | |  | 
    $--MWV,x.x,a,x.x,a*hh
    
    1) Wind Angle, 0 to 360 degrees 
    2) Reference, R = Relative, T = True 
    3) Wind Speed 
    4) Wind Speed Units, K/M/N 
    5) Status, A = Data Valid 
    6) Checksum
    
    Example Messages:
    $CRMWV,35.5,R,,,A*7F
    $IIMWV,27.71,R,14.03,N,A*38
*/
parsers.MWV = {
    parse: function(message, parts) {
        var data = {
            msg: message,
            type: 'mwv',
            ref: parts[2]
        };

        if ( parts[2] == 'R' ) {
            angle = 'awa';
            speed = 'aws';
        }
        else {
            // angle = 'twa';
            // speed = 'tws';

            //not accepting twa from instruments
            return null;
        }

        data[angle] = +parts[1];     //assumes K, TODO: unit conversion
        data[speed] = +parts[3];

        if (data[angle] > 180) {
            data[angle] = -1 * (360 - data[angle]);
        }
        
        return data;
    },
    format: function() {
        var parts = [
            "IIMWV",
            data.twa.toFixed(1),
            "T",
            data.tws.toFixed(2),
            "N",
            "A"
        ];

        return parts.join(',');
    }
};

/*
Parse VHW Message - Water Speed and Heading
    
    Expected Format:

             1 2   3 4   5 6   7 8  9
             | |   | |   | |   | |  | 
    $--VHW,x.x,T,x.x,M,x.x,N,x.x,K*hh

    1) Degress True 
    2) T = True 
    3) Degrees Magnetic 
    4) M = Magnetic 
    5) Knots (speed of vessel relative to the water) 
    6) N = Knots 
    7) Kilometers (speed of vessel relative to the water) 
    8) K = Kilometres 
    9) Checksum
    
    Example Messages:
    $CRVHW,,,,,6.1,N,,*3F
    $IIVHW,,,,,4.87,N,9.03,K*4D
*/
parsers.VHW = {
    parse: function(message,parts) {
        return {
            msg: message,
            type: 'vhw',
            speed: +parts[5]  //TODO: may need to unit convert if [5] isn't populated
        };
    }
};

/*
Parse or format VDR Message - Set and Drift
    
    Expected Format:
             1 2   3 4   5 6  7
             | |   | |   | |  | 
    $--VDR,x.x,T,x.x,M,x.x,N*hh

    1) Degress True 
    2) T = True 
    3) Degrees Magnetic 
    4) M = Magnetic 
    5) Knots (speed of current) 
    6) N = Knots 
    7) Checksum
*/
parsers.VDR = {
    parse: function(message,parts) {
        return {
            msg: message,
            type: 'vdr',
            set: parts[1],
            drift: parts[5]
        };
    },
    format: function(data) {
        var parts = ["IIVDR",
            data.set.toFixed(2),
            "T",
            "",
            "",
            data.drift.toFixed(2),
            "N"
        ];

        return parts.join(',');
    }
};

/*Parse ROT Message - Rate Of Turn
    
    Expected Format:
             1 2  3 
             | |  | 
    $--ROT,x.x,A*hh
    
    1) Rate Of Turn, degrees per minute, "-" means bow turns to port 
    2) Status, A means data is valid 
    3) Checksum
    
    Example Messages:
    $TIROT,-20.3,A*27 */
parsers.ROT = {
    parse: function(message, parts) {
        return {
            msg: message,
            type: 'rot',
            rot: +parts[1]
        };
    }
};


// $IIDPT,075.1,-1.0,*43
parsers.DPT = {
    parse: function(message, parts) {
        return {
            msg: message,
            type: 'dpt',
            depth: +parts[1]        //TODO: more
        };
    }
};

// $YXXDR,A,0.4,D,PTCH,A,-4.0,D,ROLL*70
parsers.XDR = {
    parse: function(message, parts) {
        return {
            msg: message,
            type: 'xdr',
            pitch: +parts[2],
            heel: +parts[6]
        };
    }
};

// Calculate nmea checksum.  Assumes $ is not passed in
var checksum = module.exports.checksum = function(message) {
    var csum = 0;
    for ( var i=0; i < message.length; i++ ) {
        csum = csum ^ message.charCodeAt(i);
    }


    csum = csum.toString(16);
    if (csum.length == 1) {
        csum = '0'+csum;
    }
    return csum.toUpperCase();
};

// Validate nmea0183 message, assumes first character is $.
var validate = module.exports.validate = function(message) {
    if ( message.charAt(message.length-3) == '*' ) {
        return checksum(message.substring(1,message.length-3)) == message.substring(message.length-2,message.length);
    }
    return true;
};

module.exports.messageId = function(message) {
    var end = message.indexOf(',');
    return message.substring(1,end);
};

module.exports.parse = function(message) {
    message = message.trim(); //proper messages end in \r\n

    if ( !validate(message) ) {
        return null;
    }

    try {
        message = message.substring(1, message.length-3); //trim xsum and $
        var type = message.substring(2, 5);

        if ( type in parsers && parsers[type].parse ) {
            var parts = message.split(',');
            return parsers[type].parse(message, parts);
        }
    }
    catch(e) {
        winston.error('Error parsing NMEA message :', e);
    }

    return null;
};

//TODO : format string or object
module.exports.format = function(data) {
    var message;
    if ( _.isString(data) ) {
        message = data;
    }
    else if ( data.type && data.type.toUpperCase() in parsers && parsers[data.type.toUpperCase()].format ) {
        message = parsers[data.type.toUpperCase()].format(data);
    }

    if (message) 
        return '$' + message + '*' + checksum(message);
    else
        return null;
};
