
var console = require('console');
var fs = require('fs');
var _ = require('underscore-node');

var config = require('../config.json');

var PERSISTENCE_STORE = config.settingsFile;

var persistence = null;

function load() {
    try {
        var fileContents = fs.readFileSync(PERSISTENCE_STORE,'utf8'); 
        persistence = JSON.parse(fileContents);
    }
    catch(e) {
        console.error("couldn't load settings", e);
        persistence = {};
    }
}

function save() {
    var jsonStr = JSON.stringify(persistence);
    fs.writeFile(PERSISTENCE_STORE, jsonStr, function(err) {
        if (err) {
            console.log(err);
        }
    });
}

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

module.exports.setConfig = function(hash) {
    config = _.extend(config, hash);
}