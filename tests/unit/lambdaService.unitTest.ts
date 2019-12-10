import { LambdaService } from "../../src/services/LambdaService";
import AWS, { Lambda } from "aws-sdk";
import AWSMock from "aws-sdk-mock";
import mockConfig from "../util/mockConfig";
AWSMock.setSDKInstance(AWS);

describe("When LambdaService ", () => {
    mockConfig();
    context("validateInvocationResponse", () => {
        context("gets 404", () => {
            it("should return an empty 200", async () => {
                const service = new LambdaService(new Lambda());
                const payload = await service.validateInvocationResponse({Payload: "{\"statusCode\": 404, \"body\": \"No resource match the selected criteria\"}", StatusCode: 200});
                expect(payload.statusCode).toEqual(200);
                expect(payload.body).toEqual("[]");
            });
        });

        context("gets high error and body", () => {
            it("should throw an error", async () => {
                const service = new LambdaService(new Lambda());
                expect.assertions(2);
                try {
                    await service.validateInvocationResponse({Payload: "{\"statusCode\": 503, \"body\": \"Service unavailable\"}", StatusCode: 200});
                } catch (e) {
                    expect(e.message).toEqual("Lambda invocation returned error: 503 Service unavailable");
                    expect(e).toBeInstanceOf(Error);
                }
            });
        });

        context("gets high error and no body", () => {
            it("should throw an error", async () => {
                const service = new LambdaService(new Lambda());
                expect.assertions(2);
                try {
                    await service.validateInvocationResponse({StatusCode: 418});
                } catch (e) {
                    expect(e.message).toEqual("Lambda invocation returned error: 418 with empty payload.");
                    expect(e).toBeInstanceOf(Error);
                }
            });
        });

        context("gets OK response and no body object in ", () => {
            it("should throw an error", async () => {
                const service = new LambdaService(new Lambda());
                expect.assertions(2);
                try {
                    await service.validateInvocationResponse({Payload: "{}", StatusCode: 200});
                } catch (e) {
                    expect(e.message).toEqual("Lambda invocation returned bad data: {}.");
                    expect(e).toBeInstanceOf(Error);
                }
            });
        });

        context("gets good response", ()=> {
            it("should return the payload body", async () => {
                const service = new LambdaService(new Lambda());
                expect.assertions(1);
                try {
                    const result = await service.validateInvocationResponse({Payload: "{\"statusCode\": 200, \"body\": \"It worked\"}", StatusCode: 200});
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
                AWSMock.mock("Lambda", "invoke", (params: any, callback: any) => {callback(new Error("Oh no"));});
                const lambda = new AWS.Lambda();
                const service = new LambdaService(lambda);
                expect.assertions(1);
                try {
                    await service.invoke({FunctionName: "bob"});
                } catch (e) {
                    expect(e.message).toEqual("Oh no");
                }
                AWSMock.restore("Lambda");
            });
        });
    });
});
