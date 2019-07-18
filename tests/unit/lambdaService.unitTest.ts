import { LambdaService } from "../../src/services/LambdaService";
import { describe } from "mocha";
import { expect } from "chai";
import AWS, { Lambda } from "aws-sdk";
import AWSMock from "aws-sdk-mock";
AWSMock.setSDKInstance(AWS);

describe("When LambdaService ", () => {
    context("validateInvocationResponse", () => {
        context("gets 404", () => {
            it("should return an empty 200", async () => {
                const service = new LambdaService(new Lambda());
                const payload = await service.validateInvocationResponse({Payload: "{\"statusCode\": 404, \"body\": \"No resource match the selected criteria\"}", StatusCode: 200});
                expect(payload.statusCode).to.be.eql(200);
                expect(payload.body).to.be.eql("[]");
            });
        });

        context("gets high error and body", () => {
            it("should throw an error", async () => {
                const service = new LambdaService(new Lambda());
                try {
                    await service.validateInvocationResponse({Payload: "{\"statusCode\": 503, \"body\": \"Service unavailable\"}", StatusCode: 200});
                    expect.fail();
                } catch (e) {
                    expect(e.message).to.equal("Lambda invocation returned error: 503 Service unavailable");
                    expect(e).to.be.instanceOf(Error);
                }
            });
        });

        context("gets high error and no body", () => {
            it("should throw an error", async () => {
                const service = new LambdaService(new Lambda());
                try {
                    await service.validateInvocationResponse({StatusCode: 418});
                    expect.fail();
                } catch (e) {
                    expect(e.message).to.equal("Lambda invocation returned error: 418 with empty payload.");
                    expect(e).to.be.instanceOf(Error);
                }
            });
        });

        context("gets OK response and no body object in ", () => {
            it("should throw an error", async () => {
                const service = new LambdaService(new Lambda());
                try {
                    await service.validateInvocationResponse({Payload: "{}", StatusCode: 200});
                    expect.fail();
                } catch (e) {
                    expect(e.message).to.equal("Lambda invocation returned bad data: {}.");
                    expect(e).to.be.instanceOf(Error);
                }
            });
        });

        context("gets good response", ()=> {
            it("should return the payload body", async () => {
                const service = new LambdaService(new Lambda());
                try {
                    const result = await service.validateInvocationResponse({Payload: "{\"statusCode\": 200, \"body\": \"It worked\"}", StatusCode: 200});
                    expect(result).to.deep.equal({ statusCode: 200, body: "It worked" });
                } catch (e) {
                    if(e) {console.log(e);}
                    expect.fail();
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
                try {
                    await service.invoke({FunctionName: "bob"});
                    expect.fail();
                } catch (e) {
                    expect(e.message).to.equal("Oh no");
                }
                AWSMock.restore("Lambda");
            });
        });
    });
});
