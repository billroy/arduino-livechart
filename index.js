//
// index.js: collect data from the serial port and display it as a chart
//
//	Copyright 2012 Bill Roy (MIT License; see LICENSE file)
//

var opt = require('optimist');
var argv = opt.usage('Usage: $0 [flags]')
	.alias('s', 'serialport')
	.describe('s', 'name of serial port to open (auto)')
	.alias('b', 'baud')
	.describe('b', 'virtual serial port baud rate (57600)')
	.alias('p', 'port')
	.describe('p', 'port for the web server (3000)')
	.argv;

if (argv.help) {
	opt.showHelp();
	process.exit();
}

var payload = [];		// accumulated serial input

// Open the serial port
//
shell = require("shelljs");
var portlist, portname;

if (argv.serialport) portlist = [argv.serialport];
else if (process.platform === 'darwin') portlist = shell.ls("/dev/tty.usb*");
else if (process.platform === 'linux') portlist = shell.ls("/dev/ttyUSB*");

if (portlist.length == 0) {
	process.stdout.write('No ports found.\n');
	process.exit(-1);
}
else if (portlist.length == 1) {
	portname = portlist[0];
}
else {
	process.stdout.write('Trying first of multiple ports:\n' + portlist.join('\n'));
	portname = portlist[0];
}

var SerialPort = require('serialport').SerialPort;
try {
	var port = new SerialPort(portname, {
		baudrate: argv.baud || 57600,
		buffersize: 20480
	});
} catch(e) {
	process.stdout.write('Cannot open serial device.');
	process.exit(-2);
}

var datatext = '';
var input_buffer = '';

if (port) {
	port.on('data', function(data) {	// port input goes to stdout
		process.stdout.write(data);
		var datatext = data.toString();
		input_buffer += ('' + datatext);

		for (;;) {					// de-concatenate json packets
			if ((input_buffer.length > 0) && !input_buffer.match(/\n/)) return;
			var m = input_buffer.match(/\n/);
			if (!m) return;
			var topchunk = input_buffer.slice(0, m.index + 1);
			input_buffer = input_buffer.slice(m.index + 1);

			if ((topchunk.length > 0) && (topchunk.charAt(0) != '{')) return;
			var record = JSON.parse(topchunk);
			//console.log('[', topchunk, ']', record);
			payload.push(record);			
			//console.log('Payload:', payload);
		}
	});

	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	process.stdin.setRawMode(true);			// pass ^C through to serial port
	process.stdin.on('data', function (data) {	// keyboard input goes to port
		if (data === '\x1d') process.exit(0);	// ^] to quit
		else if (port) port.write(data);
	});
}


var util = require('util');
var express = require('express');
var app = express();

app.configure(function () {
	app.use(express.logger());
});

app.get('/', function(req, res) { res.sendfile('index.html'); });

app.get('/json/:id', function(req, res) {
	res.send(JSON.stringify(payload));
});

function randInt(x) { return Math.floor(Math.random() * x); }

app.listen(argv.port || 3000);
