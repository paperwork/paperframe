'use strict';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

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

        this._app = express();

        this._app.use(cors());

        this._app.use(morgan('dev'));

        this._services = [];

        this._apiBasePath = config.apiBasePath;
        this._servicesBasePath = config.servicesBasePath;

        this._controllers = this.initializeApiRouter();
    }

    /**
     * Get the httpServer instance.
     *
     * @return     {object}  The expressJS app object.
     */
    get httpServer() {
        return this._app;
    }

    /**
     * Initialize the ApiRouter (API endpoints) by checking the sub-folders of the /api/ folder for *Controller.js files and requiring these.
     *
     * @method     initializeApiRouter
     * @return     {Array}  Array of controller instances for every API endpoint available
     */
    initializeApiRouter() {
        let controllers = [];

        this.loader(this._apiBasePath, 'Controller', null, (controllerName, controllerRequire) => {
            let ControllerImport = controllerRequire.default;
            let controllerServiceDependencies = controllerRequire.serviceDependencies;
            let controllerConfig = {
                'app': this._app,
                'bodyParser': this._config.bodyParser
            };

            if(controllerServiceDependencies) {
                controllerServiceDependencies.forEach((service) => {
                    if(this._services[service]) {
                        console.log('Service depencency [%s] for API endpoint already loaded.\n', service);
                    } else {
                        console.log('Loading service depencency [%s] for API endpoint ...', service);
                        this.loader(this._servicesBasePath, 'Service', service, (serviceName, serviceRequire) => {
                            let ServiceImport = serviceRequire.default;

                            console.log('Initializing new service [%s] ...', service);
                            try {
                                this._services[service] = new ServiceImport({ 'app': this._app });
                                console.log('Done initializing [%s]!\n', service);
                            } catch(err) {
                                console.log('Error initializing [%s]!\n', service);
                                throw new Error(err);
                            }
                        });
                    }

                    // Add loaded dependency to controllerConfig
                    controllerConfig[service.toLowerCase()] = this._services[service];
                });
            }
            console.log('Initializing new controller for [%s] ...', controllerName);
            try {
                controllers[controllerName] = new ControllerImport(controllerConfig);
            } catch(err) {
                console.log('Error initializing [%s]!\n', controllerName);
                throw new Error(err);
            }
            console.log('Done initializing [%s]!\n', controllerName);
        });

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
        console.log('\n[Loader: %s]', suffix);
        console.log('Firing up [%s] loader using %s as root directory ...', suffix, basepath);
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

                console.log('Checking %s(/%s) ...', directory, moduleFile);

                try {
                    fs.statSync(moduleUri).isFile();

                    console.log('Requiring %s ...\n', moduleRequireFile);

                    moduleRequire = require(moduleRequireFile);
                } catch(err) {
                    console.log('Not requiring %s as it does not implement a %s.', moduleName, suffix);
                    console.log('=> Debug:');
                    console.log(err);
                    console.log('\n');
                }

                _callback(moduleName, moduleRequire);
            });

            return true;
        } catch(err) {
            throw new Error(err);
            return false;
        }
    }
}

export default ApiRouter;
