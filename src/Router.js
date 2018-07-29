//@flow

const fs = require('fs');
const path = require('path');
const EventEmitter = require('eventemitter2').EventEmitter2;

const Base = require('./Base');
const HttpStatus = require('http-status-codes');
const Common = require('./Common');

const capitalize = require('lodash').capitalize;
const upperFirst = require('lodash').upperFirst;
const forEach = require('lodash').forEach;
const merge = require('lodash').merge;
const indexOf = require('lodash').indexOf;
const endsWith = require('lodash').endsWith;

import type {
    ControllerConfig,
    ControllerParams
} from './Controller';

import type {
    EventDataTable,
    EventPackage
} from './Event';

type RoutingTableEntry = {
    name: string,
    action: string,
    route: string
};
type RoutingTable = Array<RoutingTableEntry>;

type CollectionsTable = {
    [key: string]: Function
};

type ModulesTable = {
    [key: string]: Function
};

type ControllerTableEntry = {
    route: string,
    instance: any
};

type ControllersTable = {
    [key: string]: ControllerTableEntry
};

type ServiceProvidersTable = {
    [key: string]: any
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
    _collections:               CollectionsTable
    _modules:                   ModulesTable
    _controllers:               ControllersTable
    _serviceProviders:          ServiceProvidersTable
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

    routingTable(resourceName: string = 'entity'): RoutingTable {
        return [
            { 'name': 'index',   'action': 'get',    'route': '/'                   }, // GET       => INDEX
            { 'name': 'create',  'action': 'post',   'route': '/'                   }, // POST      => CREATE
            { 'name': 'show',    'action': 'get',    'route': `/:${resourceName}Id` }, // GET:id    => SHOW:id
            { 'name': 'update',  'action': 'put',    'route': `/:${resourceName}Id` }, // PUT:id    => UPDATE:id
            { 'name': 'destroy', 'action': 'delete', 'route': `/:${resourceName}Id` }  // DELETE:id => DESTROY:id
        ];
    }

    initialize() {
        // Collections
        const serverCollections: ?string = process.env.SERVER_COLLECTIONS;

        if(typeof serverCollections === 'undefined' || serverCollections === null) {
            throw new Error('Router: No collections specified. Please set SERVER_COLLECTIONS correctly!');
        }

        const collectionsArray: Array<string> = serverCollections.split(',');

        this._collections = this._initializeCollections(collectionsArray);

        // Modules
        const serverModules: ?string = process.env.SERVER_MODULES;

        if(typeof serverModules === 'undefined' || serverModules === null) {
            throw new Error('Router: No modules specified. Please set SERVER_MODULES correctly!');
        }

        const modulesArray: Array<string> = serverModules.split(',');

        this._modules = this._initializeModules(modulesArray);

        forEach(this._modules, (moduleRequire, moduleName) => {
            if(!moduleRequire.hasOwnProperty('controllers') || !Array.isArray(moduleRequire.controllers)) {
                throw new Error('Router: Module does not contain controllers. Aborting!');
            }

            this.logger.debug('Router: Initializing controllers for module %s ...', moduleName);
            this._controllers = merge(this._controllers, this._initializeControllers(moduleRequire.controllers));
        });

        // Routes
        this._initializeRoutes(this._controllers);

        return true;
    }

    _initializeCollections(collectionsArray: Array<string>): CollectionsTable {
        const prefix = process.env.SERVICE_PREFIX || 'paperframe';
        let collectionsTable: CollectionsTable = {};

        forEach(collectionsArray, (collection: string) => {
            if(collection.length === Common.EMPTY) {
                this.logger.debug('Router: Not initializing collections, because there are none.');
                return false;
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

            collectionsTable[collection] = collectionRequire;

            return true;
        });

        return collectionsTable;
    }

    _initializeModules(modulesArray: Array<string>): ModulesTable {
        const prefix = process.env.SERVICE_PREFIX || 'paperframe';
        let modulesTable: ModulesTable = {};

        forEach(modulesArray, (module: string) => {
            if(module.length === Common.EMPTY) {
                this.logger.debug('Router: Not initializing modules, because there are none.');
                return false;
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

            modulesTable[module] = moduleRequire;

            return true;
        });

        return modulesTable;
    }

    _initializeControllers(controllersArray: Array<any>): ControllersTable {
        let controllersTable: ControllersTable = {};

        forEach(controllersArray, (Controller: any) => {
            let serviceProviders: ServiceProvidersTable = {};

            if(typeof Controller.dependencies !== 'undefined' && Controller.dependencies !== null) {
                this.logger.debug('Router: Initializing dependencies for controller ...');
                serviceProviders = this._getDependencies(Controller.dependencies);
            }

            if(typeof Controller.resource !== 'string') {
                throw new Error('Router: Controller does not provide a resource name. Aborting!');
            }

            if(typeof Controller.route !== 'string') {
                throw new Error('Router: Controller does not provide a route. Aborting!');
            }

            const controllerConfig: ControllerConfig = {
                'dependencies': serviceProviders,
                'collections': this._collections
            };

            const controllerInstance = new Controller(controllerConfig);
            controllerInstance.logger = this.logger;

            // Check for and attach event handler
            if(typeof controllerInstance.eventListener === 'string'
            && typeof controllerInstance.onEvent === 'function') {
                this._ee.on(controllerInstance.eventListener, function(eventPackage: EventPackage) {
                    // eslint-disable-next-line no-invalid-this
                    return controllerInstance.onEvent(this.event, eventPackage);
                });
            }

            controllersTable[Controller.resource] = {
                'route': Controller.route,
                'instance': controllerInstance
            };
        });

        return controllersTable;
    }

    _getDependencies(dependenciesArray: Array<string>): ServiceProvidersTable {
        const prefix = process.env.SERVICE_PREFIX || 'paperframe';
        let serviceProvidersTable: ServiceProvidersTable = {};

        forEach(dependenciesArray, (dependency: string) => {
            if(this._serviceProviders.hasOwnProperty(dependency) === false) {
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
                    serviceProvider.initialize();
                }

                this._serviceProviders[dependency] = serviceProvider;
            }

            serviceProvidersTable[dependency] = this._serviceProviders[dependency];
        });

        return serviceProvidersTable;
    }

    _initializeRoutes(controllersTable: ControllersTable) {
        let activeRouteParams = [];
        const matchNotFound = -1;
        const matchOfParamNameIndex = 1;

        forEach(controllersTable, (controllerTableEntry: ControllerTableEntry, controllerResource: string) => {
            forEach(this.routingTable(controllerResource), (routingEntry: RoutingTableEntry) => {
                const controllerRoute = controllerTableEntry.route;
                const controllerInstance = controllerTableEntry.instance;
                const beforeHandler: Function = controllerInstance['before' + capitalize(routingEntry.name)];
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
                        this.logger.debug('Router: Found route parameter %j ...', routeParamsMatch);
                        // @flowIgnore because we check this within the while() statement
                        if(routeParamsMatch.index === routeParamsRegex.lastIndex) {
                            routeParamsRegex.lastIndex++;
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
                    }

                    const routeAcl = this._getRouteAcl(routeName, controllerInstance);

                    // @flowIgnore access on computed type.
                    this._router[routeAction](routeResource, routeUri, async (ctx, next) => {
                        return this._handleRequest(handler, controllerInstance, beforeHandler, ctx, next, routeAcl, routeName, routeResource, routeAction, routeUri);
                    });
                }
            });
        });

        return true;
    }

    _getRouteAcl(routeName: string, controllerInstance: Function): Object {
        let routeAcl = { 'protected': false };

        if(controllerInstance.hasOwnProperty('routeAcl') === true
        && controllerInstance.routeAcl.hasOwnProperty(routeName) === true) {
            routeAcl = controllerInstance.routeAcl[routeName];
        }

        return routeAcl;
    }

    async _handleRequest(handler: Function, controllerInstance: Function, beforeHandler: Function, ctx: Object, next: any, routeAcl: Object, routeName: string, routeResource: string, routeAction: string, routeUri: string) {
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

        let controllerParams: ControllerParams = {
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

            const eventData: EventDataTable = controllerInstance.readEventData();
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
        return this.routingTable(requestResource).filter((entry: RoutingTableEntry) => {
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
