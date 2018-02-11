//@flow

export type ControllerDependenciesDefinition = Array<string>;

export type ControllerDependency = {
    id: string,
    instance: Function
};

export type ControllerDependencies = {
    [key: string]: ControllerDependency
};

export type ControllerCollections = {
    [key: string]: Function
};

export type ControllerConfig = {
    dependencies: ControllerDependencies,
    collections: ControllerCollections
};

export type ControllerParams = {
    session: Object, // TODO: define type
    before: ?Object,
    parameters: Object,
    query: Object,
    headers: Object,
    body: Object
};

export type ControllerBeforeReturn = Promise<any>;

export type ControllerActionReturn = Promise<any>;

export type ControllerRouteAclEntry = {
    protected: boolean
};

export type ControllerRouteAclTable = {
    index?: ControllerRouteAclEntry,
    show?: ControllerRouteAclEntry,
    create?: ControllerRouteAclEntry,
    update?: ControllerRouteAclEntry,
    destroy?: ControllerRouteAclEntry,
};
