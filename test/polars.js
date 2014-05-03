var assert = require('chai').assert;
var moment = require('moment');

var path = require('path');

var polarTable = require('../apps/polars.js').polarTable;

describe('polars', function() {
    describe('#fromFile', function() {
        it(' should load', function(done) {
            polarTable.fromFile(path.join(__dirname,'resources/farr_30_polars.txt'), function(polars) {
                assert.deepEqual({speed: 3.776, heel: 3.4, lee: 2.48}, polars.all[4][45]);
                done();
            });
        });
    });

    describe('targets', function() {
        var table = null;
        before(function(done) {
            polarTable.fromFile(path.join(__dirname,'resources/farr_30_polars.txt'), function(polars) {
                table = polars;
                done();
            });
        });

        it(' should find speed.', function() {
            assert.equal(table.targetSpeed(4, true), 3.809);
            assert.equal(table.targetSpeed(5, true), 4.619);
            
            assert.equal(table.targetSpeed(4, false), 3.830);
            assert.equal(table.targetSpeed(5, false), 4.668);
        });

        it(' should interpolate speed.', function() {
             assert.equal(table.targetSpeed(4.5, true), 4.214);
             assert.closeTo(table.targetSpeed(4.5, false), 4.249, .00001);
        });

        it(' should find angle.', function() {
            assert.equal(table.targetAngle(4, true), 45.5);
            assert.equal(table.targetAngle(4.5, true), 45.05);
            assert.equal(table.targetAngle(5, true), 44.6);
        });
    });
});