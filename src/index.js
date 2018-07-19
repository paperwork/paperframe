'use strict';

module.exports.Base = require('./Base');
module.exports.Collection = require('./Collection');
module.exports.Controller = require('./Controller');
module.exports.Router = require('./Router');
module.exports.Common = require('./Common');
module.exports.JsonController = require('./JsonController');
module.exports.ServiceProvider = require('./ServiceProvider');
module.exports.ServiceProviders = {
    'Database': {
        'Driver': require('./ServiceProviders/Database/Driver')
    }
};
