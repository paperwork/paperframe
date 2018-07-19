//@flow


import type {
    ControllerConfig
} from './Controller';

const Base = require('./Base');

module.exports = class ServiceProvider extends Base {
    initialize() {
        return true;
    }
};
