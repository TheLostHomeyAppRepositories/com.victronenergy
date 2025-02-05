'use strict';

const { Driver } = require('homey');
const Discovery = require('../lib/modbus/discovery.js');

class BaseDriver extends Driver {

    async pair(identifier, deviceName, session, useUnitIdAsIdentifier = false) {
        let self = this;
        let devices = [];
        let settings;
        let discoveryResponse = {};

        session.setHandler('settings', async (data) => {
            settings = data;
            let discovery = new Discovery();

            try {
                discoveryResponse = await discovery.validateUnitId(
                    settings.address,
                    Number(settings.port),
                    Number(settings.modbus_unitId),
                    identifier
                );
                await session.nextView();
            } catch (error) {
                self.error('Discovery validation failed:', error);
            }
        });

        session.setHandler('list_devices', async (data) => {

            let deviceId = String(useUnitIdAsIdentifier ? settings.modbus_unitId : discoveryResponse.returnValue).replace(/[^a-z0-9]/gi, '');

            if (discoveryResponse.outcome == 'success') {
                self.log(`Found ${deviceName} with id: ${deviceId}`);
                devices.push({
                    name: `${deviceName} (${deviceId})`,
                    data: {
                        id: `${deviceId}`
                    },
                    settings: {
                        address: settings.address,
                        port: Number(settings.port),
                        modbus_unitId: Number(settings.modbus_unitId)
                    }
                });
            } else if (discoveryResponse.outcome == 'connect_failure') {
                self.log(discoveryResponse);
                throw new Error(`Error: ${discoveryResponse.reason}`);
            }

            return devices;
        });
    }

};

module.exports = BaseDriver;