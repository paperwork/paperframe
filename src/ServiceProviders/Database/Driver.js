//@flow
//
const Base = require('../../Base');

module.exports = class Driver extends Base {
    _client:                    Function

    async initialize(): Promise<boolean> {
        return false;
    }

    get client(): Function {
        return this._client;
    }
};
