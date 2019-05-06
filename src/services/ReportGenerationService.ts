import { IActivity } from "../models";
import * as Excel from "exceljs";
import * as path from "path";
import { Service } from "../models/injector/ServiceDecorator";
import { TestResultsService } from "./TestResultsService";
import moment = require("moment-timezone");
import { ACTIVITY_TYPE, ERRORS, TIMEZONE } from "../assets/enum";
import { HTTPError } from "../models/HTTPError";

@Service()
class ReportGenerationService {
    private readonly testResultsService: TestResultsService;

    constructor(testResultsService: TestResultsService) {
        this.testResultsService = testResultsService;
    }

    /**
     * Generates the ATF report for a given activity
     * @param activity - activity for which to generate the report
     */
    public generateATFReport(activity: IActivity): Promise<any> {
        return this.testResultsService.getTestResults({
            testerStaffId: activity.testerStaffId,
            fromDateTime: activity.startTime,
            toDateTime: activity.endTime,
            testStationPNumber: activity.testStationPNumber
        }).then((testResults: any) => {
            // Fetch and populate the ATF template
            return this.fetchATFTemplate(testResults.length)
            .then((template: { workbook: Excel.Workbook, reportTemplate: any} ) => {
                const siteVisitDetails: any = template.reportTemplate.siteVisitDetails;
                const declaration: any = template.reportTemplate.declaration;

                // Populate site visit details
                siteVisitDetails.assesor.value = activity.testerName;
                siteVisitDetails.siteName.value = activity.testStationName;
                siteVisitDetails.siteNumber.value = activity.testStationPNumber;
                siteVisitDetails.date.value = moment(activity.startTime).tz(TIMEZONE.LONDON).format("DD/MM/YYYY");
                siteVisitDetails.startTime.value = moment(activity.startTime).tz(TIMEZONE.LONDON).format("HH:mm:ss");

                // Populate declaration
                declaration.date.value = moment(activity.endTime).tz(TIMEZONE.LONDON).format("DD/MM/YYYY");
                declaration.finishTime.value = moment(activity.endTime).tz(TIMEZONE.LONDON).format("HH:mm:ss");

                // Populate activity report
                for (let i = 0, j = 0; i < template.reportTemplate.activityDetails.length && j < testResults.length; i++, j++) {
                    const detailsTemplate: any = template.reportTemplate.activityDetails[i];
                    const testResult: any = testResults[j];
                    const testType: any = testResult.testTypes;

                    detailsTemplate.activity.value = (activity.activityType === "visit") ? ACTIVITY_TYPE.TEST : ACTIVITY_TYPE.WAIT_TIME;
                    detailsTemplate.startTime.value = moment(testResult.testStartTimestamp).tz(TIMEZONE.LONDON).format("HH:mm:ss");
                    detailsTemplate.finishTime.value = moment(testResult.testEndTimestamp).tz(TIMEZONE.LONDON).format("HH:mm:ss");
                    detailsTemplate.vrm.value = testResult.vrm;
                    detailsTemplate.testDescription.value = testType.testTypeName;
                    detailsTemplate.seatsAndAxles.value = (testResult.vehicleType === "psv") ? testResult.numberOfSeats : "" ;
                    detailsTemplate.result.value = testType.testResult;
                    detailsTemplate.certificateNumber.value = testType.certificateNumber;
                    detailsTemplate.expiryDate.value = moment(testType.testExpiryDate).tz(TIMEZONE.LONDON).format("DD/MM/YYYY");
                }

                return template.workbook.xlsx.writeBuffer()
                .then((buffer: Excel.Buffer) => {
                    return {
                        // tslint:disable-next-line
                        fileName: `ATFReport_${moment(activity.startTime).tz(TIMEZONE.LONDON).format("DD-MM-YYYY")}_${moment(activity.startTime).tz(TIMEZONE.LONDON).format("HHmm")}_${activity.testStationPNumber}_${activity.testerName}.xlsx`,
                        fileBuffer: buffer,
                        testResults
                    };
                });
            });
        }).catch((error: any) => {
            console.log(error);
            throw new HTTPError(500, ERRORS.ATF_CANT_BE_CREATED);
        });
    }

