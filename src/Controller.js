'use strict';

import { Router as expressRouter } from 'express';
import _ from 'lodash';

/**
 * HTTP status code imports.
 */
import {
    HTTP_CODE_OK,
    HTTP_CODE_BAD_REQUEST,
    HTTP_CODE_UNAUTHORIZED,
    HTTP_CODE_INTERNAL_SERVER_ERROR
} from './HttpStatusCodes';

/**
 * Generic responses imports.
 */
import {
    GR_NOT_IMPLEMENTED
} from './GenericResponses';

/**
 * Controller class.
 */
class Controller {
    /**
     * Initialize Controller.
     *
     * @method     constructor
     * @param      {object}   config  The controller configuration.
     */
    constructor(config) {
        this._router = expressRouter({ mergeParams: true });
        this._config = config;

        // Unauthorized Error handling for app
        this._config.app.use((err, req, res, next) => {
            if (err.name === 'UnauthorizedError') {
                this.response(HTTP_CODE_UNAUTHORIZED, err)
                .then(responseErrorBrewed => res.status(HTTP_CODE_UNAUTHORIZED).send(responseErrorBrewed));
            } else {
                this.response(HTTP_CODE_INTERNAL_SERVER_ERROR, err)
                .then(responseErrorBrewed => res.status(HTTP_CODE_INTERNAL_SERVER_ERROR).send(responseErrorBrewed));
            }
        });
    }

    /**
     * Get ExpressJS router from Controller.
     *
     * @method     router
     * @return     {object}  ExpressJS router object.
     */
    router() {
        return this._router;
    }

    /**
     * Get or set the route for the controller.
     *
     * @method     route
     * @param      {string}  routePath    New route to set for the controller.
     * @return     {string}  Current route of the controller.
     */
    route(routePath) {
        if(routePath) {
            this._route = routePath;
            this._config.app.use(this._route, this._router);
        }
        return this._route;
    }

    /**
     * Build generic response object.
     *
     * @method     response
     * @param      {number}   code    Response code.
     * @param      {object}   data    Data object.
     * @return     {Promise}  Promise that fulfills with response object.
     */
    response(code, data) {
        return new Promise((fulfill, reject) => {
            const millisecondsPerSecond = 1000;

            fulfill({
                code: code,
                data: data,
                timestamp: Math.floor(new Date() / millisecondsPerSecond)
            });
        });
    }
}

export default Controller;
