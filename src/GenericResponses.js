'use strict';

/**
 * HTTP status code imports.
 */
import {
    HTTP_CODE_NO_CONTENT,
    HTTP_CODE_UNAUTHORIZED,
    HTTP_CODE_FORBIDDEN,
    HTTP_CODE_NOT_FOUND,
    HTTP_CODE_INVALID_TOKEN,
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
 * OK, no content.
 *
 * @type       {object}
 */
export const GR_SUCCESS_NO_CONTENT = { 'code': HTTP_CODE_NO_CONTENT, 'status': 100, 'message': '' };

/**
 * Internal error.
 *
 * @type       {object}
 */
export const GR_INTERNAL_ERROR = { 'code': HTTP_CODE_INTERNAL_SERVER_ERROR, 'status': 200, 'message': 'Internal error.' };

/**
 * Not implemented.
 *
 * @type       {object}
 */
export const GR_NOT_IMPLEMENTED = { 'code': HTTP_CODE_INTERNAL_SERVER_ERROR, 'status': 400, 'message': 'Not implemented.' };

/**
 * Authentication, unauthorized.
 *
 * @type       {object}
 */
export const GR_AUTH_UNAUTHORIZED = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 600, 'message': 'Unauthorized.' };

/**
 * Authentication, password wrong.
 *
 * @type       {object}
 */
export const GR_AUTH_PASSWORD_WRONG = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 800, 'message': 'Password wrong.' };

/**
 * Authentication, credentials (either username or password or both) missing.
 *
 * @type       {object}
 */
export const GR_AUTH_CREDENTIALS_MISSING = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 1000, 'message': 'Credentials missing.' };

/**
 * Authentication, user not found.
 *
 * @type       {object}
 */
export const GR_AUTH_USER_NOT_FOUND = { 'code': HTTP_CODE_NOT_FOUND, 'status': 1200, 'message': 'Requested user not found.' };

/**
 * Authentication, token invalid.
 *
 * @type       {object}
 */
export const GR_AUTH_REFRESH_TOKEN_INVALID = { 'code': HTTP_CODE_INVALID_TOKEN, 'status': 1400, 'message': 'Refresh token invalid.' };

/**
 * Authentication, token expired.
 *
 * @type       {object}
 */
export const GR_AUTH_REFRESH_TOKEN_EXPIRED = { 'code': HTTP_CODE_INVALID_TOKEN, 'status': 1600, 'message': 'Refresh token expired.' };

/**
 * Authentication, username taken.
 *
 * @type       {object}
 */
export const GR_AUTH_USERNAME_TAKEN = { 'code': HTTP_CODE_UNAUTHORIZED, 'status': 1800, 'message': 'Username already taken.' };

/**
 * Request forbidden.
 *
 * @type       {object}
 */
export const GR_AUTH_FORBIDDEN = { 'code': HTTP_CODE_FORBIDDEN, 'status': 2000, 'message': 'Forbidden.' };

/**
 * Requested resource not found.
 *
 * @type       {object}
 */
export const GR_RESOURCE_NOT_FOUND = { 'code': HTTP_CODE_NOT_FOUND, 'status': 2200, 'message': 'Requested resource not found.' };

/**
 * Identifier for resource already taken.
 *
 * @type       {object}
 */
export const GR_RESOURCE_ID_TAKEN = { 'code': HTTP_CODE_CONFLICT, 'status': 2400, 'message': 'Identifier for resource already taken.' };