    /**
     * Create a template of excel cell locations for inserting expected values in the correct place
     * @param totalActivities - the total number of activities that will be displayed.
     * this is used for determining how many rows the table will have
     */
    public fetchATFTemplate(totalActivities: number) {
        const workbook = new Excel.Workbook();
        return workbook.xlsx.readFile(path.resolve(__dirname, "../resources/atf_report_template.xlsx"))
        .then((template: Excel.Workbook) => {
            // Index starts at 1
            const reportSheet: Excel.Worksheet = template.getWorksheet(1);

            // Change file metadata
            template.creator = "Commercial Vehicles Services Beta Team";
            // @ts-ignore
            template.company = "Drivers and Vehicles Standards Agency";
            reportSheet.name = "ATF Report";
            delete template.lastModifiedBy;

            // Map values
            const atfReportTemplate: any = {
                siteVisitDetails: {
                    assesor: reportSheet.getCell("D10"),
                    siteName: reportSheet.getCell("G10"),
                    siteNumber: reportSheet.getCell("G11"),
                    date: reportSheet.getCell("D11"),
                    startTime: reportSheet.getCell("D12")
                },
                declaration: {
                    date: reportSheet.getCell("D17"),
                    finishTime: reportSheet.getCell("G17")
                },
                activityDetails: Array.from({ length: totalActivities }, (v, k) => {
                    return {
                        activity: reportSheet.getCell(`C${25 + k}`),
                        startTime: reportSheet.getCell(`D${25 + k}`),
                        finishTime: reportSheet.getCell(`E${25 + k}`),
                        vrm: reportSheet.getCell(`F${25 + k}`),
                        testDescription: reportSheet.getCell(`G${25 + k}`),
                        seatsAndAxles: reportSheet.getCell(`H${25 + k}`),
                        result: reportSheet.getCell(`I${25 + k}`),
                        certificateNumber: reportSheet.getCell(`J${25 + k}`),
                        expiryDate: reportSheet.getCell(`K${25 + k}`)
                    };
                })
            };

            reportSheet.getCell("C20").value = {
                richText: [
                    { font: { bold: true }, text: "Data Protection" },
                    { text: "\nThe information provided on this form will be used for the purposes of DVSA statutory functions. " },
                    { text: "It will not be disclosed to other organisations unless required or permitted by law. " },
                    { text: "For further information, visit our charter information available from DVSA website www.gov.uk/dvsa" },
                ]
            };

            // Fix styling
            reportSheet.getImages().forEach((img: any) => {
                img.range.tl = { col: 2, row: 1 };
                img.range.br = { col: 3.00001, row: 8 };
            });

            reportSheet.getCell("D16").border = {
                right: { style: "medium" },
                left: { style: "medium" },
                top: { style: "medium" },
                bottom: { style: "medium" }
            };

            Object.values(atfReportTemplate.siteVisitDetails).forEach((cell: any) => {
                this.addCellStyle(cell);
            });

            Object.values(atfReportTemplate.declaration).forEach((cell: any) => {
                this.addCellStyle(cell);
            });

            atfReportTemplate.activityDetails.forEach((detailsTemplate: any) => {
                Object.values(detailsTemplate).forEach((cell: any) => {
                    this.addCellStyle(cell);
                });
            });

            return {
                workbook,
                reportTemplate: atfReportTemplate
            };
        });
    }

    /**
     * Adds styling to a given cell
     * @param cell - the cell to add style to
     */
    private addCellStyle(cell: any) {
        cell.border = {
            right: { style: "medium" },
            left: { style: "medium" },
            top: { style: "medium" },
            bottom: { style: "medium" }
        };

        cell.alignment = { horizontal: "left" };
    }

}

export {ReportGenerationService};
