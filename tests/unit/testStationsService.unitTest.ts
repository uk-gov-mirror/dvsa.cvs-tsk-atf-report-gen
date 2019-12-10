import { LambdaMockService } from "../models/LambdaMockService";
import { TestStationsService } from "../../src/services/TestStationsService";
import AWS, { Lambda } from "aws-sdk";
import AWSMock from "aws-sdk-mock";
import sinon from "sinon";
import { LambdaService } from "../../src/services/LambdaService";
import mockConfig from "../util/mockConfig";
const sandbox = sinon.createSandbox();
AWSMock.setSDKInstance(AWS);


describe("TestStationsService", () => {
    mockConfig();
    // @ts-ignore
    const testStationsService: TestStationsService = new TestStationsService(new LambdaMockService());
    LambdaMockService.populateFunctions();

    afterEach(()=> {
        sandbox.restore();
    });

    context("when fetching the test stations", () => {
        context("and the lambda function exists", () => {
            context("and the response is 200", () => {
                it("should return a correct test stations emails", () => {
                    return testStationsService.getTestStationEmail("87-1369569").then((data) => {
                       expect(data[0].testStationEmails.length).toEqual(3);
                    });
                });
            });
        });

        context("and the lambda function throws an error", () => {
            it("should bubble up the error (error in Invoke)", async () => {
                const service = new TestStationsService(new LambdaService(new Lambda()));
                sandbox.stub(LambdaService.prototype, "invoke").throws(new Error("Oh no"));
                expect.assertions(1);
                try {
                    await service.getTestStationEmail("something");
                } catch (e) {
                    expect(e.message).toEqual("Oh no");
                }
            });

            it("should bubble up the error (error in validateInvocationResponse)", async () => {
                AWSMock.mock("Lambda", "invoke", (params: any, callback: any) => {callback(null, "all good");});
                const lambda = new AWS.Lambda();
                const service = new TestStationsService(new LambdaService(lambda));

                sandbox.stub(LambdaService.prototype, "validateInvocationResponse").throws(new Error("Not again"));
                expect.assertions(1);
                try {
                    await service.getTestStationEmail("something");
                } catch (e) {
                    expect(e.body).toEqual("Not again");
                }
                AWSMock.restore("Lambda");
            });
        });
    });
});
