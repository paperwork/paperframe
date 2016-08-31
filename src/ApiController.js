'use strict';

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
class ApiController {
    /**
     * Initialize Controller.
     *
     * @method     constructor
     * @param      {object}   config  The controller configuration.
     */
    constructor(config) {
        this._config = config;
    }

    /**
     * Get the logger instance.
     *
     * @return     {object}  The instance.
     */
    get log() {
        return this._config.logger;
    }

    /**
     * Implement default beforeIndex (GET /) handler.
     *
     * @method     beforeIndex
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @return     {Promise}  Promise that fulfills with NULL response.
     */
    beforeIndex(headers) {
        return new Promise((fulfill, reject) => {
            fulfill(null);
        });
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
     * Implement default before create (POST /) handler.
     *
     * @method     beforeCreate
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {object}   data     The body data.
     * @return     {Promise}  Promise that fulfills with NULL response.
     */
    beforeCreate(headers, data) {
        return new Promise((fulfill, reject) => {
            fulfill(null);
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
     * Implement default before show (GET /:id) handler.
     *
     * @method     beforeShow
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {string}   id       The ressource ID.
     * @return     {Promise}  Promise that fulfills with NULL response.
     */
    beforeShow(headers, id) {
        return new Promise((fulfill, reject) => {
            fulfill(null);
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
     * Implement default before update (PUT /:id) handler.
     *
     * @method     beforeUpdate
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {string}   id       The ressource ID.
     * @param      {object}   data     The body data.
     * @return     {Promise}  Promise that fulfills with NULL response.
     */
    beforeUpdate(headers, id, data) {
        return new Promise((fulfill, reject) => {
            fulfill(null);
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
     * Implement default before destroy (DELETE /:id) handler.
     *
     * @method     beforeDestroy
     * @param      {object}   headers  The ExpressJS req & res, packed into the "request" and "response" attributes of headers object.
     * @param      {string}   id       The ressource ID.
     * @return     {Promise}  Promise that fulfills with NULL response.
     */
    beforeDestroy(headers, id) {
        return new Promise((fulfill, reject) => {
            fulfill(null);
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

    /**
     * Build generic response object.
     *
     * @method     response
     * @param      {number}   code     Response HTTP code.
     * @param      {number}   status   Response internal status code.
     * @param      {object}   content  Content object.
     * @return     {object}   The response
     */
    response(code, status, content) {
        const millisecondsPerSecond = 1000;
        const defaultStatus = 0;
        let response = {
            'code': code || HTTP_CODE_OK,
            'status': status || defaultStatus,
            'content': content || {},
            'timestamp': Math.floor(new Date() / millisecondsPerSecond)
        };

        if(typeof code === 'object') {
            if(typeof code.code !== 'undefined') {
                response.code = code.code;
            } else {
                response.code = HTTP_CODE_OK;
            }

            if(typeof code.status !== 'undefined') {
                response.status = code.status;
            } else {
                response.status = 0;
            }

            if(typeof code.content !== 'undefined') {
                response.content = code.content;
            } else if(typeof code.message !== 'undefined') {
                response.content = code.message;
            } else {
                response.content = {};
            }
        }

        return response;
    }

}

export default ApiController;
