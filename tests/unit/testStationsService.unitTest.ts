import AWS, { Lambda } from "aws-sdk";
import AWSMock from "aws-sdk-mock";
import sinon from "sinon";
import { LambdaService } from "../../src/services/LambdaService";
import { TestStationsService } from "../../src/services/TestStationsService";
import testStationResponse from "../resources/test-stations-200-response.json";
import mockConfig from "../util/mockConfig";

describe("TestStationsService", () => {
    AWSMock.setSDKInstance(AWS);
    const sandbox = sinon.createSandbox();
    mockConfig();
    const lambdaMock = jest.fn().mockImplementation(() => {
        return {
            invoke: jest.fn().mockResolvedValue(""),
            validateInvocationResponse: jest.fn().mockReturnValue(testStationResponse)
        };
    });
    const testStationsService: TestStationsService = new TestStationsService(new lambdaMock());

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
