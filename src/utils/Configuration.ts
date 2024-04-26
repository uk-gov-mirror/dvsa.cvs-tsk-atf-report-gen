// @ts-ignore
import { SecretsManager, GetSecretValueRequest, GetSecretValueResponse } from "@aws-sdk/client-secrets-manager";
import { safeLoad } from "js-yaml";
import * as yml from "node-yaml";
import { ERRORS } from "../assets/enum";
import { IConfig, IInvokeConfig, IMOTConfig, IS3Config, ISecretConfig } from "../models";
import AWSXRay from "aws-xray-sdk";

class Configuration {
  private static instance: Configuration;
  private readonly config: IConfig;
  private secretsClient: SecretsManager;
  private readonly secretPath = "../config/secrets.yml";

  constructor(configPath: string) {
    this.secretsClient = AWSXRay.captureAWSv3Client(
      new SecretsManager({
        region: "eu-west-1",
      })
    );
    this.config = yml.readSync(configPath);

    // Replace environment variable references
    let stringifiedConfig: string = JSON.stringify(this.config);
    const envRegex: RegExp = /\${(\w+\b):?(\w+\b)?}/g;
    const matches: RegExpMatchArray | null = stringifiedConfig.match(envRegex);

    if (matches) {
      matches.forEach((match: string) => {
        envRegex.lastIndex = 0;
        const captureGroups: RegExpExecArray = envRegex.exec(match) as RegExpExecArray;

        // Insert the environment variable if available. If not, insert placeholder. If no placeholder, leave it as is.
        stringifiedConfig = stringifiedConfig.replace(match, process.env[captureGroups[1]] || captureGroups[2] || captureGroups[1]);
      });
    }

    this.config = JSON.parse(stringifiedConfig);
  }

  /**
   * Retrieves the singleton instance of Configuration
   * @returns Configuration
   */
  public static getInstance(): Configuration {
    if (!this.instance) {
      this.instance = new Configuration("../config/config.yml");
    }

    return Configuration.instance;
  }

  /**
   * Retrieves the DynamoDB config
   * @returns IDynamoDBConfig
   */
  public getS3Config(): IS3Config {
    if (!this.config.s3) {
      throw new Error(ERRORS.DYNAMO_DB_CONFIG_NOT_DEFINED);
    }

    // Not defining BRANCH will default to local
    const env: string = !process.env.BRANCH || process.env.BRANCH === "local" ? "local" : "remote";

    return this.config.s3[env];
  }

  /**
   * Retrieves the Lambda Invoke config
   * @returns IInvokeConfig
   */
  public getInvokeConfig(): IInvokeConfig {
    if (!this.config.invoke) {
      throw new Error("Lambda Invoke config is not defined in the config file.");
    }

    // Not defining BRANCH will default to local
    const env: string = !process.env.BRANCH || process.env.BRANCH === "local" ? "local" : "remote";

    return this.config.invoke[env];
  }

  /**
   * Retrieves the Gov Notify config
   * @returns IMOTConfig
   */
  public async getGovNotifyConfig(): Promise<IMOTConfig> {
    if (!this.config.notify) {
      throw new Error(ERRORS.MOT_CONFIG_NOT_DEFINED);
    }
    if (!this.config.notify.api_key || !this.config.notify.endpoint) {
      await this.setSecrets();
    }
    return this.config.notify;
  }

  /**
   * Retrieves the templateId from config file when running locally, else environment variable
   */
  public async getTemplateIdFromEV(): Promise<string> {
    if (!process.env.BRANCH || process.env.BRANCH === "local") {
      if (!this.config.notify.templateId) {
        throw new Error(ERRORS.TEMPLATE_ID_ENV_VAR_NOT_EXIST);
      } else {
        return this.config.notify.templateId;
      }
    } else {
      if (!process.env.TEMPLATE_ID) {
        throw new Error(ERRORS.TEMPLATE_ID_ENV_VAR_NOT_EXIST);
      }
      return process.env.TEMPLATE_ID;
    }
  }

  /**
   * Sets the secrets needed to use GovNotify
   * @returns Promise<void>
   */
  private async setSecrets(): Promise<void> {
    let secretConfig: ISecretConfig;

    if (process.env.SECRET_NAME) {
      const req: GetSecretValueRequest = {
        SecretId: process.env.SECRET_NAME,
      };
      const resp: GetSecretValueResponse = await this.secretsClient.getSecretValue(req);
      try {
        secretConfig = safeLoad(resp.SecretString as string) as ISecretConfig;
      } catch (e) {
        throw new Error("SecretString is empty.");
      }
    } else {
      console.warn(ERRORS.SECRET_ENV_VAR_NOT_EXIST);
      try {
        secretConfig = await yml.read(this.secretPath);
      } catch (err) {
        throw new Error(ERRORS.SECRET_FILE_NOT_EXIST);
      }
    }
    try {
      this.config.notify.api_key = secretConfig.notify.api_key;
      this.config.notify.endpoint = secretConfig.notify.endpoint;
    } catch (e) {
      throw new Error("secretConfig not set");
    }
  }
}

export { Configuration };
