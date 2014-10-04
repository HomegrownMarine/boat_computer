#HomeGrown Marine: Boat Computer

The HomeGrown Marine Boat Computer is a platform for processing and interacting with boat sensor data, such as GPS speed, position, heading, and wind.  It runs on a small PC on the boat, like a Raspberry Pi or Beaglebone Black, so you can build a WiFi streaming boat computer for under $100.  Its designed with a modular architecture that will let you pick and choose the functions you need, or easily develop your own modules.  With this, you can build a regatta processor to compete with very expensive offerings from the big guys.

![](https://raw.githubusercontent.com/HomegrownMarine/boat_computer/master/README/pi_to_bandg.png)

It is designed using [Node.js](http://nodejs.org), which allows for a really flexible and light weight webserver.  And, Node's event based architecture also works really well with the nature of sensor data.  Modules that process and consume event data can cleanly subscribe to relavent events, such as new wind or gps messages.


###Included Apps:###

- *docs*: store racing related docs in the boat computer, so you have access to them on the water

- *logs*: log NMEA 0183 sensor data to disk, so that it can be analysed later

- *events*: log rig tune changes, so that you can compare the effects of different settings

- *udp_broadcast* : broadcasts nmea stream over UDP so that it can be used with iPhone and android apps like [iRegatta](http://www.zifigo.com/?q=node/279) or [NMEARemote](http://www.zapfware.de/en/products/nmearemote/)

- *polars*: will calculate target heel, wind angles and speed given current wind speed

- *tacktick*: converts heel and target data from polars app into special messages so that they can be displayed on your tacktick screens.

![](https://raw.githubusercontent.com/HomegrownMarine/boat_computer/master/README/index.png)
![](https://raw.githubusercontent.com/HomegrownMarine/boat_computer/master/README/documents.png)
![](https://raw.githubusercontent.com/HomegrownMarine/boat_computer/master/README/logs.png)

###Other App Projects:###

- [Homegrown Marine/goto/](https://github.com/HomegrownMarine/goto): gives a web frontend for setting waypoints

- [Homegrown Marine/web_instruments/](https://github.com/HomegrownMarine/web_instrument): turns a phone or tablet into another instrument display

- [Homegrown Marine/attitude/](https://github.com/HomegrownMarine/attitude): Add a cheap heel/pitch sensor to you network ($15 plus a case)

## Build One ##

![](https://raw.githubusercontent.com/HomegrownMarine/boat_computer/master/README/black_box.jpg)

This can be done easily, with a little soldering and assembly.

Materials:
- $35 [Raspberry Pi](http://en.wikipedia.org/wiki/Raspberry_Pi) or $45 [BeagleBone Black](http://en.wikipedia.org/wiki/BeagleBone_Black#BeagleBone_Black)
- $20 [Pocket Router](http://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=pocket+router) - _Be sure to get one that supports pluging a PC into the ethernet port_
- $20 [WaterProof Case](http://www.amazon.com/dp/B001CNNEXE/ref=sr_1_4?ie=UTF8&qid=1405872347&sr=8-4&keywords=waterproof+case+pelican)
- $6 [Cable Glands](http://www.ebay.com/itm/271323163450)
- ~$5 Electronics - [Serial Data Converter](http://www.mouser.com/ProductDetail/Exar/SP3232EEP-L/), some capacitors and a circuit board
- $10 [Power Converter](http://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=car+usb+charger) - We'll use a car 12V to USB converter.  this will power the mini-PC and WiFi router.
- Small ethernet cable, and mini usb cables for power.

The serial data converter will convert from the 12V RS-232 style data sent by your instruments to 3V TTL as expected by the miniPC.

TODO: diagrams and pictures. 

1. Install node.js and forever on boat PC
 - [Raspberry Pi](http://revryl.com/2014/01/04/nodejs-raspberry-pi/)
 - BeagleBone Black - comes pre-installed on BeagleBone Black

2. Copy boat_computer project and any desired apps to boat PC
3. install [node serial port](https://github.com/voodootikigod/node-serialport#raspberry-pi-linux)
4. run '''npm install''' from the project directory
5. install startup scripts __make sure apache is disabled if you want to use port 80__ 

####If you're have trouble setting this up and getting it running, please open an issue to ask for help [here](https://github.com/HomegrownMarine/boat_computer/issues/new).

If you just want to record your boat data, check out this simple [NMEA Logger](https://github.com/HomegrownMarine/simple_logger).  It will just log boat data to an SD card.

## Make An App ##

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

## Next Steps

- better installation scripts and instructions
- support for NMEA 2000 and [signal k](https://signalk.github.io)
- more apps
