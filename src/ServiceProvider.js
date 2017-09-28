//@flow


import type {
    ControllerConfig
} from './Types/Controller.t';

const Base = require('./Base');

module.exports = class ServiceProvider extends Base {
    initialize() {
        return true;
    }
};
