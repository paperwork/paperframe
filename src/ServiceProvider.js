//@flow

const EventEmitter = require('eventemitter2').EventEmitter2;
const Base = require('./Base');

import type {
    TControllerConfig
} from './Controller';


module.exports = class ServiceProvider extends Base {
    _ee:                        EventEmitter

    initialize() {
        return true;
    }

    set ee(ee: EventEmitter) {
        this._ee = ee;
    }

    get ee(): EventEmitter {
        return this._ee;
    }
};
