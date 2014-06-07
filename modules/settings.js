//! settings.js
//! Generic module to save/load app settings from disk.  All
//! settings are stored in one file.
//! version : 0.1
//! homegrownmarine.com

// TODO: https://github.com/flatiron/nconf - looks like it might be a good replacement for this.

var winston = require('winston');
var fs = require('fs');
var _ = require('lodash');


function getConfigs() {
    var allConfigs = require('../config.json');
    var env = process.env.NODE_ENV || 'development';

    winston.info('env', env);
    //copy environment specific configs
    return _.extend(allConfigs, allConfigs[env]);
}
var config = getConfigs();

var settings_filename = config.settingsFile;
var persistence = null;

function load() {
    try {
        var fileContents = fs.readFileSync(settings_filename,'utf8'); 
        persistence = JSON.parse(fileContents);
    }
    catch(e) {
        winston.error("couldn't load settings", e);
        persistence = {};
    }
}

function save() {
    var jsonStr = JSON.stringify(persistence);
    fs.writeFile(settings_filename, jsonStr, function(err) {
        if (err) {
            winston.error("Couldn't save settings", err);
        }
    });
}

module.exports.config = config;

module.exports.get = function(key) {
    if ( persistence === null )
        load();

    if ( key in persistence )
        return persistence[key];
    else if ( key in config )
        return config[key];
};

module.exports.set = function(key, value) {
    if ( persistence === null )
        load();

    persistence[key] = value;

    save();
};
