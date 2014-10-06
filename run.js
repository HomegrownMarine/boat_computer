//! run.js
//! Homegrown Marine boat_computer main process
//! version : 0.5
//! homegrownmarine.com


var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var express = require('express');
var winston = require('winston');

var _ = require('lodash');
var moment = require('moment');
var handlebars = require('handlebars');

var BoatData = require('./modules/boatData').BoatData;
var settings = require('./modules/settings');

function loadApps(server, boatData, settings) {
    var disabledApps = settings.get('disabledApps') || [];

    var links = [];

    var apps = fs.readdirSync(path.join(__dirname,'apps/'));
    //don't try and load hidden files
    apps = _.filter(apps, function(filename) { return filename.charAt(0) != '.' });

    _.each(apps, function(app) {
        var appName = path.basename(app, '.js')
        if ( _.contains(disabledApps, appName) ) return;

        winston.info('loading app: ', app);

        var app_path = path.join(__dirname, 'apps', app);
        try {
            var link = require(app_path).load( server, boatData, settings );
            if (link) {
                links.push(link);
            }
        }
        catch(e) {
            winston.error('failure trying to load %s', app_path, e);
        }
    });

    links = _.sortBy(links, function(l) { return l.priority});
    return links;
};

function initializeWinston(winston, settings) {
    winston.remove(winston.transports.Console);

    winston.add(winston.transports.Console, { 
        level: 'info',
        timestamp: true
    });
    
    winston.add(winston.transports.File, { 
        level: settings.get('winston:logLevel'),
        timestamp: true,
        filename: settings.get('winston:logDir')+'run.log',
        json: false,
        maxsize: 10000000,
        maxFiles: 10
    });

    winston.info('logging to dir: ' + settings.get('winston:logDir')+'run.log');
    //winston.handleExceptions();
}


/// MAIN

initializeWinston(winston, settings);

//set up modules

// boat data module
var boatData = new BoatData(settings.get('dataSources'));
boatData.start();

var server = express();
server.use(express.urlencoded());
server.use(express.multipart());
//TODO: connection logging
//TODO: update express version and use more focused file uploading


//global libs
//TODO: less & compression middleware
server.use('/', express.static(path.join(__dirname, 'www')));


//returns current set of data for boat
server.get('/now', function(req, res) {
    res.send(boatData.now());
});


var streamConnections = [];
//on data, send to client
boatData.on('data', function streamOnData(data) {
    _.each(streamConnections, function(res) {
        res.write('id: ' + (new Date().getTime()) + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    });
});

//returns json package for each new piece of data on channel
server.get('/stream', function(req, res) {
    //let request last forever
    req.socket.setTimeout(Infinity);
    
    //set response type to SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');

    streamConnections.push(res);

    //on connection close, remove from list of active streams
    req.on('close', function() {
        streamConnections = _.without(streamConnections, res);
    });
});

//load installed apps
var apps = loadApps(server, boatData, settings);

//used to make list of loaded apps on index page
server.get('/', function(req, res) {
    //todo: consider using express's template engine for this.
    var index = handlebars.compile(fs.readFileSync(path.join(__dirname,'www/templates/index.html'), {encoding:'utf8'}));
    
    res.send( index({boatName: settings.get('boatName'), links: apps}) );
});


// start up webserver
server.set('port', settings.get('port'));
var server = server.listen(server.get('port'), function() {
    winston.info('Express server listening on port ' + server.address().port);
});

// final random stuff
if ( settings.get('syncSystemTime') ) {
    function setSystemTime() {
        boatData.once('data:rmc', function(data) {
            var now = data['time'];
            exec('date +%s -s "@' + now.unix() + '"' );
        });
    };

    //on GPS message, set the system time every 120 seconds
    //to keep the system time in sync
    setSystemTime();
    setInterval(setSystemTime, 120000);
}