//@flow


import type {
    TControllerDependenciesDefinition,
    TControllerParams,
    TControllerActionReturn
} from './Controller';

const Controller = require('./Controller');

module.exports = class JsonController extends Controller {
    static get dependencies(): TControllerDependenciesDefinition {
        return [
        ];
    }

    response(httpCode: number, statusCode: number, response: Object): boolean {
        const millisecondsPerSecond: number = 1000;
        const ctx = this.ctx;

        if(typeof ctx === 'undefined' || ctx === null) {
            return false;
        }

        let resp: Object = { // TODO: Make this a specific type
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

    async return(params: TControllerParams, httpCode: number, statusCode: number, response: Object): TControllerActionReturn {
        const success: boolean = this.response(httpCode, statusCode, response);

        if(success === false) {
            throw new Error('No active ctx available!');
        }

        return params;
    }
};
