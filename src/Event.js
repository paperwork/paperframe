//@flow

export type TEventAction =
    | 'index'
    | 'show'
    | 'create'
    | 'update'
    | 'destroy';


export type TEvent = {
    action: TEventAction,

};

export type TEventData =
    | string
    | Object;

export type TEventDataTable = {
    [key: string]: TEventData
};

export type TEventId = string;

export type TEventPackage = {
    'data': TEventDataTable,
    'timestamp': Date
};
