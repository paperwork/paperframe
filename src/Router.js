//@flow

const fs = require('fs');
const path = require('path');
const EventEmitter = require('eventemitter2').EventEmitter2;

const Base = require('./Base');
const Controller = require('./Controller');
const HttpStatus = require('http-status-codes');
const Common = require('./Common');

const capitalize = require('lodash').capitalize;
const upperFirst = require('lodash').upperFirst;
const forEach = require('lodash').forEach;
const merge = require('lodash').merge;
const indexOf = require('lodash').indexOf;
const endsWith = require('lodash').endsWith;

import type {
    TControllerConfig,
    TControllerParams
} from './Controller';

import type {
    TEventDataTable,
    TEventPackage
} from './Event';

type TRoutingTableEntry = {
    name: string,
    action: string,
    route: string
};
type TRoutingTable = Array<TRoutingTableEntry>;

type TCollectionsTable = {
    [key: string]: Function
};

type TModulesTable = {
    [key: string]: Function
};

type TControllersTableEntry = {
    route: string,
    instance: Controller
};

type TControllersTable = {
    [key: string]: TControllersTableEntry
};

type TServiceProvidersTable = {
    [key: string]: Function
};

/**
 * Class for Router
 *
 * @class      Router
 */
module.exports = class Router extends Base {
    _router:                    Function
    _jwt:                       ?Function
    _jwtSecret:                 string
    _ee:                        EventEmitter
    _collections:               TCollectionsTable
    _modules:                   TModulesTable
    _controllers:               TControllersTable
    _serviceProviders:          TServiceProvidersTable
    _dirname:                   string

    /**
     * Constructs the class
     */
    constructor(options: Object) {
        super();

        // --- BEGIN CHECKLIST ---

        // [x] Check for options
        if(typeof options === 'undefined' || options === null) {
            throw new Error('Router: No options specified.');
        }

        this._initRouter(options);
        this._initJwt(options);
        this._initLogger(options);
        this._initDirname(options);
        this._initEventEmitter(options);

        this._initInstanceVariables();
    }

    _initRouter(options: Object): boolean {
        // [x] Check for router
        if(options.hasOwnProperty('koaRouter') === false) {
            throw new Error('Router: No KOA router given.');
        }

        // eslint-disable-next-line new-cap
        this._router = new options.koaRouter();

        return true;
    }

    _initJwt(options: Object): boolean {
        // [x] Check for JWT handler
        if(options.hasOwnProperty('jwtHandler') === false) {
            this._jwt = null;
            this._jwtSecret = '';
        } else {
            if(options.hasOwnProperty('jwtSecret') === false) {
                throw new Error('Router: With jwtHandler specified, jwtSecret is also required.');
            }

            this._jwt = options.jwtHandler;
            this._jwtSecret = options.jwtSecret;
        }

        return true;
    }

    _initLogger(options: Object): boolean {
        // [x] Check for logger
        if(options.hasOwnProperty('logger') === false) {
            console.error('Router: No logger given. Using console.');
            // @flowIgnore callable signature
            this.logger = console;
        } else {
            this.logger = options.logger;
        }

        return true;
    }

    _initDirname(options: Object): boolean {
        // [x] Check for dirname
        if(options.hasOwnProperty('dirname') === false) {
            this._dirname = process.env.SERVICE_DIRNAME || __dirname;
        } else {
            this._dirname = options.dirname;
        }

        return true;
    }

    _initEventEmitter(options: Object): boolean {
        // [x] Set up event emitter
        this._ee = new EventEmitter({
            'wildcard': true,
            'newListener': false,
            'maxListeners': 512,
            'verboseMemoryLeak': true
        });

        return true;
    }

    _initInstanceVariables(): boolean {
        // [x] Initialize modules, controllers and service providers
        this._modules = {};
        this._controllers = {};
        this._serviceProviders = {};

        return true;
    }

    routingTable(resourceName: string = 'entity'): TRoutingTable {
        return [
            { 'name': 'index',   'action': 'get',    'route': '/'                   }, // GET       => INDEX
            { 'name': 'create',  'action': 'post',   'route': '/'                   }, // POST      => CREATE
            { 'name': 'show',    'action': 'get',    'route': `/:${resourceName}Id` }, // GET:id    => SHOW:id
            { 'name': 'update',  'action': 'put',    'route': `/:${resourceName}Id` }, // PUT:id    => UPDATE:id
            { 'name': 'destroy', 'action': 'delete', 'route': `/:${resourceName}Id` }  // DELETE:id => DESTROY:id
        ];
    }

    async initialize(): Promise<boolean> {
        // Collections
        const serverCollections: ?string = process.env.SERVER_COLLECTIONS;

        if(typeof serverCollections === 'undefined' || serverCollections === null) {
            throw new Error('Router: No collections specified. Please set SERVER_COLLECTIONS correctly!');
        }

        const collectionsArray: Array<string> = serverCollections.split(',');

        this._collections = await this._initializeCollections(collectionsArray);

        // Modules
        const serverModules: ?string = process.env.SERVER_MODULES;

        if(typeof serverModules === 'undefined' || serverModules === null) {
            throw new Error('Router: No modules specified. Please set SERVER_MODULES correctly!');
        }

        const modulesArray: Array<string> = serverModules.split(',');

        this._modules = await this._initializeModules(modulesArray);

        await this._initializeControllersFromModules();

        // Routes
        return this._initializeRoutes(this._controllers);
    }

    async _initializeControllersFromModules(): Promise<boolean> {
        const modulesKeys: Array<string> = Object.keys(this._modules);
        const modulesKeysSize: number = modulesKeys.length;

        for(let i = 0; i < modulesKeysSize; i++) {
            const moduleName: string = modulesKeys[i];
            const moduleRequire: Function = this._modules[moduleName];

            if(!moduleRequire.hasOwnProperty('controllers') || !Array.isArray(moduleRequire.controllers)) {
                throw new Error('Router: Module does not contain controllers. Aborting!');
            }

            this.logger.debug('Router: Initializing controllers for module %s ...', moduleName);
            const initializedControllers: TControllersTable = await this._initializeControllers(moduleRequire.controllers);
            this._controllers = merge(this._controllers, initializedControllers);
        }

        return true;
    }

    async _initializeCollections(collectionsArray: Array<string>): Promise<TCollectionsTable> {
        let collectionsTable: TCollectionsTable = {};

        if(typeof collectionsArray !== 'object'
        || collectionsArray === null) {
            return collectionsTable;
        }

        const collectionsArraySize: number = collectionsArray.length;
        for(let i = 0; i < collectionsArraySize; i++) {
            const collection: string = collectionsArray[i];

            const collectionRequire: Function|null = await this._initializeCollection(collection);

            if(collectionRequire !== null) {
                collectionsTable[collection] = collectionRequire;
            }
        }

        return collectionsTable;
    }

    async _initializeCollection(collection: string): Promise<Function|null> {
        const prefix = process.env.SERVICE_PREFIX || 'paperframe';

        if(collection.length === Common.EMPTY) {
            this.logger.debug('Router: Not initializing collection, because it is empty.');
            return null;
        }

        this.logger.debug('Router: Initializing collection %s ...', collection);

        let collectionRequire = this.loadExtension(
            path.join(this._dirname, 'Collections', upperFirst(collection)),
            (prefix + '-collection-' + collection)
        );

        if(typeof collectionRequire === 'undefined'
        || collectionRequire === null) {
            throw new Error('Router: Module could not be initialized. Aborting!');
        }

        return collectionRequire;
    }

    async _initializeModules(modulesArray: Array<string>): Promise<TModulesTable> {
        let modulesTable: TModulesTable = {};

        if(typeof modulesArray !== 'object'
        || modulesArray === null) {
            return modulesTable;
        }

        const modulesArraySize: number = modulesArray.length;
        for(let i = 0; i < modulesArraySize; i++) {
            const module: string = modulesArray[i];

            const moduleRequire: Function|null = await this._initializeModule(module);

            if(moduleRequire !== null) {
                modulesTable[module] = moduleRequire;
            }
        }

        return modulesTable;
    }

    async _initializeModule(module: string): Promise<Function|null> {
        const prefix = process.env.SERVICE_PREFIX || 'paperframe';

        if(module.length === Common.EMPTY) {
            this.logger.debug('Router: Not initializing module, because it is empty.');
            return null;
        }

        this.logger.debug('Router: Initializing module %s ...', module);

        let moduleRequire = this.loadExtension(
            path.join(this._dirname, 'Modules', upperFirst(module)),
            (prefix + '-module-' + module)
        );

        if(typeof moduleRequire === 'undefined'
        || moduleRequire === null) {
            throw new Error('Router: Module could not be initialized. Aborting!');
        }

        return moduleRequire;
    }

    async _initializeControllers(controllersArray: Array<Function>): Promise<TControllersTable> {
        let controllersTable: TControllersTable = {};

        if(typeof controllersArray !== 'object'
        || controllersArray === null) {
            return controllersTable;
        }

        const controllersArraySize: number = controllersArray.length;
        for(let i = 0; i < controllersArraySize; i++) {
            const ControllerClass: Function = controllersArray[i];
            controllersTable[ControllerClass.resource] = await this._initializeController(ControllerClass);
        }

        return controllersTable;
    }

    async _initializeController(ControllerClass: Function): Promise<TControllersTableEntry> {
        let serviceProviders: TServiceProvidersTable = {};

        if(typeof ControllerClass.dependencies !== 'undefined' && ControllerClass.dependencies !== null) {
            this.logger.debug('Router: Initializing dependencies for controller ...');
            serviceProviders = await this._getDependencies(ControllerClass.dependencies);
        }

        if(typeof ControllerClass.resource !== 'string') {
            throw new Error('Router: Controller does not provide a resource name. Aborting!');
        }

        if(typeof ControllerClass.route !== 'string') {
            throw new Error('Router: Controller does not provide a route. Aborting!');
        }

        const controllerConfig: TControllerConfig = {
            'dependencies': serviceProviders,
            'collections': this._collections
        };

        const controllerInstance: Controller = new ControllerClass(controllerConfig);
        controllerInstance.logger = this.logger;

        // Check for and attach event handler
        if(typeof controllerInstance.eventListener === 'string'
        && typeof controllerInstance.onEvent === 'function') {
            this._ee.on(controllerInstance.eventListener, function(eventPackage: TEventPackage) {
                // eslint-disable-next-line no-invalid-this
                return controllerInstance.onEvent(this.event, eventPackage);
            });
        }


        const controllerTableEntry: TControllersTableEntry = {
            'route': ControllerClass.route,
            'instance': controllerInstance
        };

        return controllerTableEntry;
    }

    async _getDependencies(dependenciesArray: Array<string>): Promise<TServiceProvidersTable> {
        let serviceProvidersTable: TServiceProvidersTable = {};

        if(typeof dependenciesArray !== 'object'
        || dependenciesArray === null) {
            return serviceProvidersTable;
        }

        const dependenciesArraySize: number = dependenciesArray.length;
        for(let i = 0; i < dependenciesArraySize; i++) {
            const dependency: string = dependenciesArray[i];

            if(this._serviceProviders.hasOwnProperty(dependency) === false) {
                this._serviceProviders[dependency] = await this._getDependency(dependency);
            }

            serviceProvidersTable[dependency] = this._serviceProviders[dependency];
        }

        return serviceProvidersTable;
    }

    async _getDependency(dependency: string): Promise<Function> {
        const prefix = process.env.SERVICE_PREFIX || 'paperframe';

        this.logger.debug('Router: Initializing new dependency %s ...', dependency);
        let ServiceProviderRequire = this.loadExtensionFallback(
            path.join(this._dirname, 'ServiceProviders', upperFirst(dependency)),
            path.join(__dirname, 'ServiceProviders', upperFirst(dependency)),
            (prefix + '-serviceprovider-' + dependency)
        );

        if(typeof ServiceProviderRequire === 'undefined'
        || ServiceProviderRequire === null) {
            throw new Error('Router: Service Provider could not be loaded. Aborting!');
        }

        const serviceProvider = new ServiceProviderRequire();
        serviceProvider.logger = this.logger;
        serviceProvider.ee = this._ee;

        if(typeof serviceProvider.initialize === 'function') {
            await serviceProvider.initialize();
        }

        return serviceProvider;
    }

    async _initializeRoutes(controllersTable: TControllersTable): Promise<boolean> {

        if(typeof controllersTable !== 'object'
        || controllersTable === null) {
            return false;
        }

        const controllersTableKeys: Array<string> = Object.keys(controllersTable);
        const controllersTableKeysSize: number = controllersTableKeys.length;
        for(let i = 0; i < controllersTableKeysSize; i++) {
            const controllerResource: string = controllersTableKeys[i];
            const controllerTableEntry: TControllersTableEntry = controllersTable[controllerResource];

            const routingTable: TRoutingTable = this.routingTable(controllerResource);
            const routingTableSize: number = routingTable.length;

            for(let j = 0; j < routingTableSize; j++) {
                const routingEntry: TRoutingTableEntry = routingTable[j];
                const success: boolean = await this._initializeRoute(controllerResource, controllerTableEntry, routingEntry);
            }
        }

        return true;
    }

    async _initializeRoute(controllerResource: string, controllerTableEntry: TControllersTableEntry, routingEntry: TRoutingTableEntry): Promise<boolean> {
        const controllerRoute: string = controllerTableEntry.route;
        const controllerInstance: Controller = controllerTableEntry.instance;

        // @flowIgnore indexer propery
        const beforeHandler: Function = controllerInstance['before' + capitalize(routingEntry.name)];

        // @flowIgnore indexer propery
        const handler: Function = controllerInstance[routingEntry.name];

        if(typeof handler === 'function') {
            const routeName = routingEntry.name;
            const routeAction = routingEntry.action;
            const routeResource = controllerResource;
            const routeUri = (controllerRoute + routingEntry.route);
            this.logger.debug('Router: Initializing %s handler for route %s at %s ...', routeName, controllerResource, routeUri);

            const routeParamsRegex = /\:([a-zA-Z]+)/g;

            let routeParamsMatch = null;

            while((routeParamsMatch = routeParamsRegex.exec(routeUri)) !== null) {
                routeParamsRegex.lastIndex = this._processRouteParamsMatch(routeParamsMatch, routeParamsRegex);
            }

            const routeAcl = this._getRouteAcl(routeName, controllerInstance);

            // @flowIgnore access on computed type.
            this._router[routeAction](routeResource, routeUri, async (ctx, next) => {
                return this._handleRequest(handler, controllerInstance, beforeHandler, ctx, next, routeAcl, routeName, routeResource, routeAction, routeUri);
            });
        }

        return true;
    }

    _processRouteParamsMatch(routeParamsMatch: Object|null, routeParamsRegex: RegExp): number {
        let activeRouteParams = [];
        const matchOfParamNameIndex = 1;
        const matchNotFound = -1;
        let returnIndex: number = routeParamsRegex.lastIndex;

        this.logger.debug('Router: Found route parameter %j ...', routeParamsMatch);
        // @flowIgnore because we check this within the while() statement
        if(routeParamsMatch.index === routeParamsRegex.lastIndex) {
            returnIndex++;
        }

        if(routeParamsMatch !== null && routeParamsMatch.length > [].length) {
            const prefixlessMatch = routeParamsMatch[matchOfParamNameIndex];
            if(indexOf(activeRouteParams, prefixlessMatch) === matchNotFound) {
                activeRouteParams.push(prefixlessMatch);
                this._router.param(prefixlessMatch, (value, ctx, next) => {
                    if(typeof ctx.parameters !== 'object' || ctx.parameters === null) {
                        ctx.parameters = {};
                    }

                    ctx.parameters[prefixlessMatch] = value;
                    return next();
                });
            }
        }

        return returnIndex;
    }

    _getRouteAcl(routeName: string, controllerInstance: Controller): Object {
        let routeAcl = { 'protected': false };

        if(controllerInstance.hasOwnProperty('routeAcl') === true
        && controllerInstance.routeAcl.hasOwnProperty(routeName) === true) {
            routeAcl = controllerInstance.routeAcl[routeName];
        }

        return routeAcl;
    }

    async _handleRequest(handler: Function, controllerInstance: Controller, beforeHandler: Function, ctx: Object, next: any, routeAcl: Object, routeName: string, routeResource: string, routeAction: string, routeUri: string): Promise<boolean> {
        if(await this._requestHasRequiredHeaders(ctx, routeAcl) === false) {
            return false;
        }

        const eventSource = 'API';
        const eventResource = routeResource.toUpperCase();
        const eventName = routeName.toUpperCase();
        const eventId = eventSource + '.' + eventResource + '.' + eventName;

        controllerInstance.ctx = ctx;
        controllerInstance.next = next;
        controllerInstance.ee = this._ee;
        controllerInstance.eventId = eventId;
        this.logger.debug('Router: %s ("%s") calling %s (%s) on %s ...', controllerInstance.remoteAddress, controllerInstance.remoteUserAgent, routeName, routeAction, routeUri);

        let controllerParams: TControllerParams = {
            'session': controllerInstance.session,
            'before': null,
            'parameters': ctx.parameters,
            'query': ctx.query,
            'headers': ctx.request.header,
            'body': controllerInstance.body
        };

        this.logger.debug('Router: Passing the following controller parameters: %j', controllerParams);

        // Do we have a before*-handler?
        if(typeof beforeHandler === 'function') {
            try {
                this.logger.debug('Router: Awaiting beforeHandler and overwriting controller parameters ...');
                controllerParams = await beforeHandler.bind(controllerInstance)(controllerParams);
            } catch(err) {
                this.logger.error(err);
                return false;
            }
        }

        try {
            let controllerReturn = await handler.bind(controllerInstance)(controllerParams);

            const eventData: TEventDataTable = controllerInstance.readEventData();
            await controllerInstance.emitEventData(eventData);
        } catch(err) {
            this.logger.error(err);
            return false;
        }

        return true;
    }

    async _requestHasRequiredHeaders(ctx: Object, routeAcl: Object): Promise<boolean> {
        const xClientPrefix = `x-${process.env.SERVICE_PREFIX || 'paperframe'}-client`;
        if((ctx.request.header.hasOwnProperty(xClientPrefix) === false
        || ctx.request.header.hasOwnProperty(`${xClientPrefix}-version`) === false
        || ctx.request.header.hasOwnProperty(`${xClientPrefix}-api-version`) === false)
        && (typeof routeAcl === 'undefined' || routeAcl.protected === true)) {
            const errorMessage = `Client did not send required ${xClientPrefix} / ${xClientPrefix}-version / ${xClientPrefix}-api-version headers.`;
            this.logger.error('Router: %s', errorMessage);
            ctx.status = HttpStatus.BAD_REQUEST;
            ctx.body = errorMessage;
            return false;
        }

        return true;
    }

    routesAcl(): Object {
        let acls: Object = {};

        forEach(this._controllers, (controllerTableEntry, route) => {
            const controller = controllerTableEntry.instance;
            if(typeof controller.routeAcl !== 'undefined'
            && controller.routeAcl !== null) {
                acls[route] = controller.routeAcl;
            }
        });

        return acls;
    }

    authorizationErrorHandler(): Function {
        return (ctx, next) => {
            return next().catch((err) => {
                if (HttpStatus.UNAUTHORIZED === err.status) {
                    let resp = {
                        'code': Common.RS_TOKEN_INVALID,
                        'response': 'Invalid token',
                        'timestamp': Math.floor(new Date() / Common.MILLISECONDS_PER_SECOND)
                    };

                    ctx.status = HttpStatus.UNAUTHORIZED;
                    ctx.body = resp;
                } else {
                    throw err;
                }
            });
        };
    }

    authorization(routesAcl: Object): Function {
        return async (ctx, next) => {
            if(this._authorizationHasJwt() === false) {
                return next();
            }

            const url = ctx.url;
            const matchedPaths = this._authorizationGetMatchedPaths(url);

            if(matchedPaths === null) {
                return next();
            }

            const requestMethod = ctx.request.method;
            const { requestRoute, requestResource } = this._authorizationReqRouteRes(requestMethod, matchedPaths);

            if(requestRoute === null) {
                return next();
            }

            const httpMethod: string = ctx.method.toLowerCase();
            const firstElement: number = 0;
            const methods = this._authorizationGetMethods(httpMethod, requestRoute, requestResource);
            const method = methods[firstElement].name;

            if(routesAcl.hasOwnProperty(requestResource)
            && routesAcl[requestResource].hasOwnProperty(method)
            && routesAcl[requestResource][method].protected === false) {
                return next();
            }

            // @flowIgnore because flow doesn't seem to notice the undefined/null check at the beginning.
            return this._jwt({ secret: this._jwtSecret })(ctx, next);
        };
    }

    _authorizationHasJwt(): boolean {
        if(typeof this._jwt === 'undefined'
        || this._jwt === null) {
            return false;
        }

        return true;
    }

    _authorizationGetMatchedPaths(fromUrl: string): Array<Object>|null {
        const matchedPaths = this._router.match(fromUrl).path;

        if(typeof matchedPaths === 'undefined'
        || matchedPaths === null
        || matchedPaths.length === [].length) {
            return null;
        }

        return matchedPaths;
    }

    _authorizationReqRouteRes(requestMethod: string, matchedPaths: Array<Object>): Object {
        let requestRoute: string|null = null;
        let requestResource: string|null;
        const methodNotFound = -1;
        forEach(matchedPaths, matchedPath => {
            if(indexOf(matchedPath.methods, requestMethod) !== methodNotFound) {
                requestRoute = matchedPath.path;
                requestResource = matchedPath.name;
                return false;
            }

            return true;
        });

        return {
            'requestRoute': requestRoute,
            'requestResource': requestResource
        };
    }

    _authorizationGetMethods(httpMethod: string, requestRoute: string, requestResource: string): Array<Object> {
        return this.routingTable(requestResource).filter((entry: TRoutingTableEntry) => {
            if(entry.action === httpMethod
            && endsWith(requestRoute, entry.route)) {
                return true;
            }

            return false;
        });
    }

    routes() {
        return this._router.routes();
    }
};
