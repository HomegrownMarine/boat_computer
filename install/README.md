

1) You need a hundred megs of free space on your primary drive.  Uninstall gnome desktop, etc to make some room
2) disable bonescript and cloud9, we want those ports
3) create directories
3) install node projects



https://wiki.archlinux.org/index.php/systemd
systemctl disable bonescript-autorun.service
bonescript.socket
cloud9.socket


http://beaglebone.cameon.net/home/serial-ports-uart
drm.debug=7 capemgr.enable_partno=BB-UART1,BB-UART2,BB-UART4,BB-UART5,BB-I2C0,BB-I2C1


boat_computer.service - beaglebone black - any systemd system

cp boat_computer.service /lib/systemd/system
ln -s /lib/systemd/system/boat_computer.service /etc/systemd/system/multi-user.target.wants/boat_computer.service

http://mybeagleboneblackfindings.blogspot.com/2013/10/running-script-on-beaglebone-black-boot.html
systemctl status

node 4: https://github.com/fivdi/onoff/wiki/Node.js-v4-and-native-addons
http://andyfelong.com/2015/09/node-js-v4-1-0-on-raspberry-pi-2/
https://groups.google.com/forum/#!msg/drones-discuss/2J20SvyY78g/OZuGo-QaANQJ






BeagleBone Black setup
----------------------

1 Get latest image here: http://elinux.org/Beagleboard:BeagleBoneBlack_Debian#Mainline_.28lts.29
2 Install as per here: http://beagleboard.org/static/beaglebone/latest/README.htm

apt-get update
'' wireless-tools

apt-get install linux-headers-$(uname -r)
apt-get update
apt-get install build-essential
apt-get install git
apt-get install wireless-tools
apt-get install avahi-daemon
apt-get install python



## Name host

# install node
apt-get install g++-4.8 gcc-4.8

sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.6 20
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.8 50
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-4.6 20
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-4.8 50

apt-get install ntpdate
ntpdate -s time.nist.gov


wget https://nodejs.org/dist/v4.1.0/node-v4.1.0.tar.gz
tar -xzf node-v4.1.0.tar.gz
cd node-v4.1.0
./configure
make
sudo make install

# install node serial port
# format and automount sd TODO

# update cape mgr


# install bc
mkdir -p /race/bin/
git clone https://github.com/HomegrownMarine/boat_computer.git


# shortcut commands to shell (alias)

# install service if bb

# 
cp example_config.js config.js

# link data/ to sd card


# hostname
