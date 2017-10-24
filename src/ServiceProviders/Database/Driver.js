//@flow
//
const Base = require('../../Base');

module.exports = class Driver extends Base {
    _client:                    Function

    initialize(): boolean {
        return false;
    }

    get client(): Function {
        return this._client;
    }
};
