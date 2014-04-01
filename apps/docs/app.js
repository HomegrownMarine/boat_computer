//! docs/app.js
//! Front end for downloading all docs in the docs/ folder, and
//! uploading new docs.
//! version : 0.1
//! homegrownmarine.com


var express = require('express');
var path = require('path');
var fs = require('fs');
var _ = require('underscore-node');

var console = require('console');
var handlebars = require('handlebars');

exports.load = function(server) {
    server.use('/docs', express.static(path.join(__dirname, 'docs/')));

    //render list of all files in docs directory
    server.get('/docs/', function(req, res) {
        //TODO: consider using express's template engine for this.
        var docs = _(fs.readdirSync(path.join(__dirname, 'docs/')).sort())
                    .filter(function(filename) { return filename.charAt(0) != '.'; })
                    .map(function(filename) { 
                        var displayName = filename.substring(0,filename.length-4).replace(/[_-]/g, ' ');
                        return {  link:filename, name:filename}; 
                    });

        var index = handlebars.compile(fs.readFileSync( path.join(__dirname,'templates/index.html'), {encoding:'utf8'}));
        res.send( index({docs:docs}) );
    });

    // allow uploading of new documents/files
    server.post('/docs/upload', function(req, res) {
        //TODO: this method of uploading is deprecated
        //need to find something better at some point
        if ( req.files.doc ) {
            fs.rename(req.files.doc.path, path.join(__dirname, 'docs/', req.files.doc.name), function(err){
                if (err) {
                    console.error('Error renaming upload file', err);    
                }
            });
        }

        res.redirect('/docs/');
    });

    return {url:'/docs/', title:'Sailing Documents', priority: 10};
};