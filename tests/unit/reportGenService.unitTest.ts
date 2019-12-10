import { ReportGenerationService } from "../../src/services/ReportGenerationService";
import { TestResultsService } from "../../src/services/TestResultsService";
import { IActivity } from "../../src/models";
import * as Excel from "exceljs";
import { Duplex } from "stream";
import event from "../resources/queue-event.json";
import testResultResponse from "../resources/test-results-200-response.json";
import waitResponse from "../resources/wait-time-response.json";
import hgvTrlTestResultResponse from "../resources/hgv-trl-test-results.json";
import { ActivitiesService } from "../../src/services/ActivitiesService";
import mockConfig from "../util/mockConfig";

describe("ReportGenerationService", () => {
  beforeAll(() => {
    jest.resetModuleRegistry();
    jest.restoreAllMocks();
  });
  mockConfig();
  const lambdaMockService = jest.fn();
  // @ts-ignore
  const testResultsService: TestResultsService = new TestResultsService(lambdaMockService);
  // @ts-ignore
  const activitiesService: ActivitiesService = new ActivitiesService(lambdaMockService);
  const reportGenerationService: ReportGenerationService = new ReportGenerationService(testResultsService, activitiesService);

  context("when generating a template", () => {
            context("and providing the number of rows the template will contain", () => {
                it("should return a template containing the provided number of rows", () => {
                    return reportGenerationService.fetchATFTemplate(10)
                        .then((result: any) => {
                            const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
                            const declaration: any = result.reportTemplate.declaration;
                            const activityDetails: any = result.reportTemplate.activityDetails;

                            // Validate site visit details
                            expect(siteVisitDetails.assesor._address).toEqual("D10");
                            expect(siteVisitDetails.date._address).toEqual("D11");
                            expect(siteVisitDetails.siteName._address).toEqual("G10");
                            expect(siteVisitDetails.siteNumber._address).toEqual("G11");
                            expect(siteVisitDetails.startTime._address).toEqual("D12");

                            // Validate declaration
                            expect(declaration.date._address).toEqual("D17");
                            expect(declaration.finishTime._address).toEqual("G17");

                            // Validate activity details
                            expect(activityDetails.length).toEqual(10);
                        });
                });

                it("should still return a template when requested length is 0", () => {
                  return reportGenerationService.fetchATFTemplate(0)
                        .then((result: any) => {
                            const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
                            const declaration: any = result.reportTemplate.declaration;
                            const activityDetails: any = result.reportTemplate.activityDetails;

                            // Validate site visit details
                            expect(siteVisitDetails.assesor._address).toEqual("D10");
                            expect(siteVisitDetails.date._address).toEqual("D11");
                            expect(siteVisitDetails.siteName._address).toEqual("G10");
                            expect(siteVisitDetails.siteNumber._address).toEqual("G11");
                            expect(siteVisitDetails.startTime._address).toEqual("D12");

                            // Validate declaration
                            expect(declaration.date._address).toEqual("D17");
                            expect(declaration.finishTime._address).toEqual("G17");

                            // Validate activity details
                            expect(activityDetails.length).toEqual(0);
                        });
                });
            });
        });

        context("when generating a report", () => {
            const activity: IActivity = JSON.parse(event.Records[0].body);

            it("should return a valid xlsx file as buffer", () => {
              const mockTestResultsService = jest.fn().mockImplementation(() => {
                return {
                  getTestResults: () => {
                    return Promise.resolve(TestResultsService.prototype.expandTestResults(JSON.parse(testResultResponse.body)));
                  }
                };
              });
              const mockActivitiesService = jest.fn().mockImplementation(() => {
                return {
                  getActivities: () => {
                    return Promise.resolve(JSON.parse(waitResponse.body));
                  }
                };
              });
              const reportGenSvc = new ReportGenerationService(new mockTestResultsService(), new mockActivitiesService());

              return reportGenSvc.generateATFReport(activity)
                    .then((result: any) => {
                        const workbook = new Excel.Workbook();
                        const stream = new Duplex();
                        stream.push(result.fileBuffer); // Convert the incoming file to a readable stream
                        stream.push(null);

                        return workbook.xlsx.read(stream)
                            .then((excelFile: any) => {
                                const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

                                expect(excelFile.creator).toEqual("Commercial Vehicles Services Beta Team");
                                expect(excelFile.company).toEqual("Drivers and Vehicles Standards Agency");
                                expect(reportSheet.name).toEqual("ATF Report");
                                expect(reportSheet.getCell("C24").value).toEqual("Activity");
                                // tslint:disable-next-line
                                expect(reportSheet.getCell("C25").value).not.toBeNull();
                            });
                    });
            });

            context("and testResults returns HGVs and TRLs", () => {
                it("should return a valid xlsx file as buffer with trailerId populated for trl vehicles and noOfAxles populated for hgv and trl vehicles", async () => {
                  const mockTestResultsService = jest.fn().mockImplementation(() => {
                    return {
                      getTestResults: () => {
                        return Promise.resolve(TestResultsService.prototype.expandTestResults(JSON.parse(hgvTrlTestResultResponse.body)));
                      }
                    };
                  });
                  const mockActivitiesService = jest.fn().mockImplementation(() => {
                    return {
                      getActivities: () => {
                        return Promise.resolve(JSON.parse(waitResponse.body));
                      }
                    };
                  });
                  const reportGenSvc = new ReportGenerationService(new mockTestResultsService(), new mockActivitiesService());

                  const output = await reportGenSvc.generateATFReport(activity);
                  const workbook = new Excel.Workbook();
                  const stream = new Duplex();
                  stream.push(output.fileBuffer); // Convert the incoming file to a readable stream
                  stream.push(null);

                  const excelFile = await workbook.xlsx.read(stream);
                  const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

                  expect(reportSheet.getCell("H25").value).toEqual(2);
                  expect(reportSheet.getCell("H26").value).toEqual(5);
                  expect(reportSheet.getCell("F25").value).toEqual("JY58FPP");
                  expect(reportSheet.getCell("E26").value).toEqual("10:36:33");
                });
            });
        });
    });
