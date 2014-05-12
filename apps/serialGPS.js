//! serialGPS.js
//! read gps data off of serial port and broadcast to system
//! version : .1
//! homegrownmarine.com

// for MTK3329.  NMEA docs here: http://www.adafruit.com/datasheets/PMTK_A08.pdf

var SerialPort = require("serialport").SerialPort;

exports.load = function(server, boatData, settings) {
    var serial = new SerialPort('/dev/ttyO1', {baudrate: 9600, parser: serialport.parsers.readline("\r\n")});
    // serial.write('$PMTK220,200*2C\r\n');
    //only send RMC and signal strength messages
    serial.write('$PMTK314,0,1,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0*2C\r\n');

    s.on('data', function(message) {
        boatData.broadcase(message);
    });
};