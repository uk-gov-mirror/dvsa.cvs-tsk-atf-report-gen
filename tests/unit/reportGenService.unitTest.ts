import { describe } from "mocha";
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
                            });
                    });
            });
        });
    });
