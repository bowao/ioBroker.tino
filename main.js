'use strict';

// you have to require the utils module and call adapter function
const utils = require('@iobroker/adapter-core');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
let sPort = null;
let adapter;
let learningMode = true;
let learnTimeout;
let calcTimeoutV1;
let calcTimeoutV2;
let interruptTimeout;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: 'tino',

        // is called when adapter shuts down - callback has to be called under any circumstances!
        unload: function (callback) {
            try {
                adapter.log.info('cleaned everything up...');
                if (sPort.isOpen) {
                    sPort.close();
                    adapter.log.info('Serialport closed: ' + adapter.config.serialport);
                }
                adapter.setState('info.connection', false, true);
                clearTimeout(learnTimeout);
                clearTimeout(calcTimeoutV1);
                clearTimeout(calcTimeoutV2);
                clearTimeout(interruptTimeout);
                adapter.log.info('Cleared timeout');
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
                                SerialPort.list().then((ports) => {
                                    adapter.log.info('List of port: ' + JSON.stringify(ports));
                                    adapter.sendTo(obj.from, obj.command, ports, obj.callback);
                                });
                            } else {
                                adapter.log.warn('Module serialport is not available');
                                adapter.sendTo(obj.from, obj.command, [{path: 'Not available'}], obj.callback);
                            }
                        }
                    break;
                }
            }
        },

        // is called if a subscribed state changes
        stateChange: function (id, state) {
            // Warning, state can be null if it was deleted
            let channel = id.split('.');
            const name = channel.pop();
            if (name === 'learningMode') {
                if(state && !state.ack) {
                    adapter.log.info('Set learning mode to ' + state.val);
                    learningMode = state.val;
                    adapter.setState('info.learningMode', state.val, true);
                    if (state && state.val) learningTimeout();
                    if (state && !state.val) clearTimeout(learnTimeout);
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

    if(/v=[0-9]+/.test(data) || /^NodeId/.test(data)) {
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
    }

    if(/t=[-]?[0-9]+/.test(data) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.temperature', {
            type: 'state',
            common: {
                "name": "Temperature",
                "type": "number",
                "unit": "°C",
                "min": -40,
                "max": 600,
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
    }

    if(/t1=[-]?[0-9]+/.test(data) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.temperature_1', {
            type: 'state',
            common: {
                "name": "Temperature_1",
                "type": "number",
                "unit": "°C",
                "min": -40,
                "max": 90,
                "read": true,
                "write": false,
                "role": "value.temperature",
                "desc": "Temperature_1"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.config.offsetTemperature_1', {
            type: 'state',
            common: {
                "name": "Offset Temperature_1",
                "type": "number",
                "unit": "K",
                "min": -10,
                "max": 10,
                "read": true,
                "write": true,
                "role": "level.offset",
                "desc": "Offset Temperature_1"
            },
            native: {}
        });
    }

    if(/t2=[-]?[0-9]+/.test(data) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.temperature_2', {
            type: 'state',
            common: {
                "name": "Temperature_2",
                "type": "number",
                "unit": "°C",
                "min": -40,
                "max": 90,
                "read": true,
                "write": false,
                "role": "value.temperature",
                "desc": "Temperature_2"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.config.offsetTemperature_2', {
            type: 'state',
            common: {
                "name": "Offset Temperature_2",
                "type": "number",
                "unit": "K",
                "min": -10,
                "max": 10,
                "read": true,
                "write": true,
                "role": "level.offset",
                "desc": "Offset Temperature_2"
            },
            native: {}
        });
    }

    if(/h=[0-9]+/.test(data) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.humidity', {
            type: 'state',
            common: {
                "name": "Humidity",
                "type": "number",
                "unit": "%rH",
                "min": 0,
                "max": 120,
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
    }

    if(/p=[0-9]+/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.pressure', {
            type: 'state',
            common: {
                "name": "Pressure",
                "type": "number",
                "unit": "hPa",
                "min": 300,
                "max": 1100,
                "read": true,
                "write": false,
                "role": "value.pressure",
                "desc": "Pressure"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.config.offsetPressure', {
            type: 'state',
            common: {
                "name": "Offset Pressure",
                "type": "number",
                "unit": "hPa",
                "min": -100,
                "max": 100,
                "read": true,
                "write": true,
                "role": "level.offset",
                "desc": "Offset Pressure"
            },
            native: {}
        });
   }

    if(/he=[0-9]+/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.height', {
            type: 'state',
            common: {
                "name": "Height",
                "type": "number",
                "unit": "m",
                "min": -450,
                "max": 9999,
                "read": true,
                "write": false,
                "role": "value.height",
                "desc": "Height"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.config.offsetHeight', {
            type: 'state',
            common: {
                "name": "Offset Height",
                "type": "number",
                "unit": "m",
                "min": -100,
                "max": 100,
                "read": true,
                "write": true,
                "role": "level.offset",
                "desc": "Offset Height"
            },
            native: {}
        });
   }

    if(/d=[0-9]+/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.distance', {
            type: 'state',
            common: {
                "name": "Distance",
                "type": "number",
                "unit": "cm",
                "min": -1,
                "max": 300,
                "read": true,
                "write": false,
                "role": "value.distance",
                "desc": "Distance"
            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.config.offsetDistance', {
            type: 'state',
            common: {
                "name": "Offset Distance",
                "type": "number",
                "unit": "cm",
                "min": -50,
                "max": 50,
                "read": true,
                "write": true,
                "role": "level.offset",
                "desc": "Offset Distance"
            },
            native: {}
        });
   }

    if(/r=[0-9]/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.contact', {
            type: 'state',
            common: {
                "name": "Contact",
                "type": "boolean",
                "read": true,
                "write": false,
                "role": "sensor.window",
                "desc": "Door/Window Contact",
                "states": {
                0: 'open',
                1: 'close'
                }
            },
            native: {}
        });
   }

    if(/rssi=[-]*[0-9]+/.test(data) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.rssi', {
            type: 'state',
            common: {
                "name": "RSSI",
                "type": "number",
                "unit": "dBm",
                "min": -130,
                "max": 0,
                "read": true,
                "write": false,
                "role": "value.rssi",
                "desc": "Received Signal Strength Indicator"
            },
            native: {}
        });
    }

    if(/fo=[-]*[0-9]+/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.frequencyOffset', {
            type: 'state',
            common: {
                "name": "Frequency Offset",
                "type": "number",
                "unit": "Hz",
                "min": -30000,
                "max": 30000,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Frequency Offset"
            },
            native: {}
        });
   }

    if(/^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.fei', {
            type: 'state',
            common: {
                "name": "Frequency Error Indicator",
                "type": "number",
                "unit": "",
                "min": -30000,
                "max": 30000,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Frequency Error Indicator"
            },
            native: {}
        });
   }

    if(/lqi=[0-9]+/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.linkQuality', {
            type: 'state',
            common: {
                "name": "Link Quality Indicator",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 127,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Link Quality Indicator"
            },
            native: {}
        });
   }

    if(/^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.rfm69Temperature', {
            type: 'state',
            common: {
                "name": "RFM69 Module Temperature",
                "type": "number",
                "unit": "°C",
                "min": -40,
                "max": 90,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "RFM69 Module Temperature"
            },
            native: {}
        });
    }

    if(/c=[0-9]+/.test(data) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.counter', {
            type: 'state',
            common: {
                "name": "Message Counter",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 65535,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Message Counter"
            },
            native: {}
        });
    }

    if(/be=[0-9]+/.test(data) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.radioInfo.bitErrors', {
            type: 'state',
            common: {
                "name": "Bit Errors",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 127,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Bit Errors"
            },
            native: {}
        });
    }

    if(/^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.flags.heartbeat', {
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

        adapter.setObjectNotExists('Sensor_' + id + '.flags.interrupt1', {
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

        adapter.setObjectNotExists('Sensor_' + id + '.flags.interrupt2', {
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

        adapter.setObjectNotExists('Sensor_' + id + '.flags.interrupt3', {
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

    if(/int=0x/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt1', {
            type: 'state',
            common: {
                "name": "Interrupt 1",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 1",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt2', {
            type: 'state',
            common: {
                "name": "Interrupt 2",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 2",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt3', {
            type: 'state',
            common: {
                "name": "Interrupt 3",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 3",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt4', {
            type: 'state',
            common: {
                "name": "Interrupt 4",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 4",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt5', {
            type: 'state',
            common: {
                "name": "Interrupt 5",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 5",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt6', {
            type: 'state',
            common: {
                "name": "Interrupt 6",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 6",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt7', {
            type: 'state',
            common: {
                "name": "Interrupt 7",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 7",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });

        adapter.setObjectNotExists('Sensor_' + id + '.interrupts.interrupt8', {
            type: 'state',
            common: {
                "name": "Interrupt 8",
                "type": "number",
                "unit": "",
                "min": 0,
                "max": 3,
                "read": true,
                "write": false,
                "role": "value",
                "desc": "Interrupt 8",
                "states": {
                0: '',
                1: 'CHANGE',
                2: 'FALLING',
                3: 'RISING'
                }

            },
            native: {}
        });
    }

    if (/sy=[0-9]/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.sync', {
            type: 'state',
            common: {
                "name": "Synchronisation",
                "type": "boolean",
                "read": true,
                "write": false,
                "role": "state",
                "desc": "Synchronisation"
            },
            native: {}
        });
    }

    if ((/t=[-]?[0-9]+/.test(data) && /h=[0-9]+/.test(data)) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.calculated.humidity_absolute', {
            type: 'state',
            common: {
                "name": "Humidity Absolute",
                "type": "number",
                "unit": "g/m3",
                "min": 0,
                "max": 100,
                "read": true,
                "write": false,
                "role": "value.humidity",
                "desc": "Humidity Absolute"
            },
            native: {}
        });
    }

    if ((/t=[-]?[0-9]+/.test(data) && /h=[0-9]+/.test(data)) || /^NodeId/.test(data)) {
        adapter.setObjectNotExists('Sensor_' + id + '.calculated.dew_point', {
            type: 'state',
            common: {
                "name": "Dew Point",
                "type": "number",
                "unit": "°C",
                "min": 0,
                "max": 100,
                "read": true,
                "write": false,
                "role": "value.temperature",
                "desc": "Dew Point"
            },
            native: {}
        });
    }

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
    let bitErrors;
    let heartbeat;
    let inter1;
    let inter2;
    let inter3;
    let humAbs;
    let vCalc;
    let dewPoint;
    let outerMessage;
    let innerMessage;

    outerMessage = data.split(',');
    innerMessage = outerMessage[3].split(';');

    nodeId = parseInt(outerMessage[1]);

    if(learningMode == true) {
        adapter.log.info('Learning v1 node with id: ' + nodeId);
        createNode(nodeId, data);
    }

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

    bitErrors = parseInt(outerMessage[6].substring(10));
    adapter.setState('Sensor_' + nodeId + '.radioInfo.bitErrors', { val: bitErrors, ack: true});

    heartbeat = ((parseInt(innerMessage[5], 16) & 1) === 1);
    inter1 = ((parseInt(innerMessage[5], 16) & 2) === 2);
    inter2 = ((parseInt(innerMessage[5], 16) & 4) === 4);
    inter3 = ((parseInt(innerMessage[5], 16) & 8) === 8);
    adapter.setState('Sensor_' + nodeId + '.flags.heartbeat', { val: heartbeat, ack: true});
    adapter.setState('Sensor_' + nodeId + '.flags.interrupt1', { val: inter1, ack: true});
    adapter.setState('Sensor_' + nodeId + '.flags.interrupt2', { val: inter2, ack: true});
    adapter.setState('Sensor_' + nodeId + '.flags.interrupt3', { val: inter3, ack: true});

    if (humidity != undefined && humidity != "" && humidity != 0 && temperature != undefined && temperature != "" && temperature != 0) {
        calcTimeoutV1 = setTimeout(function() {
            adapter.getState('Sensor_' + nodeId + '.temperature', function (err, stateTemp) {
                adapter.getState('Sensor_' + nodeId + '.humidity', function (err, stateHum) {
                    if(err) {
                        adapter.log.info(err);
                    } else {
                        if (stateTemp && stateHum) {
//                            humAbsRel = 18.016 / 8314.4 * 100000 * stateHum.val / 100 * 6.1078 * Math.pow (10,((7.5 * stateTemp.val) / (237.3 + stateTemp.val))) / (stateTemp.val + 273.15);
                            vCalc = Math.log10((stateHum.val / 100) * (6.1078 * Math.pow (10,((7.5 * stateTemp.val) / (237.3 + stateTemp.val))) / 6.1078));
                            dewPoint = 237.3 * vCalc / (7.5 - vCalc);
                            humAbs = Math.pow(10, 5) * 18.016 / 8314.3 * (6.1078 * Math.pow (10,((7.5 * dewPoint) / (237.3 + dewPoint))) / (stateTemp.val + 273.15));
                            adapter.log.debug(nodeId + ' Humidity Absolute: ' + humAbs.toFixed(2) + ' g/m3 | Dew Point: ' + dewPoint.toFixed(2) + ' °C');
                            adapter.setState('Sensor_' + nodeId + '.calculated.humidity_absolute', { val: humAbs.toFixed(2), ack: true});
                            adapter.setState('Sensor_' + nodeId + '.calculated.dew_point', { val: dewPoint.toFixed(2), ack: true});
                        }
                    }
                });
            });
        }, 500);
    }

    adapter.log.debug('data received for Node Id: ' + nodeId + ' voltage=' + voltage + ' temperature=' + temperature + ' humidity=' + humidity + ' rssi=' + rssi + ' FEI=' + fei + ' RFM69Temp=' + rfm69Temp + ' counter=' + counter + ' biterrors=' + bitErrors + ' heartbeat=' + heartbeat + ' interrupt1=' + inter1 + ' interrupt2=' + inter2 + ' interrupt3=' + inter3);

}

function setNodeStateV2(data) {

    let nodeId;
    let voltage;
    let temperature;
    let temperature1;
    let temperature2;
    let humidity;
    let pressure;
    let height;
    let distance;
    let contact;
    let rssi;
    let freqOffset;
    let linkQuali;
    let counter;
    let bitErrors;
    let intrBin = "0000000000000000";
    let intr1;
    let intr2;
    let intr3;
    let intr4;
    let intr5;
    let intr6;
    let intr7;
    let intr8;
    let sync;
    let humAbs;
    let vCalc;
    let dewPoint;

    nodeId = data.split(' ')[0];

    if(learningMode == true) {
        adapter.log.info('Learning v2 node with id: ' + nodeId);
        createNode(nodeId, data);
    }

    if (/v=[0-9]+/.test(data)) {
        voltage = parseInt((data.match(/v=[0-9]+/)[0].substring(2))) / 1000;
        adapter.setState('Sensor_' + nodeId + '.battery', { val: voltage, ack: true});
    }

    if (/t=[-]?[0-9]+/.test(data)) {
        temperature = parseInt((data.match(/t=[-]?[0-9]+/)[0].substring(2))) / 100;
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
    }

    if (/t1=[-]?[0-9]+/.test(data)) {
        temperature1 = parseInt((data.match(/t1=[-]?[0-9]+/)[0].substring(3))) / 100;
        adapter.getState('Sensor_' + nodeId + '.config.offsetTemperature_1', function (err, state) {
            if(err) {
                adapter.log.info(err);
            } else {
                if(state){
                    temperature1 = temperature1 + state.val;
                    adapter.setState('Sensor_' + nodeId + '.config.offsetTemperature_1', { val: state.val, ack: true});
                }
                adapter.setState('Sensor_' + nodeId + '.temperature_1', { val: temperature1, ack: true});
            }
        });
    }

    if (/t2=[-]?[0-9]+/.test(data)) {
        temperature2 = parseInt((data.match(/t2=[-]?[0-9]+/)[0].substring(3))) / 100;
        adapter.getState('Sensor_' + nodeId + '.config.offsetTemperature_2', function (err, state) {
            if(err) {
                adapter.log.info(err);
            } else {
                if(state){
                    temperature2 = temperature2 + state.val;
                    adapter.setState('Sensor_' + nodeId + '.config.offsetTemperature_2', { val: state.val, ack: true});
                }
                adapter.setState('Sensor_' + nodeId + '.temperature_2', { val: temperature2, ack: true});
            }
        });
    }

    if (/h=[0-9]+/.test(data)) {
        humidity = parseInt((data.match(/h=[0-9]+/)[0].substring(2))) / 100;
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
    }

    if (/p=[0-9]+/.test(data)) {
        pressure = parseInt((data.match(/p=[0-9]+/)[0].substring(2)));
        adapter.getState('Sensor_' + nodeId + '.config.offsetPressure', function (err, state) {
            if(err) {
                adapter.log.info(err);
            } else {
                if(state){
                    pressure = pressure + state.val;
                    adapter.setState('Sensor_' + nodeId + '.config.offsetPressure', { val: state.val, ack: true});
                }
                adapter.setState('Sensor_' + nodeId + '.pressure', { val: pressure, ack: true});
            }
        });
    }

    if (/he=[0-9]+/.test(data)) {
        height = parseInt((data.match(/he=[0-9]+/)[0].substring(3))) / 100;
        adapter.getState('Sensor_' + nodeId + '.config.offsetHeight', function (err, state) {
            if(err) {
                adapter.log.info(err);
            } else {
                if(state){
                    height = height + state.val;
                    adapter.setState('Sensor_' + nodeId + '.config.offsetHeight', { val: state.val, ack: true});
                }
                adapter.setState('Sensor_' + nodeId + '.height', { val: height, ack: true});
            }
        });
    }

    if (/d=[0-9]+/.test(data)) {
        distance = parseInt((data.match(/d=[0-9]+/)[0].substring(2))) / 10;
        adapter.getState('Sensor_' + nodeId + '.config.offsetDistance', function (err, state) {
            if(err) {
                adapter.log.info(err);
            } else {
                if(state){
                    distance = distance + state.val;
                    adapter.setState('Sensor_' + nodeId + '.config.offsetDistance', { val: state.val, ack: true});
                }
                adapter.setState('Sensor_' + nodeId + '.distance', { val: distance, ack: true});
            }
        });
    }

    if (/r=[0-9]/.test(data)) {
        contact = parseInt((data.match(/r=[0-9]+/)[0].substring(2)));
        if(contact === 0 || contact === 1){
        adapter.setState('Sensor_' + nodeId + '.contact', { val: contact, ack: true});
        } else {
            adapter.log.warn('Wrong contact state received: Sensor_' + nodeId + '.contact : ' + contact);
        }
    }

    if (/rssi=[-]*[0-9]+/.test(data)) {
        rssi = parseInt((data.match(/rssi=[-]*[0-9]+/)[0].substring(5))) / 10;
        adapter.setState('Sensor_' + nodeId + '.radioInfo.rssi', { val: rssi, ack: true});
    }

    if (/fo=[-]*[0-9]+/.test(data)) {
        freqOffset = parseInt((data.match(/fo=[-]*[0-9]+/)[0].substring(3)));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.frequencyOffset', { val: freqOffset, ack: true});
    }

    if (/lqi=[0-9]+/.test(data)) {
        linkQuali = parseInt((data.match(/lqi=[0-9]+/)[0].substring(4)));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.linkQuality', { val: linkQuali, ack: true});
    }

    if (/be=[0-9]+/.test(data)) {
        bitErrors = parseInt((data.match(/be=[0-9]+/)[0].substring(3)));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.bitErrors', { val: bitErrors, ack: true});
    }

    if (/c=[0-9]+/.test(data)) {
        counter = parseInt((data.match(/c=[0-9]+/)[0].substring(2)));
        adapter.setState('Sensor_' + nodeId + '.radioInfo.counter', { val: counter, ack: true});
    }

    if (/int=0x[0-9,a-f]+/.test(data)) {
        intrBin = (intrBin + (parseInt((data.match(/int=0x[0-9,a-f]+/)[0].substring(6)),16)).toString(2)).substr(-16);

        setInterrupt(nodeId, intrBin);
        interruptTimeout = setTimeout(function() {
            setInterrupt(nodeId, "0000000000000000");
        },2000);
    }

    if (/sy=[0-9]/.test(data)) {
        sync = parseInt((data.match(/sy=[0-9]+/)[0].substring(3)));
        if(sync === 0 || sync === 1){
        adapter.setState('Sensor_' + nodeId + '.sync', { val: sync, ack: true});
        } else {
            adapter.log.warn('Wrong sync state received: Sensor_' + nodeId + '.sync : ' + sync);
        }
    }


    if (/t=[-]?[0-9]+/.test(data) && /h=[0-9]+/.test(data)) {
        calcTimeoutV2 = setTimeout(function() {
            adapter.getState('Sensor_' + nodeId + '.temperature', function (err, stateTemp) {
                adapter.getState('Sensor_' + nodeId + '.humidity', function (err, stateHum) {
                    if(err) {
                        adapter.log.info(err);
                    } else {
                        if (stateTemp && stateHum) {
//                            humAbsRel = 18.016 / 8314.4 * 100000 * stateHum.val / 100 * 6.1078 * Math.pow (10,((7.5 * stateTemp.val) / (237.3 + stateTemp.val))) / (stateTemp.val + 273.15);
                            vCalc = Math.log10((stateHum.val / 100) * (6.1078 * Math.pow (10,((7.5 * stateTemp.val) / (237.3 + stateTemp.val))) / 6.1078));
                            dewPoint = 237.3 * vCalc / (7.5 - vCalc);
                            humAbs = Math.pow(10, 5) * 18.016 / 8314.3 * (6.1078 * Math.pow (10,((7.5 * dewPoint) / (237.3 + dewPoint))) / (stateTemp.val + 273.15));
                            adapter.log.debug(nodeId + ' Humidity Absolute: ' + humAbs.toFixed(2) + ' g/m3 | Dew Point: ' + dewPoint.toFixed(2) + ' °C');
                            adapter.setState('Sensor_' + nodeId + '.calculated.humidity_absolute', { val: humAbs.toFixed(2), ack: true});
                            adapter.setState('Sensor_' + nodeId + '.calculated.dew_point', { val: dewPoint.toFixed(2), ack: true});
                        }
                    }
                });
            });
        }, 500);
    }

    adapter.log.debug('data received for Node Id: ' + nodeId + ' voltage=' + voltage + ' temperature=' + temperature + ' humidity=' + humidity + ' pressure=' + pressure + ' height=' + height + ' distance=' + distance + ' contact=' + contact);
    adapter.log.debug('data received for Node Id: ' + nodeId + ' rssi=' + rssi + ' FrequencyOffset=' + freqOffset + ' linkQuality=' + linkQuali + ' counter=' + counter + ' biterrors=' + bitErrors + ' sync=' + sync + ' intr1=' + intr1 + ' intr2=' + intr2 + ' intr3=' + intr3 + ' intr4=' + intr4 + ' intr5=' + intr5 + ' intr6=' + intr6 + ' intr7=' + intr7 + ' intr8=' + intr8);
}

function setInterrupt(nodeId, intrBin) {

    let intr1 = parseInt((intrBin.substring(14, 16)), 2);
    let intr2 = parseInt((intrBin.substring(12, 14)), 2);
    let intr3 = parseInt((intrBin.substring(10, 12)), 2);
    let intr4 = parseInt((intrBin.substring(8, 10)), 2);
    let intr5 = parseInt((intrBin.substring(6, 8)), 2);
    let intr6 = parseInt((intrBin.substring(4, 6)), 2);
    let intr7 = parseInt((intrBin.substring(2, 4)), 2);
    let intr8 = parseInt((intrBin.substring(0, 2)), 2);
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt1', { val: intr1, ack: true});
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt2', { val: intr2, ack: true});
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt3', { val: intr3, ack: true});
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt4', { val: intr4, ack: true});
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt5', { val: intr5, ack: true});
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt6', { val: intr6, ack: true});
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt7', { val: intr7, ack: true});
    adapter.setState('Sensor_' + nodeId + '.interrupts.interrupt8', { val: intr8, ack: true});

}

function learningTimeout() {
    learnTimeout = setTimeout(learningOff, 600000);
}

function learningOff() {
    adapter.setState('info.learningMode', false, true)
    learningMode = false;
    adapter.log.info('learning mode disabled');
}

function main() {

    adapter.setState('info.connection', false, true);
    if (!adapter.config.serialport) {
        adapter.log.warn('Please define the serial port.');
        return;
    }

    adapter.getState('info.learningMode', function (err, state) {
        if(err) {
            adapter.log.info('Error: ' + err);
        } else {
            if(!state) {
                adapter.setState('info.learningMode', true, true)
                learningMode = true;
            } else {
                learningMode = state.val;
            }
            if(learningMode) learningTimeout();
            adapter.log.info('Learning mode is ' + learningMode);
        }
    });

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
            } else if (/^[0-9]+\s[a-z]{1,4}=\d+&/.test(dataString) && dataString.split(' ')[0] >= 1) {
                setNodeStateV2(dataString);
            } else {
                adapter.log.info('Invalid data: ' + data);
            }
        });
    });

    adapter.subscribeStates('info.learningMode');

}


// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}

