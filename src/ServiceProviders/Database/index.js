//@flow

const path = require('path');

const ServiceProvider = require('../../ServiceProvider');

const capitalize = require('lodash').capitalize;

module.exports = class DatabaseServiceProvider extends ServiceProvider {
    _driverId:                  string
    _driverRequire:             Function
    _driver:                    any

    async initialize(): Promise<boolean> {
        const prefix = process.env.SERVICE_PREFIX || 'paperframe';
        const dirname = process.env.SERVICE_DIRNAME || __dirname;

        this.logger.debug('Database: Initializing ...');

        let driverId = process.env.DATABASE_DRIVER;
        if(typeof driverId === 'undefined'
        || driverId === null) {
            throw new Error('Database: No driver defined! Please set DATABASE_DRIVER in your environment first.');
        }

        this._driverId = driverId;

        let driverRequire = this.loadExtension(
            path.join(dirname, 'ServiceProviders', 'Database', 'Drivers', capitalize(this._driverId)),
            (`${prefix}-database-driver-${this._driverId}`)
        );

        if(typeof driverRequire === 'undefined'
        || driverRequire === null) {
            throw new Error('Database: Driver could not be initialized. Aborting!');
        }

        this._driverRequire = driverRequire;

        this._driver = new this._driverRequire();
        this._driver.logger = this.logger;
        return this._driver.initialize();
    }

    get driver(): Object {
        return {
            'id': this._driverId,
            'client': this._driver.client
        };
    }
};
