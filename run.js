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
    winston.info('Loading Apps');

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
            winston.error('failure trying to load %s : %s', app_path, e);
        }
    });

    links = _.sortBy(links, function(l) { return l.priority; });
    return links;
}

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

    winston.info("starting boat_computer: PID "+process.pid);
    winston.info('logging to dir: ' + settings.get('winston:logDir')+'run.log');
    //winston.handleExceptions();
}

function initializeBoatData(sources, syncSystemTime) {
    // boat data module
    var boatData = new BoatData(sources);
    boatData.start();

    if ( syncSystemTime ) {
        function setSystemTime() {
            boatData.once('data:rmc', function(data) {
                var now = data['time'];

                winston.info('Syncing clock to GPS time :' + data['time'].format("YYYYMMDDmmhhss"));

                exec('date +%s -s "@' + now.unix() + '"' );

                // fs.exists('/etc/timestamp', function (exists) {
                //     if (exists) {
                //         exec('echo "' + now.format("YYYYMMDDmmhhss") +'" >>/etc/timestamp' );
                //     }
                // });
                
            });
        };

        //NOTE: changing the system time can give node JS troubles, especially changing it to the past
        //after some seconds, to give all serial ports time to establish their connections
        //change the system time to match the GPS provided time
        setTimeout(setSystemTime, 30000);
    }   

    return boatData;
}

function initializeWebserver() {
    var server = express();
    server.use(express.urlencoded());
    server.use(express.multipart());
    //TODO: connection logging
    //TODO: update express version and use more focused file uploading


    //global libs
    //TODO: less & compression middleware
    server.use('/', express.static(path.join(__dirname, 'www')));

    // start up webserver
    server.set('port', settings.get('port'));
    server.listen(server.get('port'), function() {
        winston.info('Express server listening on port ' + this.address().port);
    });

    return server;
}

function addServerIndexPage(server, title, apps) {
    //used to make list of loaded apps on index page
    server.get('/', function(req, res) {
        //todo: consider using express's template engine for this.
        var index = handlebars.compile(fs.readFileSync(path.join(__dirname,'www/templates/index.html'), {encoding:'utf8'}));
        
        res.send( index({boatName: title, links: apps}) );
    });
}


/// MAIN
initializeWinston(winston, settings);

//set up modules
var boatData = initializeBoatData(settings.get('dataSources'), settings.get('syncSystemTime'));

var webServer = initializeWebserver();

setTimeout(function() {
//load apps after 
    //load installed apps
    var apps = loadApps(webServer, boatData, settings);

    addServerDataRoutes(webServer, boatData);
    addServerIndexPage(webServer, settings.get('boatName'), apps);

}, 1000)



