import { expect } from "chai";
import { Injector } from "../../src/models/injector/Injector";
import * as fs from "fs";
import * as path from "path";
import { ReportGenerationService } from "../../src/services/ReportGenerationService";
import { LambdaMockService } from "../models/LambdaMockService";
import { TestResultsService } from "../../src/services/TestResultsService";
import { IActivity } from "../../src/models";
import * as Excel from "exceljs";
import { Duplex } from "stream";

describe("ReportGenerationService", () => {
        const testResultsService: TestResultsService = Injector.resolve<TestResultsService>(TestResultsService, [LambdaMockService]);
        const reportGenerationService: ReportGenerationService = new ReportGenerationService(testResultsService);
        LambdaMockService.populateFunctions();

        context("when generating a template", () => {
            context("and providing the number of rows the template will contain", () => {
                it("should return a template containing the provided number of rows", () => {
                    return reportGenerationService.fetchATFTemplate(10)
                        .then((result: any) => {
                            const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
                            const declaration: any = result.reportTemplate.declaration;
                            const activityDetails: any = result.reportTemplate.activityDetails;

                            // Validate site visit details
                            expect(siteVisitDetails.assesor._address).to.equal("D10");
                            expect(siteVisitDetails.date._address).to.equal("D11");
                            expect(siteVisitDetails.siteName._address).to.equal("G10");
                            expect(siteVisitDetails.siteNumber._address).to.equal("G11");
                            expect(siteVisitDetails.startTime._address).to.equal("D12");

                            // Validate declaration
                            expect(declaration.date._address).to.equal("D17");
                            expect(declaration.finishTime._address).to.equal("G17");

                            // Validate activity details
                            expect(activityDetails.length).to.equal(10);
                        });
                });

                it("should still return a template when requested length is 0", () => {
                    return reportGenerationService.fetchATFTemplate(0)
                        .then((result: any) => {
                            const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
                            const declaration: any = result.reportTemplate.declaration;
                            const activityDetails: any = result.reportTemplate.activityDetails;

                            // Validate site visit details
                            expect(siteVisitDetails.assesor._address).to.equal("D10");
                            expect(siteVisitDetails.date._address).to.equal("D11");
                            expect(siteVisitDetails.siteName._address).to.equal("G10");
                            expect(siteVisitDetails.siteNumber._address).to.equal("G11");
                            expect(siteVisitDetails.startTime._address).to.equal("D12");

                            // Validate declaration
                            expect(declaration.date._address).to.equal("D17");
                            expect(declaration.finishTime._address).to.equal("G17");

                            // Validate activity details
                            expect(activityDetails.length).to.equal(0);
                        });
                });
            });
        });

        context("when generating a report", () => {
            const event: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/queue-event.json"), "utf8"));
            const activity: IActivity = JSON.parse(event.Records[0].body);

            it("should return a valid xlsx file as buffer", () => {
                return reportGenerationService.generateATFReport(activity)
                    .then((result: any) => {
                        const workbook = new Excel.Workbook();
                        const stream = new Duplex();
                        stream.push(result.fileBuffer); // Convert the incoming file to a readable stream
                        stream.push(null);

                        return workbook.xlsx.read(stream)
                            .then((excelFile: any) => {
                                const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

                                expect(excelFile.creator).to.equal("Commercial Vehicles Services Beta Team");
                                expect(excelFile.company).to.equal("Drivers and Vehicles Standards Agency");
                                expect(reportSheet.name).to.equal("ATF Report");
                                expect(reportSheet.getCell("C24").value).to.equal("Activity");
                                // tslint:disable-next-line
                                expect(reportSheet.getCell("C25").value).to.not.be.null;
                            });
                    });
            });

            context("and testResults returns HGVs and TRLs", () => {
                it("should return a valid xlsx file as buffer with trailerId populated for trl vehicles and noOfAxles populated for hgv and trl vehicles", async () => {
                    // TestResultsService.prototype.getTestResults = jest.fn().mockImplementation(() => {return cancelledTest});
                    LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/cancelled-test-result.json");

                    const output = await reportGenerationService.generateATFReport(activity);
                    const workbook = new Excel.Workbook();
                    const stream = new Duplex();
                    stream.push(output.fileBuffer); // Convert the incoming file to a readable stream
                    stream.push(null);

                    const excelFile = await workbook.xlsx.read(stream);
                    const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

                    expect(reportSheet.getCell("H25").value).to.equal(2);
                    expect(reportSheet.getCell("H26").value).to.equal(5);
                    expect(reportSheet.getCell("F25").value).to.equal("JY58FPP");
                    expect(reportSheet.getCell("E26").value).to.equal("12345");
                });
            });
        });
    });
