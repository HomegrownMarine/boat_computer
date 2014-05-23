//! run.js
//! Homegrown Marine boat_computer main process
//! version : 0.5
//! homegrownmarine.com


var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var _ = require('lodash');
var moment = require('moment');
var handlebars = require('handlebars');
var express = require('express');


function loadApps(server, boatData, settings) {
    var disabledApps = settings.get('disabledApps') || [];

    var links = [];

    var apps = fs.readdirSync(path.join(__dirname,'apps/'));
    //don't try and load hidden files
    apps = _.filter(apps, function(filename) { return filename.charAt(0) != '.' });

    _.each(apps, function(app) {
        var appName = path.basename(app, '.js')
        if ( _.contains(disabledApps, appName) ) return;

        console.info('loading app: ', app);

        var app_path = path.join(__dirname, 'apps', app);
        try {
            var link = require(app_path).load( server, boatData, settings );
            if (link) {
                links.push(link);
            }
        }
        catch(e) {
            console.error('failure trying to load ', app_path, e);
        }
    });

    links = _.sortBy(links, function(l) { return l.priority});
    return links;
};


//set up modules
var settings = require('./modules/settings');

// boat data module is configurable
var BoatData = require('./modules/boatData').BoatData;
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
server.get('/now', function(req, res){
    res.send(boatData.now());
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
    console.info('Express server listening on port ' + server.address().port);
});


// final random stuff
if ( settings.get('syncSystemTime') ) {
    //on GPS message, set the system time every 120 seconds
    //to keep the system time in sync
    setInterval(function() {
        boatData.once('data:rmc', function(data) {
            var now = data['time'];
            exec('date +%s -s "@' + now.unix() + '"' );
        });
    }, 120000);
}