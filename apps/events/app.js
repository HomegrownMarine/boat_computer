//! events/app.js
//! Web app for logging events, such as rig tune changes
//! version : .1
//! homegrownmarine.com

var express = require('express');
var path = require('path');
var fs = require('fs');

var winston = require('winston');
var _ = require('lodash');

var initialSettings = {
    rigtune: {
        H: 0,
        PV: 0,
        PD1: 0,
        PD2: 0,
        SD2: 0,
        SD1: 0,
        SV: 0
    }
};

var eventMessage = function(key, data) {
    return 'PEVNT,' + key + ',' + _.map(data, function(value, key) { return key+'='+value }).join(',');
};

exports.load = function(server, boatData, settings) {
    var config = settings.get('event') || initialSettings;

    boatData.nmea.parsers.PEVNT = {
        format: eventMessage
    };

    server.use('/events', express.static(path.join(__dirname, 'www/')));

    // get current state of 
    server.get('/events/current', function(req, res) {
        res.send(config);
    });

    // 
    server.post('/events/record/:key',  function (req, res){
        var key = req.params.key;

        //TODO: don't save so fast, since we're saving
        //live on the front end
        if ( key in config ) {
            //apply new settings
            _.extend(config[key], req.body);
            settings.set('event', config);
            
            var message = eventMessage( key, config[key] );
            boatData.broadcast(message);
            winston.info('event', message);
        }

        res.send({'ok':true});
    });

    return {url:'/events/', title:'Tuning', priority: 1};
};
