//@flow


import type {
    ControllerDependenciesDefinition
} from './Controller';

const Controller = require('./Controller');

module.exports = class JsonController extends Controller {
    static get dependencies(): ControllerDependenciesDefinition {
        return [
        ];
    }

    response(httpCode: number, statusCode: number, response: Object) {
        const millisecondsPerSecond = 1000;
        const ctx = this.ctx;

        if(typeof ctx === 'undefined' || ctx === null) {
            return false;
        }

        let resp = {
            'code': statusCode,
            'response': response,
            'timestamp': Math.floor(new Date() / millisecondsPerSecond)
        };

        ctx.status = httpCode;
        ctx.body = resp;

        this.pushEventData('response', {
            'status': httpCode,
            'body': resp
        });

        return true;
    }
};
