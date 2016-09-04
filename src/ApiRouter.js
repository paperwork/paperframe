'use strict';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { capitalize as __capitalize } from 'lodash';
const _ = {
    'capitalize': __capitalize
};


/**
 * HTTP status code imports.
 */
import {
    HTTP_CODE_CONTINUE,
    HTTP_CODE_OK,
    HTTP_CODE_BAD_REQUEST,
    HTTP_CODE_UNAUTHORIZED,
    HTTP_CODE_INTERNAL_SERVER_ERROR,
    HTTP_CODE_MULTIPLE_CHOICES,
    HTTP_CODE_PERMANENT_REDIRECT
} from './HttpStatusCodes';

/**
 * Main routing class.
 */
class ApiRouter {
    /**
     * Initialize the router.
     *
     * @method     constructor
     * @param      {object}  config    The config object.
     */
    constructor(config) {
        this._config = config;
        this._apiBasePath = config.apiBasePath;
        this._servicesBasePath = config.servicesBasePath;
        this._loaderControllerParameters = config.loaderControllerParameters || {};
        this._loaderControllerSuffix = config.loaderControllerSuffix || 'Controller';
        this._loaderServiceParameters = config.loaderServiceParameters || {};
        this._loaderServiceSuffix = config.loaderServiceSuffix || 'Service';
        this._requestHeadersPreprocessor = config.requestHeadersPreprocessor || null;
        this._logger = config.logger || {
            'trace': this.pseudoLogger,
            'debug': this.pseudoLogger,
            'info': this.pseudoLogger,
            'warn': this.pseudoLogger,
            'error': this.pseudoLogger,
            'fatal': this.pseudoLogger
        };

        this._router = express();
        this._router.use(cors());
        this._router.use(morgan('dev'));
        this._router.use((err, req, res, next) => {
            if (err.name === 'UnauthorizedError') {
                return this.routeReturnReject(res, {
                    'code': HTTP_CODE_UNAUTHORIZED,
                    'content': err
                });
            }
            return this.routeReturnReject(res, {
                'code': HTTP_CODE_INTERNAL_SERVER_ERROR,
                'content': err
            });
        });

        this._services = [];

        this.initializeControllers();
        this.initializeRoutes();
    }

    /**
     * Pseudo logger, if bunyan is not available.
     *
     * @return     {boolean}  True.
     */
    pseudoLogger() {
        const logger = console;
        return logger.log.apply(logger, arguments);
    }

    /**
     * Get the logger instance.
     *
     * @return     {object}  The logger instance.
     */
    get log() {
        return this._logger;
    }

    /**
     * Get the httpServer instance.
     *
     * @return     {object}  The expressJS app object.
     */
    get httpServer() {
        return this._router;
    }

    /**
     * Get the routing table.
     *
     * @return     {Array}  The routing table.
     */
    get routingTable() {
        return [
            { name: 'index',   action: 'get',    url: '/'    }, // GET => INDEX
            { name: 'create',  action: 'post',   url: '/'    }, // POST => CREATE
            { name: 'show',    action: 'get',    url: '/:id' }, // GET:id => SHOW:id
            { name: 'update',  action: 'put',    url: '/:id' }, // PUT => UPDATE
            { name: 'destroy', action: 'delete', url: '/:id' }  // DELETE => DESTROY
        ];
    }

