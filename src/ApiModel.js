'use strict';

import { capitalize as __capitalize } from 'lodash';
const _ = {
    'capitalize': __capitalize
};

/**
 * ApiModel class.
 */
class ApiModel {
    /**
     * Configure model.
     *
     * @method     configure
     * @return     {boolean}  True when successfully configured.
     */
    configure() {
        return this.initialize();
    }

    /**
     * Initialize model.
     *
     * @method     initialize
     * @param      {object}   options   The initialization options object.
     * @return     {boolean}  True when successfully initialized.
     */
    initialize(options) {
        this.hiddenAttributes = ['created_at', 'updated_at'];

        if(typeof options !== 'undefined') {
            if(options.showTimestamps === true) {
                this.hiddenAttributes = ['updated_at'];
            }
        }

        return this.initializeValidation();
    }

    /**
     * Hide attributes from toJSON()
     *
     * @param      {array}    attributes  The attributes array. Can also be a string.
     * @return     {boolean}  Returns true when successfully hidden.
     */
    hideAttributes(attributes) {
        let attributesArray = attributes;

        if(typeof attributes === 'string') {
            attributesArray = [attributes];
        }

        attributesArray.forEach(attribute => {
            if(!this.hiddenAttributes[attribute]) {
                this.hiddenAttributes.push(attribute);
            }
        });

        return true;
    }

    /**
     * Initialize validation for model.
     *
     * @return     {boolean}  True when successfully initialized.
     */
    initializeValidation() {
        let hooks = {
            'when': [ 'before', 'around', 'after' ],
            'what': [ 'save', 'create', 'update', 'remove' ]
        };

        this.schema = [];

        hooks.when.forEach(when => {
            this.schema[when] = [];

            hooks.what.forEach(what => {
                this[when](what, 'validate' + _.capitalize(when) + _.capitalize(what));
            });
        });

        return true;
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateBeforeSave(next) {
        return this.validate('before', 'save', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateBeforeCreate(next) {
        return this.validate('before', 'create', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateBeforeUpdate(next) {
        return this.validate('before', 'update', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateBeforeRemove(next) {
        return this.validate('before', 'remove', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAroundSave(next) {
        return this.validate('around', 'save', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAroundCreate(next) {
        return this.validate('around', 'create', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAroundUpdate(next) {
        return this.validate('around', 'update', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAroundRemove(next) {
        return this.validate('around', 'remove', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAfterSave(next) {
        return this.validate('after', 'save', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAfterCreate(next) {
        return this.validate('after', 'create', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAfterUpdate(next) {
        return this.validate('after', 'update', next);
    }

    /**
     * Callback for validation at specified time and action.
     *
     * @param      {Function}  next    The next method.
     * @return     {boolean}    True when valid, false when invalid.
     */
    validateAfterRemove(next) {
        return this.validate('after', 'remove', next);
    }

    /**
     * Validate model.
     *
     * @method     validate
     * @param      {string}    when    Moment of validation (e.g. "before").
     * @param      {string}    what    Action of validation (e.g. "update").
     * @param      {Function}  next    The next method.
     * @return     {boolean}   Validation result, true when valid, false when invalid.
     */
    validate(when, what, next) {
        let validation = null;

        if(this.schema && this.schema[when] && this.schema[when][what]) {
            validation = this.schema[when][what].validate(this.attributes);
        } else {
            return true;
        }

        if(!validation.error || validation.error.length === ''.length){
            if(next) {
                return next();
            }
            return true;
        }
        throw new Error(validation.error);
        return false;
    }
}

export default ApiModel;
