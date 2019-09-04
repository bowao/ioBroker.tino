'use strict';

// you have to require the utils module and call adapter function
const utils = require('@iobroker/adapter-core');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
let sPort = null;
let adapter;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: 'tino',

        // is called when adapter shuts down - callback has to be called under any circumstances!
        unload: function (callback) {
            try {
                if (sPort.isOpen) {
                    sPort.close();
                    adapter.log.info('Serialport: ' + adapter.config.serialport + ' is closed');
                }
                adapter.setState('info.connection', false, true);
                adapter.log.info('cleaned everything up...');
                callback();
            } catch (e) {
                callback();
            }
        },

        // message
        message: function (obj) {
            if (obj) {
                switch (obj.command) {
                    case 'listUart':
                        if (obj.callback) {
                            if (SerialPort) {
                                // read all found serial ports
                                SerialPort.list((err, ports) => {
                                    adapter.log.info('List of port: ' + JSON.stringify(ports));
                                    adapter.sendTo(obj.from, obj.command, ports, obj.callback);
                                });
                            } else {
                                adapter.log.warn('Module serialport is not available');
                                adapter.sendTo(obj.from, obj.command, [{comName: 'Not available'}], obj.callback);
                            }
                        }
                    break;
                }
            }
        },

        // is called when databases are connected and adapter received configuration.
        // start here!
        ready: function () {
            main()
        }
    });

    adapter = new utils.Adapter(options);
    return adapter;
};

