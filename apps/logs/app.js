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

exports.load = function(server, boat_data, settings) {
    var data_dir = settings.get("log:dataDir");

    // do logging
    boat_data.on('nmea', function(message) {
        var filename = path.join(data_dir, moment().format('YYMMDDHH')+'.txt');
        fs.appendFile(filename, message+'\r\n');
    });


    //enable log downloading
    server.use('/logs', express.static(path.join(__dirname, 'zips/')));

    // list log files, grouped by day
    server.get('/logs/', function(req, res) {
        

        //TODO: write as async
        var logs = _(fs.readdirSync(data_dir))
                        .filter(function(filename) { return filename.match(/\d{8}\./); })
                        .map(function(filename) { return filename.substring(0,6); })
                        .sort()
                        .uniq()
                        .reverse()
                        .map(function(filename) {
                            return { filename: filename, date: moment(filename, "YYMMDD").format("MMM D, YYYY") };
                        })
                        .valueOf();


        var index = handlebars.compile(fs.readFileSync(path.join(__dirname,'templates/index.html'), {encoding:'utf8'}));
        res.send( index({log_days:logs}) );
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
            res.send({'status':'archiving'});
        }
        else {
            //TODO: child process
            var hourlyLogs = _.filter(fs.readdirSync(data_dir), function(filename) { return filename.substring(0,6) === day; });

            var output = fs.createWriteStream(zipFile+'.tmp');
            var archive = archiver('zip');

            output.on('close', function() {
                //rename temp file, archive can now be downloaded
                fs.rename(__dirname + '/zips/' + day + '.zip.tmp', __dirname + '/zips/' + day + '.zip', function(err){
                    if (err) {
                        winston.error('Error renaming zip file.', err);    
                    }
                });
            });

            archive.pipe(output);

            //add each file to the archive
            async.each(hourlyLogs, function(file, callback) {
                    archive.append(fs.createReadStream(path.join(data_dir, file)), { name: file })
                    callback(null);
                }, function(err) {
                    if (!err) archive.finalize();
            });

            res.send({'status':'archiving'});
        }
    });


    return {url:'/logs/', title:'Download Logs', priority: 100};
};