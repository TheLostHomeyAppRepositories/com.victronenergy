'use strict';

const BaseDriver = require('../baseDriver.js');
const { Energy } = require('../../lib/devices/energy.js');

class EnergyMeterDriver extends BaseDriver {

    async onPair(session) {
        return await super.pair(Energy.serial, 'Energy Meter', session);
    }

}
module.exports = EnergyMeterDriver;