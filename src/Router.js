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
} from './Types/Controller.t';

import type {
    EventDataTable,
    EventPackage
} from './Types/Event.t';

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

    constructor(options: Object) {
        super();

        // --- BEGIN CHECKLIST ---

        // [x] Check for options
        if(typeof options === 'undefined' || options === null) {
            throw new Error('Router: No options specified.');
        }

        // [x] Check for router
        if(options.hasOwnProperty('koaRouter') === false) {
            throw new Error('Router: No KOA router given.');
        }

        // eslint-disable-next-line new-cap
        this._router = new options.koaRouter();

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

        // [x] Check for logger
        // TODO: Implement console fallback?
        if(options.hasOwnProperty('logger') === false) {
            throw new Error('Router: No logger given.');
        }

        this.logger = options.logger;

        // [x] Check for dirname
        if(options.hasOwnProperty('dirname') === false) {
            this._dirname = process.env.SERVICE_DIRNAME || __dirname;
        } else {
            this._dirname = options.dirname;
        }

        // [x] Set up event emitter
        this._ee = new EventEmitter({
            'wildcard': true,
            'newListener': false,
            'maxListeners': 512,
            'verboseMemoryLeak': true
        });

        // [x] Initialize modules, controllers and service providers
        this._modules = {};
        this._controllers = {};
        this._serviceProviders = {};
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
                path.join(this._dirname, 'Collections', capitalize(collection)),
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
                path.join(this._dirname, 'Modules', capitalize(module)),
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
            if(!this._serviceProviders.hasOwnProperty(dependency)) {
                this.logger.debug('Router: Initializing new dependency %s ...', dependency);
                let ServiceProviderRequire = this.loadExtensionFallback(
                    path.join(this._dirname, 'ServiceProviders', capitalize(dependency)),
                    path.join(__dirname, 'ServiceProviders', capitalize(dependency)),
                    (prefix + '-serviceprovider-' + dependency)
                );

                if(typeof ServiceProviderRequire === 'undefined'
                || ServiceProviderRequire === null) {
                    throw new Error('Router: Service Provider could not be loaded. Aborting!');
                }

                const serviceProvider = new ServiceProviderRequire();
                serviceProvider.logger = this.logger;

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
                const beforeHandler: Promise<any> = controllerInstance['before' + capitalize(routingEntry.name)];
                const handler: Promise<any> = controllerInstance[routingEntry.name];

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

                    const routeAcl = controllerInstance.routeAcl[routeName];

                    // @flowIgnore access on computed type.
                    this._router[routeAction](routeResource, routeUri, async (ctx, next) => {
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

                        controllerInstance.ctx = ctx;
                        controllerInstance.next = next;
                        this.logger.debug('Router: %s ("%s") calling %s (%s) on %s ...', controllerInstance.remoteAddress, controllerInstance.remoteUserAgent, routeName, routeAction, routeUri);

                        let controllerParams: ControllerParams = {
                            'session': controllerInstance.session,
                            'before': null,
                            'parameters': ctx.parameters,
                            'query': ctx.query,
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

                            const eventSource = 'API';
                            const eventResource = routeResource.toUpperCase();
                            const eventName = routeName.toUpperCase();

                            const eventId = eventSource + '.' + eventResource + '.' + eventName;
                            const eventPackage: EventPackage = {
                                'data': controllerInstance.readEventData(),
                                'timestamp': new Date()
                            };

                            this._ee.emit(eventId, eventPackage);
                        } catch(err) {
                            this.logger.error(err);
                            return false;
                        }

                        return true;
                    });
                }
            });
        });

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
            if(typeof this._jwt === 'undefined'
            || this._jwt === null) {
                return next();
            }

            const url = ctx.url;
            const requestMethod = ctx.request.method;
            const matchedPaths = this._router.match(url).path;

            if(typeof matchedPaths === 'undefined'
            || matchedPaths === null
            || matchedPaths.length === [].length) {
                return next();
            }

            let requestRoute: ?string = null;
            let requestResource: ?string;
            const methodNotFound = -1;
            forEach(matchedPaths, matchedPath => {
                if(indexOf(matchedPath.methods, requestMethod) !== methodNotFound) {
                    requestRoute = matchedPath.path;
                    requestResource = matchedPath.name;
                    return false;
                }

                return true;
            });

            if(requestRoute === null) {
                return next();
            }

            const httpMethod: string = ctx.method.toLowerCase();
            const firstElement: number = 0;
            const method = this.routingTable(requestResource).filter((entry: RoutingTableEntry) => {
                if(entry.action === httpMethod
                && endsWith(requestRoute, entry.route)) {
                    return true;
                }

                return false;
            })[firstElement].name;

            if(routesAcl.hasOwnProperty(requestResource)
            && routesAcl[requestResource].hasOwnProperty(method)
            && routesAcl[requestResource][method].protected === false) {
                return next();
            }

            // @flowIgnore because flow doesn't seem to notice the undefined/null check at the beginning.
            return this._jwt({ secret: this._jwtSecret })(ctx, next);
        };
    }

    routes() {
        return this._router.routes();
    }
};
