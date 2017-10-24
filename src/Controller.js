//@flow

import type {
    ControllerConfig,
    ControllerParams,
    ControllerBeforeReturn,
    ControllerActionReturn
} from './Types/Controller.t';

import type {
    EventDataType,
    EventDataTable
} from './Types/Event.t';

type nullPromise = Promise<null>;
type errorPromise = Promise<string>;

const Base = require('./Base');

module.exports = class Controller extends Base {
    _config:                    ControllerConfig
    _ctx:                       Function
    _next:                      Function
    _eventDataTable:            EventDataTable

    constructor(config: ControllerConfig) {
        super();
        this._config = config;
        this.flushEventData();
    }

    set ctx(ctx: Function) {
        this._ctx = ctx;
    }

    get ctx(): Function {
        return this._ctx;
    }

    set next(next: Function) {
        this._next = next;
    }

    get next(): Function {
        return this._next;
    }

    get remoteAddress(): string {
        const firstItem = 0;
        return (this.ctx.req.headers['x-forwarded-for'] || '').split(',')[firstItem] || this.ctx.req.connection.remoteAddress;
    }

    get remoteUserAgent(): string {
        return this.ctx.req.headers['user-agent'];
    }

    $S(dependencyId: string): any {
        const dependencies = this._config.dependencies;

        switch(dependencyId) {
        case 'server':
            return this.ctx;
        default:
            if(dependencies.hasOwnProperty(dependencyId)) {
                return dependencies[dependencyId];
            }
            break;
        }

        return null;
    }

    $C(collectionId: string): any {
        const collections = this._config.collections;

        if(collections.hasOwnProperty(collectionId)) {
            const database = this.$S('database');

            if(typeof database === 'undefined'
            || database === null) {
                throw new Error('Controller: Cannot instantiate new Collection as no Database driver is available. Controller needs to specify "database" as dependency.');
            }

            return (new collections[collectionId](database.driver)).driver;
        }

        return null;
    }

    pushEventData(eventDataId: string, eventData: EventDataType): boolean {
        this._eventDataTable[eventDataId] = eventData;
        return true;
    }

    flushEventData(): boolean {
        this._eventDataTable = {};
        return true;
    }

    readEventData(): EventDataTable {
        return this._eventDataTable;
    }

    _notImplementedNull(params: ControllerParams): nullPromise {
        return new Promise((fulfill, reject) => {
            fulfill(null);
        });
    }

    _notImplementedError(params: ControllerParams): errorPromise {
        return new Promise((fulfill, reject) => {
            params.ctx.body = 'Not implemented';
            params.ctx.code = 404;
            fulfill('Not implemented');
        });
    }

    /*
     * Implementation example. Do not include this, otherwise the Router typeof
     * check won't function anymore, resulting in weird effects.
     */
    /*
    async beforeIndex(params: ControllerParams): ControllerBeforeReturn {
        return this._notImplementedNull(params);
    }

    async index(params: ControllerParams): ControllerActionReturn {
        return this._notImplementedError(params);
    }

    async beforeCreate(params: ControllerParams): ControllerBeforeReturn {
        return this._notImplementedNull(params);
    }

    async create(params: ControllerParams): ControllerActionReturn {
        return this._notImplementedError(params);
    }

    async beforeShow(params: ControllerParams): ControllerBeforeReturn {
        return this._notImplementedNull(params);
    }

    async show(params: ControllerParams): ControllerActionReturn {
        return this._notImplementedError(params);
    }

    async beforeUpdate(params: ControllerParams): ControllerBeforeReturn {
        return this._notImplementedNull(params);
    }

    async update(params: ControllerParams): ControllerActionReturn {
        return this._notImplementedError(params);
    }

    async beforeDestroy(params: ControllerParams): ControllerBeforeReturn {
        return this._notImplementedNull(params);
    }

    async destroy(params: ControllerParams): ControllerActionReturn {
        return this._notImplementedError(params);
    }
    */
};
