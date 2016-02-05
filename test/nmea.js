var assert = require('chai').assert;
var moment = require('moment');
var _ = require('lodash');

var nmea = require('../modules/nmea.js');

describe('messageId', function() {
    it(' should get the first token', function() {
        assert.equal(nmea.messageId('$GPRMC,204658,A,4740.2949,N,12228.56'), 'GPRMC');
        assert.equal(nmea.messageId('$PSIM1242,030000.6,A,4740.36415'), 'PSIM1242');        
    });
});

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

describe('formatters', function() {
    it('data');
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

    it(' should format strings', function() {
        var expected = '$PAMTC,BAUD,38400*66';
        var actual = nmea.format('PAMTC,BAUD,38400');

        assert.equal(actual, expected);
    })
    
    describe('RMC', function() {
        it('should parse', function() {
            var expected = {
                lat: 47.672735,
                latStr: '4740.36415,N',
                lon: -122.422658,
                lonStr: '12225.35953,W',
                time: moment.utc('160612 030000', "DDMMYY HHmmssS"),
                variation: -16.6
            };
            
            var data = nmea.parse('$GPRMC,030000,A,4740.36415,N,12225.35953,W,000.02,059.5,160612,016.6,E*52');

            assert.equal(data.variation, expected.variation)
            assert.equal(data.latStr, expected.latStr)
            assert.equal(data.lonStr, expected.lonStr)
            assert.closeTo(data.lat, expected.lat, .00001)
            assert.closeTo(data.lon, expected.lon, .00001)
            assert.equal( expected.time.diff( data.time ), 0 )
        });

        it('parsing should set the modules variation', function() {
            var data = nmea.parse('$GPRMC,030000,A,4740.36415,N,12225.35953,W,000.02,059.5,160612,016.6,E*52');

            assert.equal(-16.6, nmea.variation);
        });

        it('should parse with decimal time')
        it('should parse without variation')
        it('should parse without cog and sog')
    });

    describe('HDG', function() {
        it('should parse', function() {
            nmea.variation = 0;

            var data = nmea.parse('$HCHDG,192.5,0.0,E,,*26');
            var expected = {
                hdg: 192.5,
                type: 'hdg'
            };

            data = _.pick(data, _.keys(expected));

            assert.deepEqual(data, expected);
        });

        it('should adjust variation when parsing.', function() {
            nmea.variation = -16.6;

            var data = nmea.parse('$HCHDG,192.5,0.0,E,,*26');
            var expected = {
                hdg: 209.1,
                type: 'hdg'
            };

            data = _.pick(data, _.keys(expected));

            assert.deepEqual(data, expected);
        });
    });

    describe('VHW', function() {
        it('should parse', function() {
            var data = nmea.parse('$IIVHW,,,,,4.87,N,9.03,K*4D');
            var expected = {
                speed: 4.87,
                type: 'vhw'
            };

            data = _.pick(data, _.keys(expected));

            assert.deepEqual(data, expected);
        });
    });

    describe('VDR', function() {
        it('should parse');

        it('should format', function() {
            // var data = nmea.parse('$IIVHW,,,,,4.87,N,9.03,K*4D');
            // var expected = {
            //     speed: 4.87,
            //     type: 'vdr'
            // };

            // data = _.pick(data, _.keys(expected));

            // assert.deepEqual(data, expected);
        });
    });

    describe('XDR', function() {
        it('should parse', function() {
            var data = nmea.parse('$YXXDR,A,0.4,D,PTCH,A,-4.0,D,ROLL*70');
            var expected = {
                pitch: 0.4,
                heel: -4.0,
                type: 'xdr'
            };

            data = _.pick(data, _.keys(expected));

            assert.deepEqual(data, expected);
        });
    });

    describe('DPT', function() {
        it('should parse', function() {
            var data = nmea.parse('$IIDPT,075.1,-1.0,*43');
            var expected = {
                depth: 75.1,
                type: 'dpt'
            };

            data = _.pick(data, _.keys(expected));

            assert.deepEqual(data, expected);
        });
    });

    describe('MWV', function() {
        it('should parse relative wind speed.', function() {
            var data = nmea.parse('$IIMWV,153,R,07.4,N,A*17');
            data = _.pick(data, ['awa', 'aws', 'type']);
            var expected = {
                awa: 153,
                aws: 7.4,
                type: 'mwv'
            };

            assert.deepEqual(data, expected);
        });
        it('should parse relative wind speed greater than 180 deg.', function() {
            var data = nmea.parse('$WIMWV,200.0,R,11.0,N,A*11');
            data = _.pick(data, ['awa', 'aws', 'type']);
            var expected = {
                awa: -160,
                aws: 11,
                type: 'mwv'
            };

            assert.deepEqual(data, expected);
        });
        it('should not parse true wind speed.', function() {
            var data = nmea.parse('$IIMWV,153,T,07.4,N,A*17');
            var expected = null;

            assert.deepEqual(data, expected);
        });
    })
});

