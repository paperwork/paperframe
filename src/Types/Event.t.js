//@flow

export type EventAction =
    | 'index'
    | 'show'
    | 'create'
    | 'update'
    | 'destroy';


export type Event = {
    action: EventAction,

};

export type EventDataType =
    | string
    | Object;

export type EventDataTable = {
    [key: string]: EventDataType
};

export type EventId = string;

export type EventPackage = {
    'data': EventDataTable,
    'timestamp': Date
};
