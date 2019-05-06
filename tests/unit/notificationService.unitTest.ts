import { describe } from "mocha";
import { expect } from "chai";
import { Configuration } from "../../src/utils/Configuration";
import { NotificationService } from "../../src/services/NotificationService";
// @ts-ignore
import { NotifyClient } from "notifications-node-client";
import * as fs from "fs";
import * as path from "path";
import { NotificationData } from "../../src/utils/generateNotificationData";

describe("notification service", () => {
    context("send email", () => {
        const notifyClient = new NotifyClient(Configuration.getInstance().getGovNotifyConfig().api_key);
        const notifyService: NotificationService = new NotificationService(notifyClient);
        const event: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/queue-event.json"), "utf8"));
        const visit: any = JSON.parse(event.Records[0].body);
        const testResultsList: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-200-response.json"), "utf8"));
        const testResultsArray = JSON.parse(testResultsList.body);
        const notificationData: NotificationData = new NotificationData();
        const sendNotificationData = notificationData.generateActivityDetails(visit, testResultsArray);

        context("when sending email with the correct data and emails", () => {
            it("should return a correct response", () => {
                return notifyService.sendNotification(sendNotificationData, ["test@test.com"]).then((response: any) => {
                    response = JSON.parse(response[0].request.body);
                    expect(response.template_id).to.equal("368a62fa-f826-4be6-92c3-c555e3d7e0a3");
                    expect(response.email_address).to.equal("test@test.com");
                    expect(response.personalisation.testStationPNumber).to.equal("87-1369569");
                    expect(response.personalisation.testerName).to.equal("Gica");
                    expect(response.personalisation.startTimeDate).to.equal("14/01/2019");
                    expect(response.personalisation.startTime).to.equal("08:47:33");
                    expect(response.personalisation.endTime).to.equal("15:36:33");
                    expect(response.personalisation.testStationName).to.equal("Rowe, Wunsch and Wisoky");
                    expect(response.personalisation.activityDetails.length).to.not.equal(0);
                    expect(response.personalisation.activityType).to.equal("visit");
                });
            });
        });
    });
});