    /**
     * Initialize the controllers (API endpoints) by checking the sub-folders of the /api/ folder for *Controller.js files and requiring these.
     *
     * @return     {Array}  Array of controller instances for every API endpoint available
     */
    initializeControllers() {
        let controllers = {};

        this.loader(this._apiBasePath, this._loaderControllerSuffix, null, (controllerName, controllerRequire) => {
            const ControllerImport = controllerRequire.default;
            const controllerServiceDependencies = controllerRequire.serviceDependencies;
            const controllerRequestBodyProcessor = controllerRequire.requestBodyProcessor;
            const controllerRoute = controllerRequire.route;
            let controllerConfig = {
                'services': {}
            };

            if(controllerServiceDependencies) {
                controllerServiceDependencies.forEach((service) => {
                    if(this._services[service]) {
                        this.log.debug('Service depencency [%s] for API endpoint already loaded.', service);
                    } else {
                        this.log.debug('Loading service depencency [%s] for API endpoint ...', service);
                        this.loader(this._servicesBasePath, this._loaderServiceSuffix, service, (serviceName, serviceRequire) => {
                            let ServiceImport = serviceRequire.default;

                            this.log.debug('Initializing new service [%s] ...', service);
                            try {
                                this._services[service] = new ServiceImport({
                                    'parameters': this._loaderServiceParameters,
                                    'router': this._router,
                                    'logger': this._logger
                                });
                                this.log.debug('Done initializing [%s]!', service);
                            } catch(err) {
                                this.log.debug('Error initializing [%s]!', service);
                                throw new Error(err);
                            }
                        });
                    }

                    // Add loaded dependency to controllerConfig
                    controllerConfig.services[service.toLowerCase()] = this._services[service];
                });
            }
            this.log.debug('Initializing new controller for [%s] ...', controllerName);
            try {
                controllerConfig.parameters = this._loaderControllerParameters;
                controllerConfig.logger = this._logger;

                controllers[controllerName] = {
                    'instance': new ControllerImport(controllerConfig),
                    'requestBodyProcessor': controllerRequestBodyProcessor,
                    'serviceDependencies': controllerServiceDependencies,
                    'route': controllerRoute
                };
            } catch(err) {
                this.log.debug('Error initializing [%s]!', controllerName);
                throw new Error(err);
            }
            this.log.debug('Done initializing [%s]!', controllerName);
        });

        this._controllers = controllers;
        return controllers;
    }

    /**
     * Loader for basically everything (controllers, services, etc.).
     *
     * @method     loader
     * @param      {string}    basepath     The root directory to be used for requiring modules
     * @param      {string}    suffix       Suffix for the desired modules (e.g. "Controller" or "Service")
     * @param      {object}    target       Target folder to look inside or null to browse through the whole basepath
     * @param      {function}  callback     Callback function for every module that can be acquired
     * @return     {boolean}   True or false, depending on the loader success.
     */
    loader(basepath, suffix, target, callback) {
        this.log.debug('[Loader: %s]', suffix);
        this.log.debug('Firing up [%s] loader using %s as root directory ...', suffix, basepath);
        try {
            let files = [];
            let _target = target;
            let _callback = callback;

            if(_target === null || typeof _target === 'function') {
                files = fs.readdirSync(basepath);
                if(typeof _target === 'function') {
                    _callback = _target;
                    _target = null;
                }
            } else {
                files = [_target];
            }

            files.map((file) => {
                return path.join(basepath, file);
            }).filter((file) => {
                return fs.statSync(file).isDirectory();
            }).forEach((directory) => {
                let moduleName = path.basename(directory);
                let moduleFile = moduleName + suffix + '.js';
                let moduleUri = path.join(directory, moduleFile);
                let moduleRequireFile = basepath + '/' + moduleName + '/' + path.basename(moduleFile, '.js');
                let moduleRequire = null;

                this.log.debug('Checking %s(/%s) ...', directory, moduleFile);

                try {
                    fs.statSync(moduleUri).isFile();

                    this.log.debug('Requiring %s ...', moduleRequireFile);

                    moduleRequire = require(moduleRequireFile);
                } catch(err) {
                    this.log.error('Not requiring %s as it does not implement a %s.', moduleName, suffix);
                    this.log.error('=> Debug:');
                    this.log.error(err);
                    this.log.error('');
                }

                _callback(moduleName, moduleRequire);
            });

            return true;
        } catch(err) {
            throw new Error(err);
            return false;
        }
    }

