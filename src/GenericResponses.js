'use strict';

/**
 * HTTP status code imports.
 */
import {
    HTTP_CODE_UNAUTHORIZED,
    HTTP_CODE_NOT_FOUND,
    HTTP_CODE_CONFLICT,
    HTTP_CODE_INTERNAL_SERVER_ERROR
} from './HttpStatusCodes';

/**
 * GenericError class
 */
class GenericError extends Error {
    /**
     * Constructor
     *
     * @param     {object}  genericResponse GenericResponse
     */
    constructor(genericResponse) {
        super();
        this._genericResponse = genericResponse;
    }

    /**
     * Wrapper for .code
     *
     * @return     {integer}  The code
     */
    get code() {
        return this._genericResponse.code;
    }

    /**
     * Wrapper for .status
     *
     * @return     {integer}  The status
     */
    get status() {
        return this._genericResponse.status;
    }

    /**
     * Wrapper for .message
     *
     * @return     {string}  The message
     */
    get message() {
        return this._genericResponse.message;
    }

    /**
     * Wrapper for .name
     *
     * @return     {string}  The name
     */
    get name() {
        return 'GenericError';
    }

    /**
     * Wrapper for .stack
     *
     * @return     {string}  The stack
     */
    get stack() {
        return (new Error(this._genericResponse.message)).stack;
    }

    /**
     * Convert to JSON representation.
     *
     * @return     {object}  The JSON object.
     */
    toJSON() {
        return this._genericResponse;
    }
}
export { GenericError };

/**
 * Internal error.
 *
 * @type       {object}
 */
export const GR_INTERNAL_ERROR = { 'code': HTTP_CODE_INTERNAL_SERVER_ERROR, 'status': 0, 'message': 'Internal error.' };

/**
 * Not implemented.
 *
 * @type       {object}
 */
export const GR_NOT_IMPLEMENTED = { 'code': HTTP_CODE_INTERNAL_SERVER_ERROR, 'status': 0, 'message': 'Not implemented.' };

/**
 * Authentication, unauthorized.
 *
 * @type       {object}
 */
export const GR_AUTH_UNAUTHORIZED = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 0, 'message': 'Unauthorized.' };

/**
 * Authentication, password wrong.
 *
 * @type       {object}
 */
export const GR_AUTH_PASSWORD_WRONG = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 0, 'message': 'Password wrong.' };

/**
 * Authentication, credentials (either username or password or both) missing.
 *
 * @type       {object}
 */
export const GR_AUTH_CREDENTIALS_MISSING = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 0, 'message': 'Credentials missing.' };


/**
 * Authentication, username taken.
 *
 * @type       {object}
 */
export const GR_AUTH_USERNAME_TAKEN = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 0, 'message': 'Username already taken.' };

/**
 * Requested resource not found.
 *
 * @type       {object}
 */
export const GR_RESOURCE_NOT_FOUND = { 'code': HTTP_CODE_NOT_FOUND, 'status': 0, 'message': 'Requested resource not found.' };

/**
 * Identifier for resource already taken.
 *
 * @type       {object}
 */
export const GR_RESOURCE_ID_TAKEN = { 'code': HTTP_CODE_CONFLICT, 'status': 0, 'message': 'Identifier for resource already taken.' };
