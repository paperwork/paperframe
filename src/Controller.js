//@flow

const EventEmitter = require('eventemitter2').EventEmitter2;

export type ControllerDependenciesDefinition = Array<string>;

export type ControllerDependency = {
    id: string,
    instance: Function
};

export type ControllerDependencies = {
    [key: string]: ControllerDependency
};

export type ControllerCollections = {
    [key: string]: Function
};

export type ControllerConfig = {
    dependencies: ControllerDependencies,
    collections: ControllerCollections
};

export type ControllerParams = {
    session: Object, // TODO: define type
    before: ?Object,
    parameters: Object,
    query: Object,
    headers: Object,
    body: Object
};

export type ControllerParamsReturn = Promise<ControllerParams>;

export type ControllerBeforeReturn = Promise<any>;

export type ControllerActionReturn = Promise<any>;

export type ControllerRouteAclEntry = {
    protected: boolean
};

export type ControllerRouteAclTable = {
    index?: ControllerRouteAclEntry,
    show?: ControllerRouteAclEntry,
    create?: ControllerRouteAclEntry,
    update?: ControllerRouteAclEntry,
    destroy?: ControllerRouteAclEntry,
};

import type {
    EventPackage,
    EventDataType,
    EventDataTable
} from './Event';

type nullPromise = Promise<null>;
type errorPromise = Promise<string>;

const Base = require('./Base');

module.exports = class Controller extends Base {
    _config:                    ControllerConfig
    _ctx:                       Function
    _next:                      Function
    _ee:                        EventEmitter
    _eventId:                   string
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

    set eventId(eventId: string) {
        this._eventId = eventId;
    }

    get eventId(): string {
        return this._eventId;
    }

    set ee(ee: EventEmitter) {
        this._ee = ee;
    }

    get ee(): EventEmitter {
        return this._ee;
    }

    async emitEventData(eventData: EventDataTable): Promise<Array<any>> {
        if(typeof eventData === 'undefined'
        || eventData === null
        || eventData === {}) {
            return [];
        }

        const eventPackage: EventPackage = {
            'data': eventData,
            'timestamp': new Date()
        };

        return this._ee.emitAsync(this._eventId, eventPackage);
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

    get remoteAddress(): string {
        const firstItem = 0;
        return (this.ctx.req.headers['x-forwarded-for'] || '').split(',')[firstItem] || this.ctx.req.connection.remoteAddress;
    }

    get remoteUserAgent(): string {
        return this.ctx.req.headers['user-agent'];
    }

    get session(): Object {
        if(typeof this._ctx !== 'undefined'
        && this._ctx !== null
        && this._ctx.hasOwnProperty('state')
        && typeof this._ctx.state === 'object'
        && this._ctx.state.hasOwnProperty('user')
        && typeof this._ctx.state.user === 'object'
        && this._ctx.state.user.hasOwnProperty('session')) {
            return this._ctx.state.user.session;
        }

        return {};
    }

    get body(): ?any {
        if(typeof this._ctx !== 'undefined'
        && this._ctx !== null
        && this._ctx.hasOwnProperty('request')
        && typeof this._ctx.request === 'object'
        && this._ctx.request.hasOwnProperty('body')
        && typeof this._ctx.request.body !== 'undefined') {
            return this._ctx.request.body;
        }

        return null;
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

            return (new collections[collectionId](database.driver));
        }

        return null;
    }

    _notImplementedNull(params: ControllerParams): nullPromise {
        return new Promise((fulfill, reject) => {
            fulfill(null);
        });
    }

    _notImplementedError(params: ControllerParams): errorPromise {
        return new Promise((fulfill, reject) => {
            this.ctx.body = 'Not implemented';
            this.ctx.code = 404;
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
