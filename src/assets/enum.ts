export enum TEMPLATE_IDS {
    ATF_REPORT_TEMPLATE = "368a62fa-f826-4be6-92c3-c555e3d7e0a3",
}

export enum ERRORS {
    MOT_CONFIG_NOT_DEFINED = "The MOT config is not defined in the config file.",
    DYNAMO_DB_CONFIG_NOT_DEFINED = "DynamoDB config is not defined in the config file.",
    LAMBDA_INVOKE_CONFIG_NOT_DEFINED = "Lambda Invoke config is not defined in the config file.",
    ATF_CANT_BE_CREATED = "ATF Report can't be created.",
    EVENT_IS_EMPTY = "Event is empty"
}

export enum ACTIVITY_TYPE {
    TEST = "Test",
    WAIT_TIME = "Wait Time"
}

export enum TIMEZONE {
    LONDON = "Europe/London"
}

export enum STATUSES {
    SUBMITTED = "submitted"
}

export enum VEHICLE_TYPES {
    PSV = "psv",
    HGV = "hgv",
    TRL = "trl"
}
