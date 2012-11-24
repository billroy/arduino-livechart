# Arduino - Live Chart

This data server charts data logged from a USB-connected Arduino, or data POSTed from an Ethernet- or Wi-Fi- capable Arduino over the network.

![](https://raw.github.com/billroy/arduino-livechart/master/sample-chart.png)

The Arduino sends data in JSON.  For a USB-connected Arduino, you can use any Arduino-side program to send the data; one convenient way is to use Bitlash; see below.  You can find out more about Bitlash at http://bitlash.net

For a network-connected Arduino you'll need to write a client to make a simple POST request via your network adapter; see way below for details.


## Pre-install Requirements

### Node.js and git

You need to install node.js (http://nodejs.org) and git (http://git-scm.com).

This package uses the node-serial module, which requires you have some tools on your system to compile a driver.  See this link for more: https://github.com/voodootikigod/node-serialport

### Get the arduino-livechart code

Open a terminal window and enter the commands below to install the web chart server:

	$ git clone https://github.com/billroy/arduino-livechart
	$ cd arduino-livechart
	$ npm install
	$ node index.js 

Now open a web browser on http://localhost:3000 and you should see the chart page.

If you would prefer to start the web server on a different port:

	$ node index.js -p 8080

To stop the server, type Control-] in its terminal window.

The server will try to guess the serial port to which your Arduino is connected.  You can override the automatic port detection and specify a serial port with the -s flag:

	$ node index.js -s /dev/tty.USB.abcdef

### On the Arduino: Install

You need to install the Bitlash library (http://bitlash.net).  Don't forget to restart the Arduino software.

Once the Bitlash software is installed, you can install the bitlash demo on your Arduino via:

	File -> Examples -> bitlash -> demo
	File -> Upload

Connect to your arduino with whatever serial monitor you usually use and you should be talking to Bitlash.  I use "bitty.js": 

### On the Arduino: Testing the Arduino setup

The basic idea is to set up Bitlash to print a little JSON record for each data snapshot, one record per line.  (Non-JSON lines are ignored.)

A quick demonstration example: generate random data for a0 and a1.

Define these functions in Bitlash; you can copy and paste from here (minus the '>'):

	> function logrand { printf("{\"time\":%d,\"a0\":%d,\"a1\":%d}\n", millis, random(100), random(100));};

Go refresh the chart in your browser and you should see three data points.

To log data every second when the arduino boots:

	> function startup {run logrand,1000}
	> boot

Let it run a while and refresh the chart.

Congratulations, you have a working data collection and charting system.

### Charting different data

The charting program detects whatever fields you have present in the log records, so you could log a different set of values like this to see a different chart:

	> function log {printf("{\"time\":%d,\"a0\":%d,\"count\:%d,\"switch\":%d}", millis, a0, c, d3);}

The data format is JSON, which unfortunately contains lots of quote characters which need to be escaped.  The printf() above produces output like this:

	{time:20032,a0:334,count:453,switch:0}

The "time" field is required.  Anything else you provide is plotted against time.

### Integrating additional Arduinos

You can also POST data to the PC running the live chart from any net-capable Arduino, such as an Arduino with an Ethernet or Wi-Fi sheild.

The POST url is http://<server-ip>/json.  The POST body should contain the JSON data to be logged, like the example above.

