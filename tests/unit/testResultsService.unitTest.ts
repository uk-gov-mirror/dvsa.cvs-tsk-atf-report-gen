import { TestResultsService } from "../../src/services/TestResultsService";
import testResults200 from "../resources/test-results-200-response.json";
import testResults200EmptyBody from "../resources/test-results-200-response-empty-body.json";
import testResults404 from "../resources/test-results-404-response.json";
import { HTTPError } from "../../src/models/HTTPError";
import { LambdaService } from "../../src/services/LambdaService";
import { wrapLambdaErrorResponse, wrapLambdaResponse } from "../util/responseUtils";
import mockConfig from "../util/mockConfig";

describe("TestResultsService", () => {
    mockConfig();
    context("when fetching the test results", () => {
        context("and the lambda function exists", () => {
            context("and the response is 200", () => {
                it("should return a correct test result", () => {
                    const expectedResult: any = [
                        {
                            testerStaffId: "1",
                            vrm: "JY58FPP",
                            testStationPNumber: "87-1369569",
                            numberOfSeats: 45,
                            testStartTimestamp: "2019-01-14T10:36:33.987Z",
                            testEndTimestamp: "2019-01-14T10:36:33.987Z",
                            testTypes: {
                                prohibitionIssued: false,
                                testCode: "aas",
                                testNumber: "1",
                                lastUpdatedAt: "2019-02-22T08:47:59.269Z",
                                testAnniversaryDate: "2019-12-22T08:47:59.749Z",
                                additionalCommentsForAbandon: "none",
                                numberOfSeatbeltsFitted: 2,
                                testTypeEndTimestamp: "2019-01-14T10:36:33.987Z",
                                reasonForAbandoning: "none",
                                lastSeatbeltInstallationCheckDate: "2019-01-14",
                                createdAt: "2019-02-22T08:47:59.269Z",
                                testExpiryDate: "2020-02-21T08:47:59.749Z",
                                testTypeId: "1",
                                testTypeStartTimestamp: "2019-01-14T10:36:33.987Z",
                                certificateNumber: "1234",
                                testTypeName: "Annual test",
                                seatbeltInstallationCheckDate: true,
                                additionalNotesRecorded: "VEHICLE FRONT REGISTRATION PLATE MISSING",
                                defects: [
                                    {
                                        deficiencyCategory: "major",
                                        deficiencyText: "missing.",
                                        prs: false,
                                        additionalInformation: {
                                            location: {
                                                axleNumber: null,
                                                horizontal: null,
                                                vertical: null,
                                                longitudinal: "front",
                                                rowNumber: null,
                                                lateral: null,
                                                seatNumber: null
                                            },
                                            notes: "None"
                                        },
                                        itemNumber: 1,
                                        deficiencyRef: "1.1.a",
                                        stdForProhibition: false,
                                        deficiencySubId: null,
                                        imDescription: "Registration Plate",
                                        deficiencyId: "a",
                                        itemDescription: "A registration plate:",
                                        imNumber: 1
                                    }
                                ],
                                name: "Annual test",
                                certificateLink: "http://dvsagov.co.uk",
                                testResult: "pass"
                            },
                            vin: "XMGDE02FS0H012345"
                        }
                    ];
                    const mockLambdaService = jest.fn().mockImplementation(() =>  {
                        return {
                            invoke: () => {
                                return Promise.resolve(wrapLambdaResponse(testResults200));
                            },
                            validateInvocationResponse: (input: any) =>input.Payload
                        };
                    });
                    const testResultsService: TestResultsService = new TestResultsService(new mockLambdaService());
                    expect.assertions(1);
                    return testResultsService.getTestResults({})
                        .then((result: any) => {
                            expect(result).toEqual(expectedResult);
                        });
                });
            });

            context("and the lambda service throws an error", () => {
                it("should throw bubble up the error", () => {
                    const mockLambdaService = jest.fn().mockImplementation(() =>  {
                        return {
                            invoke: () => {
                                return Promise.reject(new HTTPError(418, "It broke!"));
                            },
                            validateInvocationResponse: (input: any) =>input.Payload
                        };
                    });
                    const testResultsService: TestResultsService = new TestResultsService(new mockLambdaService());
                    return testResultsService.getTestResults({})
                        .catch((error: HTTPError) => {
                            expect((error as any).body).toEqual("It broke!");
                            expect(error).toBeInstanceOf(HTTPError);
                        });
                });
            });

            context("and the response is non-200", () => {
                it("should throw an error", () => {
                    const mockLambdaService = jest.fn().mockImplementation(() =>  {
                        return {
                            invoke: () => {
                                return Promise.resolve(wrapLambdaErrorResponse(404, testResults404));
                            },
                            validateInvocationResponse: LambdaService.prototype.validateInvocationResponse
                        };
                    });
                    const testResultsService: TestResultsService = new TestResultsService(new mockLambdaService());
                    return testResultsService.getTestResults({})
                      .catch((error: Error) => {
                          expect(error.message).toContain("Lambda invocation returned error");
                          expect(error).toBeInstanceOf(Error);
                      });
                });
            });

            context("and the response is 200 with empty body", () => {
                it("should return an empty test-result", () => {
                    const mockLambdaService = jest.fn().mockImplementation(() =>  {
                        return {
                            invoke: () => {
                                return Promise.resolve(wrapLambdaResponse(testResults200EmptyBody));
                            },
                            validateInvocationResponse: (input: any) =>input.Payload
                        };
                    });
                    const testResultsService: TestResultsService = new TestResultsService(new mockLambdaService());
                    expect.assertions(1);
                    return testResultsService.getTestResults({})
                        .then((result: any) => {
                            const expectedResult: any = [];
                            expect(result).toEqual(expectedResult);
                        });
                });
            });
        });
    });
});
