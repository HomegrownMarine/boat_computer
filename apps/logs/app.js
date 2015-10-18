//! logs/app.js
//! listen to nmea message events, write them to disk, and enable 
//! downloading of log archives
//! version : 0.1
//! homegrownmarine.com


var path = require('path');
var util = require('util');
var fs = require('fs');
var async = require('async');

var _ = require('lodash');
var moment = require('moment');

var express = require('express');
var archiver = require('archiver');

var winston = require('winston');
var handlebars = require('handlebars');

exports.load = function(server, boatData, settings) {
    var dataDir = settings.get("logs:dataDir");

    var currentStreamTime = null;
    var currentStream = null;

    //cache current write stream, and append to it
    function getStreamForTime(time) {
        time = time.startOf('hour');
        if (!time.isSame(currentStreamTime)) {
            //if our stream is changing, end old stream
            if ( currentStream )
                currentStream.end();

            currentStreamTime = time;
            currentStream = fs.createWriteStream(path.join(dataDir, time.format('YYMMDDHH')+'.txt'), { flags: 'a'})
        }
        return currentStream;
    }

    // do logging
    if ( settings.get("logs:log") !== false ) {
        boatData.on('nmea', function(message) {
            getStreamForTime(moment())
                .write(message+'\r\n');
        });
    }


    // log interface
    var indexTemplate = null;
    fs.readFile(path.join(__dirname,'templates/index.html'), {encoding:'utf8'}, function(err, data) {
        if (err) {
            winston.error('logs: error loading template', err);
            return;
        }

        indexTemplate = handlebars.compile(data);
    });

    //enable log downloading
    server.use('/logs', express.static(path.join(__dirname, 'zips/')));

    // list log files, grouped by day
    server.get('/logs/', function(req, res) {
        if ( !indexTemplate ) {
            res.send();
            return;
        }

        fs.readdir(dataDir, function(err, files) {
            if (err) {
                winston.error('logs: error reading log dir', err);
                return;
            }

            var logs = _(files)
                            .filter(function(filename) { return filename.match(/\d{8}\./); })
                            .map(function(filename) { return filename.substring(0,6); })
                            .sort()
                            .uniq()
                            .reverse()
                            .map(function(filename) {
                                return { filename: filename, date: moment(filename, "YYMMDD").format("MMM D, YYYY") };
                            })
                            .valueOf();
            
            res.send( indexTemplate({log_days:logs}) );
        });
    });

    //TODO: way to reprocess a partial day

    //archive day's logs into zip file
    server.get('/logs/ready/:day', function(req, res) {
        var day = req.params.day;
        var zipFile = path.join(__dirname, '/zips/', day + '.zip');

        if ( fs.existsSync(zipFile) ) {
            res.send({'status':'ready', 'location': '/logs/'+day+'.zip'});
        }
        else if ( fs.existsSync(zipFile+'.tmp') ) {
            //TODO: restart if not actively writing.
            res.send({'status':'archiving'});
        }
        else {
            // TODO: child process
            var hourlyLogs = _.filter(fs.readdirSync(dataDir), function(filename) { return filename.substring(0,6) === day; });

            var output = fs.createWriteStream(zipFile+'.tmp');
            var archive = archiver('zip');

            archive.on('end', function() {
                output.end();
            });
            output.on('finish', function() {
                // rename temp file, archive can now be downloaded
                fs.rename(__dirname + '/zips/' + day + '.zip.tmp', __dirname + '/zips/' + day + '.zip', function(err){
                    if (err) winston.error('Error renaming zip file.', err);    
                });
            });

            archive.pipe(output);

            // add each file to the archive
            async.each(hourlyLogs, function(file, callback) {
                    archive.append(fs.createReadStream(path.join(dataDir, file)), { name: file });
                    callback(null);
                }, function(err) {
                    if (!err) archive.finalize();
            });

            res.send({'status':'archiving'});
        }
    });


    return {url:'/logs/', title:'Download Logs', priority: 100};
};