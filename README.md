#HomeGrown Marine: Boat Computer

The HomeGrown Marine Boat Computer is a platform for processing and interacting with boat sensor data, such as GPS speed, position, heading, and wind.  It runs on a PC on the boat, like a Raspberry Pi or Beaglebone Black.

It is designed using [Node.js](http://nodejs.org), which allows for a really flexible and light weight webserver.  And, Node's event based architecture also works really well with the nature of sensor data.  Modules that process and consume event data can cleanly subscribe to relavent events, such as new wind or gps messages.

The Boat Computer has a modular architecture that makes it easy to add new processing modules or applications.  __Apps__ can do things like:

- calculate and rebroadcast target speed angles from current wind speed 
- give mobile interface for setting waypoints
- show advanced instrument display on phone or tablet


###Included Apps:###

- *docs*: host racing related docs, so you have access to them on the water

- *logs*: log NMEA 0183 sensor data to disk, so that it can be analysed later

- *udp_broadcast* : broadcasts nmea stream over UDP so that it can be used with iPhone and android apps

- *polars* __(coming soon)__: will calculate target heel, wind angles and speed given current wind speed

- *complex_data* __(coming soon)__: calculate set/drift, twd, etc


###other app projects:###

- [Homegrown Marine/goto/](https://github.com/HomegrownMarine/goto): gives a web frontend for setting waypoints

- [Homegrown Marine/web_instruments/](https://github.com/HomegrownMarine/web_instrument): turns a phone or tablet into another instrument display


## Install

1. Install node.js and forever on boat PC
 - [PC](http://nodejs.org)
 - [Raspberry Pi](http://revryl.com/2014/01/04/nodejs-raspberry-pi/)
 - BeagleBone Black
2. Copy boat_computer project and any desired apps to boat PC
3. install node serial port 
4. run '''npm install''' from the project directory
5. install startup scripts __make sure apache is disabled if you want to use port 80__ 


## Make An App

Apps are the way of extending your boat computer.  They can be light-weight, just responding to data changes, or they can include a web based user interface component.  The boat computer will import, and try and call a ```load``` method on every file or directory in the ```apps/``` directory.  The ```load``` method will receive three arguments:  ```server```, ```boat_data```, and ```settings```.

```module.exports.load = function(server, boat_data, settings)```

### server

```server``` is the Boat Computer webserver.  It can serve simple static web pages and server dynamic programic interfaces into the sensor data.  It is an [express.js](http://expressjs.com) server object.

### settings

Settings is the global preference and configuration storage mechanism.  It only has two methods:  ```get(key)``` and ```set(key, value)```.  So, if an app needs to either save a user preference or configuration value, this is the way to do it.

### boat_data

boat_data is the interface to the boat's NMEA 0183 instrument system.  It can either receive or broadcast nmea messages or parsed data.  Receiving data works by subscribing to one of three events:

- 'nmea' - receive the raw NMEA messages off of the serial bus.
- 'data' - receive all parsed data as objects
- 'data:_type_' - receive only specific types of data.  For example, receive only GPS data by subscribing to 'data:rmc'

sending data to other apps and the instrument system is done by calling ```boat_data.broadcast(message,data)```.  If only message is specified, it will be sent only to the serial bus.  If data is specified, as a json object, it will be broadcast to the rest of the apps on your system.  If an encoder is specified for the data type, it will also be encoded into a NMEA sentence and broadcast over the serial bus.
