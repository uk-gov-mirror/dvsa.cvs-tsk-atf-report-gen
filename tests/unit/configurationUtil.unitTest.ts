import { Configuration } from "../../src/utils/Configuration";
import { IS3Config } from "../../src/models";
import { safeDump } from "js-yaml";
import * as fs from "fs";
import * as AWSMock from "aws-sdk-mock";
import { fake, SinonSpy } from "sinon";
import { GetSecretValueResponse } from "aws-sdk/clients/secretsmanager";
import AWS = require("aws-sdk");

describe("ConfigurationUtil", () => {
  const config: Configuration = Configuration.getInstance();
  const OLD_ENV = process.env;

  context("when calling the getS3Config() and the BRANCH environment variable is local", () => {
    process.env.BRANCH = "local";
    const s3config: IS3Config = config.getS3Config();
    it("should return the local S3 config", () => {
      expect(s3config.endpoint).toBe("http://localhost:7000");
    });
  });

  context("when calling the getS3Config() and the BRANCH environment variable is not defined", () => {
    process.env.BRANCH = "";
    const s3config: IS3Config = config.getS3Config();
    it("should return the local S3 config", () => {
      expect(s3config.endpoint).toBe("http://localhost:7000");
    });
  });

  context("when calling the getS3Config() and the BRANCH environment variable is different than local", () => {
    process.env.BRANCH = "test";
    const s3config: IS3Config = config.getS3Config();
    it("should return the local S3 config", () => {
      // tslint:disable-next-line:no-unused-expression
      expect(s3config).toStrictEqual({});
    });
  });

  context("when calling getGovNotifyConfig() and the SECRET_NAME environment variable not set", () => {
    beforeEach(() => {
      jest.resetModules();
      delete process.env.SECRET_NAME;
    });
    it("should fail if secrets.yml does not exist", async () => {
      await expect(config.getGovNotifyConfig()).rejects.toThrowError();
    });
    it("should succeed if secrets.yml exists", async () => {
      await fs.writeFileSync("src/config/secrets.yml", safeDump({ notify: { endpoint: "asdfg", api_key: "asddfg" } }));
      const notify = await config.getGovNotifyConfig();
      expect(notify.endpoint).toBe("asdfg");
      expect(notify.api_key).toBe("asddfg");
      await fs.unlinkSync("src/config/secrets.yml");
    });
  });
  process.env = { ...OLD_ENV };

  context("when calling getGovNotifyConfig and the SECRET_NAME environment variable set", () => {
    it("should return a correct MOT config", async () => {
      const fakeResp: GetSecretValueResponse = {
        SecretString: `notify:
  endpoint: asdfg
  apiKey: asfg`,
      };
      const spy: SinonSpy = fake.resolves(fakeResp);
      AWSMock.setSDKInstance(AWS);
      AWSMock.mock("SecretsManager", "getSecretValue", spy);
      const notify = await Configuration.getInstance().getGovNotifyConfig();
      expect(notify.api_key.length).toBeGreaterThanOrEqual(1);
      expect(notify.endpoint.length).toBeGreaterThanOrEqual(1);
      AWSMock.restore("SecretsManager");
    });
  });
});
