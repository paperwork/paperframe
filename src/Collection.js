//@flow


const path = require('path');

const capitalize = require('lodash').capitalize;

module.exports.auto = (collectionName: string, availableDrivers: Object) => class Collection {
    _dbc:                       Object
    _collectionDriver:          Function

    constructor(dbc: Object) {
        this._dbc = dbc;

        let driverRequire = availableDrivers[this._dbc.id];

        if(typeof driverRequire === 'undefined'
        || driverRequire === null) {
            try {
                driverRequire = require('paperwork-collection-' + collectionName + '-' + this._dbc.id);
            } catch(err) {
                throw new Error('Collection: Error loading driver ' + this._dbc.id + ' for collection ' + collectionName + '!');
            }
        }

        this._collectionDriver = new availableDrivers[this._dbc.id](this._dbc.client);
    }

    get driver(): Function {
        return this._collectionDriver;
    }
};
