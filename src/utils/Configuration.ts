// @ts-ignore
import * as yml from "node-yaml";
import { IInvokeConfig, IS3Config, IMOTConfig } from "../models";
import { ERRORS } from "../assets/enum";

class Configuration {

    private static instance: Configuration;
    private readonly config: any;

    private constructor(configPath: string, secPath: string) {
        this.config = yml.readSync(configPath);
        const secretConfig = yml.readSync(secPath);

        // Replace environment variable references
        let stringifiedConfig: string = JSON.stringify(this.config);
        const envRegex: RegExp = /\${(\w+\b):?(\w+\b)?}/g;
        const matches: RegExpMatchArray | null = stringifiedConfig.match(envRegex);

        if (matches) {
            matches.forEach((match: string) => {
                envRegex.lastIndex = 0;
                const captureGroups: RegExpExecArray = envRegex.exec(match) as RegExpExecArray;

                // Insert the environment variable if available. If not, insert placeholder. If no placeholder, leave it as is.
                stringifiedConfig = stringifiedConfig.replace(match, (process.env[captureGroups[1]] || captureGroups[2] || captureGroups[1]));
            });
        }

        this.config = JSON.parse(stringifiedConfig);
        Object.assign(this.config.notify, { api_key: secretConfig.notify.api_key, endpoint: secretConfig.notify.endpoint });
    }

    /**
     * Retrieves the singleton instance of Configuration
     * @returns Configuration
     */
    public static getInstance(): Configuration {
        if (!this.instance) {
            this.instance = new Configuration("../config/config.yml",  "../config/secrets.yml");
        }

        return Configuration.instance;
    }

    /**
     * Retrieves the entire config as an object
     * @returns any
     */
    public getConfig(): any {
        return this.config;
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
        const env: string = (!process.env.BRANCH || process.env.BRANCH === "local") ? "local" : "remote";

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
        const env: string = (!process.env.BRANCH || process.env.BRANCH === "local") ? "local" : "remote";

        return this.config.invoke[env];
    }

    /**
     * Retrieves the Gov Notify config
     * @returns IMOTConfig
     */
    public getGovNotifyConfig(): IMOTConfig {
        if (!this.config.notify) {
            throw new Error(ERRORS.MOT_CONFIG_NOT_DEFINED);
        }

        return this.config.notify;
    }

}

export { Configuration };
