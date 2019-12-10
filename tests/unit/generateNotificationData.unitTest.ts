import { ACTIVITY_TYPE } from "../../src/assets/enum";
import { Configuration } from "../../src/utils/Configuration";
import event from "../resources/queue-event.json";
import { LambdaMockService } from "../models/LambdaMockService";
import { NotificationData } from "../../src/utils/generateNotificationData";
import { SendATFReport } from "../../src/services/SendATFReport";
import testResultsList from "../resources/test-results-200-response.json";
import testResultsListMultiTest from "../resources/test-results-200-response-multi-test.json";
import { TestResultsService } from "../../src/services/TestResultsService";
import waitActivitiesList from "../resources/wait-time-response.json";
import mockConfig from "../util/mockConfig";

describe("notificationData", () => {
    mockConfig();
    context("report data generation", () => {
        const notificationData: NotificationData = new NotificationData();
        const sendAtfReport: SendATFReport = new SendATFReport();
        const visit: any = JSON.parse(event.Records[0].body);
        LambdaMockService.populateFunctions();

        context("when parsing the visit and the test results", () => {
            it("should return a correct test stations emails", () => {
                const testResultsArray = TestResultsService.prototype.expandTestResults(JSON.parse(testResultsList.body));
                const waitActivitiesArray = JSON.parse(waitActivitiesList.body);
                const sendNotificationData = notificationData.generateActivityDetails(visit, sendAtfReport.computeActivitiesList(testResultsArray, waitActivitiesArray));
                const detailsLines = sendNotificationData.activityDetails.split("\n");
                expect(detailsLines[0]).toContain(ACTIVITY_TYPE.TEST);
                expect(sendNotificationData.testStationPNumber).toEqual(testResultsArray[0].testStationPNumber);
                expect(sendNotificationData.testerName).toEqual(visit.testerName);
                expect(sendNotificationData.startTimeDate).toEqual("14/01/2019");
                expect(sendNotificationData.startTime).toEqual("08:47:33");
                expect(sendNotificationData.endTime).toEqual("15:36:33");
                expect(sendNotificationData.activityDetails.length).not.toEqual(0);
            });
        });

        context("when parsing the visit and multiple test results", () => {
            it("should return a correct test stations emails with dividers", () => {
                const testResultsArray = TestResultsService.prototype.expandTestResults(JSON.parse(testResultsListMultiTest.body));
                const sendNotificationData = notificationData.generateActivityDetails(visit, sendAtfReport.computeActivitiesList(testResultsArray, []));
                const detailsLines = sendNotificationData.activityDetails.split("\n");
                expect(detailsLines[0]).toContain(ACTIVITY_TYPE.TEST);
                expect(sendNotificationData.testStationPNumber).toEqual(testResultsArray[0].testStationPNumber);
                expect(sendNotificationData.testerName).toEqual(visit.testerName);
                expect(sendNotificationData.startTimeDate).toEqual("14/01/2019");
                expect(sendNotificationData.startTime).toEqual("08:47:33");
                expect(sendNotificationData.endTime).toEqual("15:36:33");
                expect(sendNotificationData.activityDetails.length).not.toEqual(0);
                expect(countInstances(sendNotificationData.activityDetails,"---")).toEqual(2);
            });
        });

        context("when parsing a Time Not Testing event", () => {
            it("should return correct test stations email data", () => {
                const waitActivitiesArray = JSON.parse(waitActivitiesList.body);
                const sendNotificationData = notificationData.generateActivityDetails(visit, sendAtfReport.computeActivitiesList([], waitActivitiesArray));
                const detailsLines = sendNotificationData.activityDetails.split("\n");
                // Title line
                expect(detailsLines[0]).toContain(ACTIVITY_TYPE.TIME_NOT_TESTING);
                // "Reason" line
                expect(detailsLines[2]).toContain("Break");
                expect(sendNotificationData.testerName).toEqual(visit.testerName);
                expect(sendNotificationData.startTimeDate).toEqual("14/01/2019");
                expect(sendNotificationData.startTime).toEqual("08:47:33");
                expect(sendNotificationData.endTime).toEqual("15:36:33");
            });
        });

    });


    context("configuration", () => {
        it("should return a correct MOT config", () => {
            const config = Configuration.getInstance().getGovNotifyConfig();
            expect(config.api_key.length).toBeGreaterThanOrEqual(1);
            expect(config.endpoint.length).toBeGreaterThanOrEqual(1);
        });
    });
});

const countInstances = (str: string, searchStr: string) => {
    const searchStrLen = searchStr.length;
    if (searchStrLen === 0) {
        return [];
    }
    let startIndex = 0;
    let index;
    const indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices.length;
};
