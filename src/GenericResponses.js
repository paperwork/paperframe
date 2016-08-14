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
 * Internal error.
 *
 * @type       {object}
 */
export const GR_INTERNAL_ERROR = { code: HTTP_CODE_INTERNAL_SERVER_ERROR, message: 'Internal error.' };

/**
 * Not implemented.
 *
 * @type       {object}
 */
export const GR_NOT_IMPLEMENTED = { code: HTTP_CODE_INTERNAL_SERVER_ERROR, message: 'Not implemented.' };

/**
 * Authentication, unauthorized.
 *
 * @type       {object}
 */
export const GR_AUTH_UNAUTHORIZED = { code: HTTP_CODE_UNAUTHORIZED, message: 'Unauthorized.' };

/**
 * Authentication, password wrong.
 *
 * @type       {object}
 */
export const GR_AUTH_PASSWORD_WRONG = { code: HTTP_CODE_UNAUTHORIZED, message: 'Password wrong.' };

/**
 * Authentication, credentials (either username or password or both) missing.
 *
 * @type       {object}
 */
export const GR_AUTH_CREDENTIALS_MISSING = { code: HTTP_CODE_UNAUTHORIZED, message: 'Credentials missing.' };


/**
 * Authentication, username taken.
 *
 * @type       {object}
 */
export const GR_AUTH_USERNAME_TAKEN = { code: HTTP_CODE_UNAUTHORIZED, message: 'Username already taken.' };

/**
 * Requested resource not found.
 *
 * @type       {object}
 */
export const GR_RESOURCE_NOT_FOUND = { code: HTTP_CODE_NOT_FOUND, message: 'Requested resource not found.' };

/**
 * Identifier for resource already taken.
 *
 * @type       {object}
 */
export const GR_RESOURCE_ID_TAKEN = { code: HTTP_CODE_CONFLICT, message: 'Identifier for resource already taken.' };
