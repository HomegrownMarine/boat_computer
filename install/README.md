
1) You need a hundred megs of free space on your primary drive.  Uninstall gnome desktop, etc to make some room
2) disable bonescript and cloud9, we want those ports
3) create directories
3) install node projects


beaglebone - cache and tmp need to be on sd card

npm install --no-bin-links


https://wiki.archlinux.org/index.php/systemd
systemctl disable bonescript-autorun.service

http://beaglebone.cameon.net/home/serial-ports-uart
drm.debug=7 capemgr.enable_partno=BB-UART1,BB-UART2,BB-UART4,BB-UART5


boat_computer.service - beaglebone black - any systemd system

cp boat_computer.service /lib/systemd/system
ln -s /lib/systemd/system/boat_computer.service /etc/systemd/system/multi-user.target.wants/boat_computer.service

http://mybeagleboneblackfindings.blogspot.com/2013/10/running-script-on-beaglebone-black-boot.html
http://beaglebone.cameon.net/home/autostarting-services