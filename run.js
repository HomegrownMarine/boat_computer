var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var _ = require('underscore-node');
var moment = require('moment');
var handlebars = require('handlebars');
var express = require('express');

var config = require('./config.json');


function loadApps(server, boat_data, settings) {
    var links = [];

    var apps = fs.readdirSync(path.join(__dirname,'apps/'));
    //don't try and load hidden files
    //don't load files that begin with _ -- simple way to disable app
    apps = _.filter(apps, function(filename) { return filename.charAt(0) != '.' && filename.charAt(0) != '_' });

    _.each(apps, function(app) {
        console.info('loading app: ', app);
        var app_path = path.join(__dirname, 'apps', app);
        try {
            var link = require(app_path).load( server, boat_data, settings );
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
var boat_data_module = './modules/serial_boat_data';
if ( _.contains(process.argv, 'replay') ) {
    boat_data_module = './modules/boat_data_replay';
}

var boat_data = require(boat_data_module);
boat_data.start();
var settings = require('./modules/settings', {'data-dir':''});

var server = express();
server.use(express.urlencoded());
server.use(express.multipart());


if ( !_.contains(process.argv, 'replay') ) {
    var lastTimeSync = 0;

    //on GPS message, set the system time every 120 seconds
    //to keep the system time in sync
    boat_data.on('data:rmc', function(data) {
        var now = moment();
        if ( now > lastTimeSync + 120 ) {
            exec('date +%s -s "@' + now.unix() + '"' );
            lastTimeSync = now;
        }
    });
}

//global libs
//TODO: less & compression middleware
server.use('/', express.static(path.join(__dirname, 'www')));


//returns current set of data for boat
server.get('/now', function(req, res){
    res.send(boat_data.current());
});


var links = loadApps(server, boat_data, settings);

//used to make list of loaded apps on index page
server.get('/', function(req, res) {
    //todo: consider using express's template engine for this.
    var index = handlebars.compile(fs.readFileSync(path.join(__dirname,'www/templates/index.html'), {encoding:'utf8'}));
    
    res.send( index({boatName: config.boatName, links: links}) );
});


server.set('port', process.env.PORT || 3000);
var server = server.listen(server.get('port'), function() {
    console.info('Express server listening on port ' + server.address().port);
});