    /**
     * Initialize the router.
     *
     * @param      {object}  controllersObject The controllers object
     * @param      {object}  routerInstance    The router instance
     * @return     {boolean} True on success.
     */
    initializeRoutes(controllersObject, routerInstance) {
        let controllers = this._controllers;
        let router = this._router;

        if(typeof controllersObject !== 'undefined') {
            controllers = controllersObject;
        }

        if(typeof routerInstance !== 'undefined') {
            router = routerInstance;
        }

        Object.keys(controllers).forEach(controllerName => {
            const controller = controllers[controllerName];

            this.routingTable.forEach(route => {
                router[route.action](controller.route + route.url, controller.requestBodyProcessor, (req, res) => {
                    const controllerInstance = controller.instance;
                    const beforeRouteName = 'before' + _.capitalize(route.name);
                    let params = this.getRouteParamsArray(route.name, req, res);
                    const paramsHeadersIndex = 0;

                    controllerInstance[beforeRouteName].apply(controllerInstance, params).then(fulfillment => {
                        params[paramsHeadersIndex].before = fulfillment;
                        return true;
                    }, rejection => {
                        this.routeReturnReject(res, rejection);
                        return false;
                    }).then(success => {
                        if(success) {
                            return controllerInstance[route.name].apply(controllerInstance, params);
                        }
                        return { 'null': true };
                    }).then(fulfillment => {
                        if(typeof fulfillment !== 'undefined' && fulfillment.null !== true) {
                            return this.routeReturnFulfill(res, fulfillment);
                        }
                        return { 'null': true };
                    }, rejection => {
                        if(typeof rejection !== 'undefined' && rejection.null !== true) {
                            return this.routeReturnReject(res, rejection);
                        }
                        return { 'null': true };
                    }).catch(err => {
                        return this.routeReturnReject(res, err);
                    });
                });
            });
        });

        return true;
    }

    /**
     * Route fulfill return.
     *
     * @param      {object}  res          The response
     * @param      {object}  fulfillment  The fulfillment
     * @return     {boolean} The result
     */
    routeReturnFulfill(res, fulfillment) {
        let httpMethod = 'send';
        let httpCode = HTTP_CODE_OK;
        let httpBody = {};
        const defaultStatus = 0;

        if(typeof fulfillment !== 'undefined') {
            if(typeof fulfillment.redirect !== 'undefined'
            && fulfillment.code >= HTTP_CODE_MULTIPLE_CHOICES
            && fulfillment.code <= HTTP_CODE_PERMANENT_REDIRECT) {
                httpMethod = 'redirect';
            }

            if(fulfillment.code >= HTTP_CODE_CONTINUE) {
                httpCode = fulfillment.code;
            }

            if(typeof fulfillment.content !== 'undefined') {
                httpBody = {
                    'status': fulfillment.status || defaultStatus,
                    'content': fulfillment.content
                };
            }
        }

        return res[httpMethod](httpCode, httpBody);
    }

    /**
     * Route reject return.
     *
     * @param      {object}  res        The response
     * @param      {object}  rejection  The rejection
     * @return     {boolean} The result
     */
    routeReturnReject(res, rejection) {
        let httpMethod = 'send';
        let httpCode = HTTP_CODE_BAD_REQUEST;
        let httpBody = {};
        const defaultStatus = 0;

        if(typeof rejection !== 'undefined') {
            if(typeof rejection.code !== 'undefined' && rejection.code >= HTTP_CODE_CONTINUE) {
                httpCode = rejection.code;
            }

            if(typeof rejection.content === 'undefined') {
                httpBody = {
                    'status': defaultStatus,
                    'content': rejection
                };
            } else {
                httpBody = {
                    'status': rejection.status || defaultStatus,
                    'content': rejection.content
                };
            }
        }

        return res[httpMethod](httpCode, httpBody);
    }

    /**
     * Get the route params array.
     *
     * @param      {string}  routeName  The route name
     * @param      {object}  req        The req
     * @param      {object}  res        The res
     * @return     {Array}   The route params array.
     */
    getRouteParamsArray(routeName, req, res) {
        let params = [];
        let preprocessedHeaders = {};

        if(this._requestHeadersPreprocessor !== null) {
            preprocessedHeaders = this._requestHeadersPreprocessor(req);
        }

        params.push(Object.assign(preprocessedHeaders, {
            'request': req,
            'response': res,
            //'session': (req.user ? req.user : {})
        }));

        switch(routeName) {
        case 'index':
            break;
        case 'create':
            params.push(req.body);
            break;
        case 'show':
        case 'destroy':
            params.push(req.params.id);
            break;
        case 'update':
            params.push(req.params.id);
            params.push(req.body);
            break;
        default:
            this.log.warn('Unhanled route name %s!', routeName);
            break;
        }

        return params;
    }
}

export default ApiRouter;
