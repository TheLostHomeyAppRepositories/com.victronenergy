'use strict';

const { Device } = require('homey');

class BaseDevice extends Device {

    async onInit() {
        this.api = null;
        this.logMessage(`Victron ${this.constructor.name} device initiated`);

        await this.setupGXSession(
            this.getSettings().address,
            this.getSettings().port,
            this.getSettings().modbus_unitId,
            this.getSettings().refreshInterval
        );
    }

    async destroyGXSession() {
        if (this.api) {
            await this.api.disconnect();
        }
    }

    async reinitializeGXSession(host, port, modbus_unitId, refreshInterval) {
        await this.destroyGXSession();
        await this.setupGXSession(host, port, modbus_unitId, refreshInterval);
    }

    _updateProperty(key, value) {
        let self = this;
        //Ignore unknown capabilities
        if (self.hasCapability(key)) {
            //All trigger logic only applies to changed values
            if (self.isCapabilityValueChanged(key, value)) {
                self.setCapabilityValue(key, value)
                    .then(function () {

                    }).catch(reason => {
                        self.error(reason);
                    });

            } else {
                //Update value to refresh timestamp in app
                self.setCapabilityValue(key, value)
                    .catch(reason => {
                        self.error(reason);
                    });
            }
        }
    }

    isCapabilityValueChanged(key, value) {
        let oldValue = this.getCapabilityValue(key);
        //If oldValue===null then it is a newly added device, lets not trigger flows on that
        if (oldValue !== null && oldValue != value) {
            return true;
        } else {
            return false;
        }
    }

    onDeleted() {
        this.logMessage(`Victron ${this.constructor.name} device deleted`);
        this.api.disconnect();
        this.api = null;
    }

    async onSettings({ oldSettings, newSettings, changedKeys }) {
        let changeConn = false;
        let host, port, modbus_unitId, refreshInterval;
        if (changedKeys.indexOf("address") > -1) {
            this.logMessage(`Address value was change to: '${newSettings.address}'`);
            host = newSettings.address;
            changeConn = true;
        }

        if (changedKeys.indexOf("port") > -1) {
            this.logMessage(`Port value was change to: '${newSettings.port}'`);
            port = newSettings.port;
            changeConn = true;
        }

        if (changedKeys.indexOf("modbus_unitId") > -1) {
            this.logMessage(`Modbus UnitId was change to: '${newSettings.modbus_unitId}'`);
            modbus_unitId = newSettings.modbus_unitId;
            changeConn = true;
        }

        if (changedKeys.indexOf("refreshInterval") > -1) {
            this.logMessage(`Refresh interval value was change to: '${newSettings.refreshInterval}'`);
            refreshInterval = newSettings.refreshInterval;
            changeConn = true;
        }

        if (changeConn) {
            //We need to re-initialize the GX session since setting(s) are changed
            this.reinitializeGXSession(
                host || this.getSettings().address,
                port || this.getSettings().port,
                modbus_unitId || this.getSettings().modbus_unitId,
                refreshInterval || this.getSettings().refreshInterval
            );
        }
    }

    updateSetting(key, value) {
        let obj = {};
        obj[key] = String(value);
        this.setSettings(obj).catch(err => {
            this.error(`Failed to update setting '${key}' with value '${value}'`, err);
        });
    }

    logMessage(message) {
        this.log(`[${this.getName()}] ${message}`);
    }
}

module.exports = BaseDevice;
