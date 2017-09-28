'use strict';

module.exports.Base = require('./Base');
module.exports.Collection = require('./Collection');
module.exports.Controller = require('./Controller');
module.exports.JsonController = require('./JsonController');
module.exports.ServiceProvider = require('./ServiceProvider');

import type ControllerDependenciesDefinition from './Types/Controller.t';
import type ControllerDependency from './Types/Controller.t';
import type ControllerDependencies from './Types/Controller.t';
import type ControllerCollections from './Types/Controller.t';
import type ControllerConfig from './Types/Controller.t';
import type ControllerParams from './Types/Controller.t';
import type ControllerBeforeReturn from './Types/Controller.t';
import type ControllerActionReturn from './Types/Controller.t';
import type ControllerRouteAclEntry from './Types/Controller.t';
import type ControllerRouteAclTable from './Types/Controller.t';

import type EventAction from './Types/Event.t';
import type EventDataType from './Types/Event.t';
import type EventDataTable from './Types/Event.t';
import type EventId from './Types/Event.t';
import type EventPackage from './Types/Event.t';

export type {
    ControllerDependenciesDefinition,
    ControllerDependency,
    ControllerDependencies,
    ControllerCollections,
    ControllerConfig,
    ControllerParams,
    ControllerBeforeReturn,
    ControllerActionReturn,
    ControllerRouteAclEntry,
    ControllerRouteAclTable,

    EventAction,
    EventDataType,
    EventDataTable,
    EventId,
    EventPackage
};
