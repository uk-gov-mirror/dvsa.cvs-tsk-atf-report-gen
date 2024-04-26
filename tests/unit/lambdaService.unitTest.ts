import { LambdaService } from "../../src/services/LambdaService";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import mockConfig from "../util/mockConfig";
import { toUint8Array } from "@smithy/util-utf8";
import { mockClient } from "aws-sdk-client-mock";

describe("When LambdaService ", () => {
  mockConfig();
  context("validateInvocationResponse", () => {
    context("gets 404", () => {
      it("should return an empty 200", async () => {
        const service = new LambdaService(new LambdaClient());
        const payload = await service.validateInvocationResponse({ Payload: toUint8Array('{"statusCode": 404, "body": "No resource match the selected criteria"}'), StatusCode: 200 });
        expect(payload.statusCode).toEqual(200);
        expect(payload.body).toEqual("[]");
      });
    });

    context("gets high error and body", () => {
      it("should throw an error", async () => {
        const service = new LambdaService(new LambdaClient());
        expect.assertions(2);
        try {
          await service.validateInvocationResponse({ Payload: toUint8Array('{"statusCode": 503, "body": "Service unavailable"}'), StatusCode: 200 });
        } catch (e) {
          expect(e.message).toEqual("Lambda invocation returned error: 503 Service unavailable");
          expect(e).toBeInstanceOf(Error);
        }
      });
    });

    context("gets high error and no body", () => {
      it("should throw an error", async () => {
        const service = new LambdaService(new LambdaClient());
        expect.assertions(2);
        try {
          await service.validateInvocationResponse({ StatusCode: 418 });
        } catch (e) {
          expect(e.message).toEqual("Lambda invocation returned error: 418 with empty payload.");
          expect(e).toBeInstanceOf(Error);
        }
      });
    });

    context("gets OK response and no body object in ", () => {
      it("should throw an error", async () => {
        const service = new LambdaService(new LambdaClient());
        expect.assertions(2);
        try {
          await service.validateInvocationResponse({ Payload: toUint8Array("{}"), StatusCode: 200 });
        } catch (e) {
          expect(e.message).toEqual("Lambda invocation returned bad data: {}.");
          expect(e).toBeInstanceOf(Error);
        }
      });
    });

    context("gets good response", () => {
      it("should return the payload body", async () => {
        const service = new LambdaService(new LambdaClient());
        expect.assertions(1);
        try {
          const result = await service.validateInvocationResponse({ Payload: toUint8Array('{"statusCode": 200, "body": "It worked"}'), StatusCode: 200 });
          expect(result).toEqual({ statusCode: 200, body: "It worked" });
        } catch {
          // Should never reach
        }
      });
    });
  });

  context("Invoke", () => {
    context("gets an error from the Lambda SDK", () => {
      it("bubbles that error up", async () => {
        const mockLambdaClient = mockClient(LambdaClient).on(InvokeCommand).rejects(new Error("Oh no"));

        const service = new LambdaService(new LambdaClient());

        expect.assertions(1);
        try {
          await service.invoke({ FunctionName: "bob" });
        } catch (e) {
          expect(e.message).toEqual("Oh no");
        }

        mockLambdaClient.reset();
      });
    });
  });
});
