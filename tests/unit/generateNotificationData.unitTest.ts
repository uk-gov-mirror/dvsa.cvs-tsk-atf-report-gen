import { describe } from "mocha";
import { expect } from "chai";
import { LambdaMockService } from "../models/LambdaMockService";
import { NotificationData } from "../../src/utils/generateNotificationData";
import * as fs from "fs";
import * as path from "path";
import { Configuration } from "../../src/utils/Configuration";

describe("notificationData", () => {
    context("report data generation", () => {
        const notificationData: NotificationData = new NotificationData();
        const event: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/queue-event.json"), "utf8"));
        const visit: any = JSON.parse(event.Records[0].body);
        const testResultsList: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-200-response.json"), "utf8"));
        const testResultsListMultiTest: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-200-response-multi-test.json"), "utf8"));
        LambdaMockService.populateFunctions();
        context("when parsing the visit and the test results", () => {
            it("should return a correct test stations emails", () => {
                const testResultsArray = JSON.parse(testResultsList.body);
                const sendNotificationData = notificationData.generateActivityDetails(visit, testResultsArray);
                expect(sendNotificationData.testStationPNumber).to.equal(testResultsArray[0].testStationPNumber);
                expect(sendNotificationData.testerName).to.equal(visit.testerName);
                expect(sendNotificationData.startTimeDate).to.equal("14/01/2019");
                expect(sendNotificationData.startTime).to.equal("08:47:33");
                expect(sendNotificationData.endTime).to.equal("15:36:33");
                expect(sendNotificationData.activityType).to.equal("Test");
                expect(sendNotificationData.activityDetails.length).to.not.equal(0);
            });
        });

        context("when parsing the visit and multiple test results", () => {
            it("should return a correct test stations emails with dividers", () => {
                const testResultsArray = JSON.parse(testResultsListMultiTest.body);
                const sendNotificationData = notificationData.generateActivityDetails(visit, testResultsArray);
                expect(sendNotificationData.testStationPNumber).to.equal(testResultsArray[0].testStationPNumber);
                expect(sendNotificationData.testerName).to.equal(visit.testerName);
                expect(sendNotificationData.startTimeDate).to.equal("14/01/2019");
                expect(sendNotificationData.startTime).to.equal("08:47:33");
                expect(sendNotificationData.endTime).to.equal("15:36:33");
                expect(sendNotificationData.activityType).to.equal("Test");
                expect(sendNotificationData.activityDetails.length).to.not.equal(0);
                expect(countInstances(sendNotificationData.activityDetails,"---")).to.equal(2);
            });
        });
    });


    context("configuration", () => {
        it("should return a correct MOT config", () => {
            const config = Configuration.getInstance().getGovNotifyConfig();
            expect(config.api_key.length).to.be.at.least(1);
            expect(config.endpoint.length).to.be.at.least(1);
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
