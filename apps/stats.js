var usage = require('usage');

exports.load = function(server, boatData, settings) {

	var pid = process.pid; 
	
	// every minute broadcast the average cpu usage for current process
	setInterval(function() {
		usage.lookup(pid, { keepHistory: true }, function(err, result) {
 			if ( !err ) {
 				console.info('CPU usage: '+result.cpu.toFixed(0) +'%');
 			}
 			else {
 				console.log(err);
 			}
		});
	}, 60000);

};