function createNode(id, data) {

    adapter.setObjectNotExists('Sensor_' + id, {
        type: 'channel',
        common: {
            name: 'Sensor ' + id,
            role: 'sensor'
        },
        native: {
            "addr": id
        }
    });

        adapter.setObjectNotExists('Sensor_' + id + '.battery', {
            type: 'state',
            common: {
                "name": "Battery",
                "type": "number",
                "unit": "V",
                "min": 0,
                "max": 5,
                "read": true,
                "write": false,
                "role": "value.battery",
                "desc": "Battery"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.temperature', {
            type: 'state',
            common: {
                "name": "Temperature",
                "type": "number",
                "unit": "°C",
                "min": -50,
                "max": 50,
                "read": true,
                "write": false,
                "role": "value.temperature",
                "desc": "Temperature"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.config.offsetTemperature', {
            type: 'state',
            common: {
                "name": "Offset Temperature",
                "type": "number",
                "unit": "K",
                "min": -10,
                "max": 10,
                "read": true,
                "write": true,
                "role": "level.offset",
                "desc": "Offset Temperature"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.humidity', {
            type: 'state',
            common: {
                "name": "Humidity",
                "type": "number",
                "unit": "%",
                "min": 0,
                "max": 100,
                "read": true,
                "write": false,
                "role": "value.humidity",
                "desc": "Humidity"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.config.offsetHumidity', {
            type: 'state',
            common: {
                "name": "Offset Humidity",
                "type": "number",
                "unit": "%",
                "min": -20,
                "max": 20,
                "read": true,
                "write": true,
                "role": "level.offset",
                "desc": "Offset Humidity"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.rssi', {
            type: 'state',
            common: {
                "name": "RSSI",
                "type": "number",
                "unit": "dBm",
                "min": -125,
                "max": 0,
                "read": true,
                "write": false,
                "role": "value.rssi",
                "desc": "Received Signal Strength Indicator"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.fei', {
            type: 'state',
            common: {
                "name": "FEI",
                "type": "number",
                "unit": "",
                "min": -25000,
                "max": 25000,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "FEI"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.rfm69Temperature', {
            type: 'state',
            common: {
                "name": "RFM69 Module Temperature",
                "type": "number",
                "unit": "°C",
                "min": -50,
                "max": 150,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "RFM69 Module Temperature"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.counter', {
            type: 'state',
            common: {
                "name": "Message Counter",
                "type": "number",
                "unit": "",
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Message Counter"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.biterrors', {
            type: 'state',
            common: {
                "name": "Biterrors",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 1000,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Biterrors"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.heartbeat', {
            type: 'state',
            common: {
                "name": "Heartbeat",
                "type": "boolean",
                "read": true,
                "write": false,
                "role": "state",
                "desc": "Heartbeat"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupt1', {
            type: 'state',
            common: {
                "name": "Interrupt 1",
                "type": "boolean",
                "read": true,
                "write": false,
                "role": "state",
                "desc": "Interrupt 1"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupt2', {
            type: 'state',
            common: {
                "name": "Interrupt 2",
                "type": "boolean",
                "read": true,
                "write": false,
                "role": "state",
                "desc": "Interrupt 2"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupt3', {
            type: 'state',
            common: {
                "name": "Interrupt 3",
                "type": "boolean",
                "read": true,
                "write": false,
                "role": "state",
                "desc": "Interrupt 3"
            },
            native: {}
        });


}

function setNodeState(data) {

    let nodeId;
    let voltage;
    let temperature;
    let humidity;
    let rssi;
    let fei;
    let rfm69Temp;
    let counter;
    let biterrors;
    let heartbeat;
    let inter1;
    let inter2;
    let inter3;
    let outerMessage;
    let innerMessage;

    outerMessage = data.split(',');
    innerMessage = outerMessage[3].split(';');

    nodeId = parseInt(outerMessage[1]);

    adapter.getObject('Sensor_' + nodeId, function (err, obj) {
        if(err) {
            adapter.log.info(err);
        } else {
            if(!obj){
                adapter.log.info('Create new Sensor: ' + nodeId);
                createNode(nodeId, data);
            }
        }
    });

        voltage = parseInt(innerMessage[1]) / 1000;
        adapter.setState('Sensor_' + nodeId + '.battery', { val: voltage, ack: true});

        temperature = parseInt(innerMessage[3]) / 100;
        adapter.getState('Sensor_' + nodeId + '.config.offsetTemperature', function (err, state) {
            if(err) {
                adapter.log.info(err);
            } else {
                if(state){
                    temperature = temperature + state.val;
                    adapter.setState('Sensor_' + nodeId + '.config.offsetTemperature', { val: state.val, ack: true});
                }
                adapter.setState('Sensor_' + nodeId + '.temperature', { val: temperature, ack: true});
            }
        });

        humidity = parseFloat(innerMessage[4]);
        adapter.getState('Sensor_' + nodeId + '.config.offsetHumidity', function (err, state) {
            if(err) {
                adapter.log.info(err);
            } else {
                if(state){
                    humidity = humidity + state.val;
                    adapter.setState('Sensor_' + nodeId + '.config.offsetHumidity', { val: state.val, ack: true});
                }
                adapter.setState('Sensor_' + nodeId + '.humidity', { val: humidity, ack: true});
            }
        });

        rssi = parseFloat(outerMessage[2].substring(2));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.rssi', { val: rssi, ack: true});

        fei = parseInt(outerMessage[4].substring(4));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.fei', { val: fei, ack: true});

        rfm69Temp = parseInt(outerMessage[5].substring(2));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.rfm69Temperature', { val: rfm69Temp, ack: true});

        counter = parseInt(innerMessage[2]);
        adapter.setState('Sensor_' + nodeId + '.radioInfo.counter', { val: counter, ack: true});

        biterrors = parseInt(outerMessage[6].substring(10));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.biterrors', { val: biterrors, ack: true});

        heartbeat = ((parseInt(innerMessage[5], 16) & 1) === 1);
        inter1 = ((parseInt(innerMessage[5], 16) & 2) === 2);
        inter2 = ((parseInt(innerMessage[5], 16) & 4) === 4);
        inter3 = ((parseInt(innerMessage[5], 16) & 8) === 8);
        adapter.setState('Sensor_' + nodeId + '.heartbeat', { val: heartbeat, ack: true});
        adapter.setState('Sensor_' + nodeId + '.interrupt1', { val: inter1, ack: true});
        adapter.setState('Sensor_' + nodeId + '.interrupt2', { val: inter2, ack: true});
        adapter.setState('Sensor_' + nodeId + '.interrupt3', { val: inter3, ack: true});

    adapter.log.debug('data received for Node Id: ' + nodeId + ' voltage=' + voltage + ' temperature=' + temperature + ' humidity=' + humidity + ' rssi=' + rssi + ' FEI=' + fei + ' RFM69Temp=' + rfm69Temp + ' counter=' + counter + ' biterrors=' + biterrors + ' heartbeat=' + heartbeat + ' interrupt1=' + inter1 + ' interrupt2=' + inter2 + ' interrupt3=' + inter3);

}

function main() {

    adapter.setState('info.connection', false, true);
    if (!adapter.config.serialport) {
        adapter.log.warn('Please define the serial port.');
        return;
    }

    let bRate = parseInt(adapter.config.baudrate);
    let sPortName = adapter.config.serialport

    sPort = new SerialPort(sPortName, {baudRate: bRate}, function(err) {
        if (err) {
        adapter.log.info('Serialport ' + err);
        return;
        }

        adapter.log.info('Serialport is open: ' + sPortName + ' with '  + bRate + ' bit/s');
        adapter.setState('info.connection', true, true);

        const parser = sPort.pipe(new Readline({ delimiter: '\r\n' }));

        parser.on('data', function(data) {

            adapter.log.debug('Data received: ' + data);

            var dataString;
            dataString = '' + data;
            dataString = dataString.replace(/[\r]/g, '');
            if (/^NodeId/.test(dataString) && dataString.match(/^NodeId,\d+/)[0].substring(7) >= 1 && /data:OK/.test(dataString)) {
                setNodeState(dataString);
            } else {
                adapter.log.info('Invalid data: ' + data);
            }
        });
    });

}


// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
} 

