var assert = require('chai').assert;
var moment = require('moment');

var nmea = require('../modules/nmea.js');

describe('checksum', function(){
    it(' should calculate checksum correctly', function(){
        assert.equal(nmea.checksum('GPRMC,204658,A,4740.2949,N,12228.5660,W,005.4,300.8,100410,018.2'), '0A');
        assert.equal(nmea.checksum('GPRMC,030000.6,A,4740.36415,N,12225.35953,W,000.02,059.5,160612,016.6,E'), '4A');
        assert.equal(nmea.checksum('IIHDG,298,,,18,E'), '18');
    });
});

describe('coordinates', function() {
    it(' should be parsed', function() {
        assert.closeTo( nmea.coordinate.parse(4740.2949,'N'), 47.6715816, .000001 );
        assert.closeTo( nmea.coordinate.parse(12228.5660,'W'), -122.4761, .000001 );
        //TODO: E & S & 0.0?
    });

    it(' should be formatted', function() {
        assert.deepEqual(nmea.coordinate.format(47.6715816,'lat'), ["4740.294896","N"]);
        assert.deepEqual(nmea.coordinate.format(-122.4761,'lon'), ["12228.566000", "W"]);
        //TODO: E & S & 0.0?
    });
});

describe('validate', function() {
    it('should validate true', function() {
        assert.ok(nmea.validate('$GPRMC,204658,A,4740.2949,N,12228.5660,W,005.4,300.8,100410,018.2*0A'));
        assert.notOk(nmea.validate('$GPRMC,204658,A,4740.2949,N,12228.5660,W,006.4,300.8,100410,018.2*0A'));
    });
});

describe('parsers', function() {
    it('should not parse invalid emails', function() {
        assert.isNull( nmea.parse('$GPRMC,204658,A,4740.2949,N,12228.5660,W,006.4,300.8,100410,018.2*0A') );
    });

    nmea.parsers.TST = {
        parse: function(message, parts) {
            var data = {
                msg: message,
                type: 'tst',
                part1: parts[1],
                part2: parts[2],
                part3: parts[3],
                part4: parts[4]
            };
            return data;
        },
        format: function(data) {
            var parts = ['TSTST',data.part1,data.part2,data.part3,data.part4];
            return parts.join(',');
        }
    }

    it(' should parse', function() {
        var actual = nmea.parse('$TSTST,part1,part2,part3,part4*50');
        var expected = {
            msg: 'TSTST,part1,part2,part3,part4',
            type: 'tst',
            part1: 'part1',
            part2: 'part2',
            part3: 'part3',
            part4: 'part4'
        };
        assert.deepEqual(actual, expected);
    });

    it(' should format', function() {
        var expected = '$TSTST,part1,part2,part3,part4*50';
        var actual = nmea.format({
            type: 'tst',
            part1: 'part1',
            part2: 'part2',
            part3: 'part3',
            part4: 'part4'
        });
        assert.equal(actual, expected);
    });

    
    describe('RMC', function() {
        it(' should parse');
            // var data = nmea.parse('$GPRMC,030000.6,A,4740.36415,N,12225.35953,W,000.02,059.5,160612,016.6,E*4A');
            // var expected = {
            //     msg: 'GPRMC,030000.6,A,4740.36415,N,12225.35953,W,000.02,059.5,160612,016.6,E',
            //     type: 'rmc',
            //     lat: 47,
            //     latStr: '4740.36415,N',
            //     lon: -122,
            //     lonStr: '12225.35953,W',
            //     time: moment.utc('160612 030000', "DDMMYY HHmmssS"),
            //     variation: -16.6
            // };
        // });
        // assert.deepEqual(data, expected)
    });

    describe('HDG', function() {
        it('should parse');
        it('should format');
    });
});

