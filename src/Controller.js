//@flow

const EventEmitter = require('eventemitter2').EventEmitter2;

export type TControllerDependenciesDefinition = Array<string>;

export type TControllerDependencies = {
    [key: string]: Function
};

export type TControllerCollections = {
    [key: string]: Function
};

export type TControllerConfig = {
    dependencies: TControllerDependencies,
    collections: TControllerCollections
};

export type TControllerSession = {}; // TODO define session object

export type TControllerBody = Object|Array<Object|string>|string|null;

export type TControllerParams = {
    session: TControllerSession,
    before: TControllerBody,
    parameters: Object,
    query: Object,
    headers: Object,
    body: TControllerBody
};

export type TControllerParamsReturn = Promise<TControllerParams>;

export type TControllerBeforeReturn = Promise<TControllerParams>;

export type TControllerActionReturn = Promise<TControllerParams>;

export type TControllerRouteAclEntry = {
    protected: boolean
};

export type TControllerRouteAclTable = {
    index?: TControllerRouteAclEntry,
    show?: TControllerRouteAclEntry,
    create?: TControllerRouteAclEntry,
    update?: TControllerRouteAclEntry,
    destroy?: TControllerRouteAclEntry,
};

import type {
    TEventPackage,
    TEventData,
    TEventDataTable
} from './Event';

export interface IController {
    ctx: Object;
    next: Function;
    +routeLogLevel: string;
    eventId: string;
    ee: EventEmitter;
    emitEventData(eventData: TEventDataTable): Promise<Array<any>>;
    pushEventData(eventDataId: string, eventData: TEventData): boolean;
    flushEventData(): boolean;
    readEventData(): TEventDataTable;
    +remoteAddress: string;
    +remoteUserAgent: string;
    +session: TControllerSession;
    +body: TControllerBody;
    $S(dependencyId: string): any;
    $C(collectionId: string): any;
    +routeAcl: TControllerRouteAclTable;
    +eventListener: string;
    onEvent(eventId: string, eventPackage: TEventPackage): Promise<boolean>;
}

const Base = require('./Base');

module.exports = class Controller extends Base implements IController {
    _config:                    TControllerConfig
    _ctx:                       Object
    _next:                      Function
    _ee:                        EventEmitter
    _eventId:                   string
    _eventDataTable:            TEventDataTable

    constructor(config: TControllerConfig) {
        super();
        this._config = config;
        this.flushEventData();
    }

    set ctx(ctx: Object) {
        this._ctx = ctx;
    }

    get ctx(): Object {
        return this._ctx;
    }

    set next(next: Function) {
        this._next = next;
    }

    get next(): Function {
        return this._next;
    }

    get routeLogLevel(): string {
        return 'debug';
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

    async emitEventData(eventData: TEventDataTable): Promise<Array<any>> {
        if(typeof eventData === 'undefined'
        || eventData === null
        || eventData === {}) {
            return [];
        }

        const eventPackage: TEventPackage = {
            'data': eventData,
            'timestamp': new Date()
        };

        return this._ee.emitAsync(this._eventId, eventPackage);
    }

    pushEventData(eventDataId: string, eventData: TEventData): boolean {
        this._eventDataTable[eventDataId] = eventData;
        return true;
    }

    flushEventData(): boolean {
        this._eventDataTable = {};
        return true;
    }

    readEventData(): TEventDataTable {
        return this._eventDataTable;
    }

    get remoteAddress(): string {
        const firstItem = 0;
        return (this.ctx.req.headers['x-forwarded-for'] || '').split(',')[firstItem] || this.ctx.req.connection.remoteAddress;
    }

    get remoteUserAgent(): string {
        return this.ctx.req.headers['user-agent'];
    }

    get session(): TControllerSession {
        if(this._ctxHasState(this._ctx) === true
        && this._ctxStateHasUser(this.ctx.state) === true
        && this._ctx.state.user.hasOwnProperty('session')) {
            return this._ctx.state.user.session;
        }

        return {};
    }

    _ctxHasState(ctx: Object): boolean {
        if(typeof ctx !== 'undefined'
        && ctx !== null
        && ctx.hasOwnProperty('state')
        && typeof ctx.state === 'object') {
            return true;
        }

        return false;
    }

    _ctxStateHasUser(ctxState: Object): boolean {
        if(ctxState.hasOwnProperty('user')
        && typeof ctxState.user === 'object') {
            return true;
        }

        return false;
    }

    get body(): TControllerBody {
        if(typeof this._ctx !== 'undefined'
        && this._ctx !== null
        && this._ctx.hasOwnProperty('request')
        && typeof this._ctx.request === 'object'
        && this._ctx.request.hasOwnProperty('body')
        && typeof this._ctx.request.body !== 'undefined') {
            return this._ctx.request.body;
        }

        return {};
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

    static get dependencies(): TControllerDependenciesDefinition {
        return [];
    }

    static get resource(): string {
        return 'undefined';
    }

    static get route(): string {
        return '/undefined';
    }

    get routeAcl(): TControllerRouteAclTable {
        return {};
    }

    get eventListener(): string {
        return '**';
    }

    async onEvent(eventId: string, eventPackage: TEventPackage): Promise<boolean> {
        const logLevel: string = this.routeLogLevel || 'trace';
        this.logger[logLevel]('Controller: Received event %s with contents: %j', eventPackage);

        return true;
    }

    /*
     * Implementation example. Do not include this, otherwise the Router typeof
     * check won't function anymore, resulting in weird effects.
     */
    /*
    async beforeIndex(params: TControllerParams): TControllerBeforeReturn {
    }

    async index(params: TControllerParams): TControllerActionReturn {
    }

    async beforeCreate(params: TControllerParams): TControllerBeforeReturn {
    }

    async create(params: TControllerParams): TControllerActionReturn {
    }

    async beforeShow(params: TControllerParams): TControllerBeforeReturn {
    }

    async show(params: TControllerParams): TControllerActionReturn {
    }

    async beforeUpdate(params: TControllerParams): TControllerBeforeReturn {
    }

    async update(params: TControllerParams): TControllerActionReturn {
    }

    async beforeDestroy(params: TControllerParams): TControllerBeforeReturn {
    }

    async destroy(params: TControllerParams): TControllerActionReturn {
    }
    */
};
