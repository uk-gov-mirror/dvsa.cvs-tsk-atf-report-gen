export enum ERRORS {
  MOT_CONFIG_NOT_DEFINED = "The MOT config is not defined in the config file.",
  DYNAMO_DB_CONFIG_NOT_DEFINED = "DynamoDB config is not defined in the config file.",
  LAMBDA_INVOKE_CONFIG_NOT_DEFINED = "Lambda Invoke config is not defined in the config file.",
  ATF_CANT_BE_CREATED = "ATF Report can't be created.",
  EVENT_IS_EMPTY = "Event is empty",
  SECRET_ENV_VAR_NOT_EXIST = "SECRET_NAME environment variable does not exist.",
  TEMPLATE_ID_ENV_VAR_NOT_EXIST = "TEMPLATE_ID environment variable does not exist.",
  SECRET_FILE_NOT_EXIST = "The secret file does not exist.",
  NOTIFY_CONFIG_NOT_SET = "The GovNotify configuration not set.",
}

export enum ACTIVITY_TYPE {
  TEST = "Test",
  WAIT_TIME = "Wait Time",
  TIME_NOT_TESTING = "Time not Testing",
}

export enum TIMEZONE {
  LONDON = "Europe/London",
}

export enum STATUSES {
  SUBMITTED = "submitted",
}

export enum VEHICLE_TYPES {
  PSV = "psv",
  HGV = "hgv",
  TRL = "trl",
}
