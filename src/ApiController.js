'use strict';

import Controller from './Controller';
import bodyParser from 'body-parser';
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
 * ApiController class.
 */
class ApiController extends Controller {
    /**
     * Initialize ApiController.
     *
     * @method     constructor
     * @param      {object}   config  The controller configuration.
     */
    constructor(config) {
        super(config);
        this._parser = bodyParser.json(config.bodyParser);

        let routes = [
            { name: 'index',   action: 'get',    url: '/'    }, // GET => INDEX
            { name: 'create',  action: 'post',   url: '/'    }, // POST => CREATE
            { name: 'show',    action: 'get',    url: '/:id' }, // GET:id => SHOW:id
            { name: 'update',  action: 'put',    url: '/:id' }, // PUT => UPDATE
            { name: 'destroy', action: 'delete', url: '/:id' }  // DELETE => DESTROY
        ];

        _.forEach(routes, route => {
            this._router[route.action](route.url, this._parser, (req, res) => {
                let params = this.getRouteParamsArray(route.name, req, res);

                return this[route.name].apply(this, params)
                .then(responseRaw => {
                    return this.response(HTTP_CODE_OK, responseRaw);
                }, rejectionRaw => {
                    return this.response((rejectionRaw.code ? rejectionRaw.code : HTTP_CODE_BAD_REQUEST), (rejectionRaw.message ? rejectionRaw.message : rejectionRaw));
                })
                .then(responseBrewed => {
                    return res.status(responseBrewed.code).send(responseBrewed);
                })
                .catch(responseError => {
                    return this.response(HTTP_CODE_INTERNAL_SERVER_ERROR, responseError)
                    .then(responseErrorBrewed => {
                        return res.status(HTTP_CODE_INTERNAL_SERVER_ERROR).send(responseErrorBrewed);
                    });
                });
            });
        });
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

        params.push({
            'request': req,
            'response': res,
            'session': (req.user ? req.user : {})
        });

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
            console.warn('Unhanled route name %s!', routeName);
            break;
        }

        return params;
    }

    /**
     * Implement default index (GET /) handler.
     *
     * @method     index
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @return     {Promise}  Promise that rejects with "Not implemented" response.
     */
    index(headers) {
        return new Promise((fulfill, reject) => {
            reject(GR_NOT_IMPLEMENTED);
        });
    }

    /**
     * Implement default create (POST /) handler.
     *
     * @method     create
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {object}   data     The body data.
     * @return     {Promise}  Promise that rejects with "Not implemented" response.
     */
    create(headers, data) {
        return new Promise((fulfill, reject) => {
            reject(GR_NOT_IMPLEMENTED);
        });
    }

    /**
     * Implement default show (GET /:id) handler.
     *
     * @method     show
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {string}   id       The ressource ID.
     * @return     {Promise}  Promise that rejects with "Not implemented" response.
     */
    show(headers, id) {
        return new Promise((fulfill, reject) => {
            reject(GR_NOT_IMPLEMENTED);
        });
    }

    /**
     * Implement default update (PUT /:id) handler.
     *
     * @method     update
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {string}   id       The ressource ID.
     * @param      {object}   data     The body data.
     * @return     {Promise}  Promise that rejects with "Not implemented" response.
     */
    update(headers, id, data) {
        return new Promise((fulfill, reject) => {
            reject(GR_NOT_IMPLEMENTED);
        });
    }

    /**
     * Implement default destroy (DELETE /:id) handler.
     *
     * @method     destroy
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {string}   id       The ressource ID.
     * @return     {Promise}  Promise that rejects with "Not implemented" response.
     */
    destroy(headers, id) {
        return new Promise((fulfill, reject) => {
            reject(GR_NOT_IMPLEMENTED);
        });
    }
}

export default ApiController;
