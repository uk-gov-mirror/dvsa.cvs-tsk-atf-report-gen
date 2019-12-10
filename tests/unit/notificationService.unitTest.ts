import { NotificationService } from "../../src/services/NotificationService";
import { NotificationData } from "../../src/utils/generateNotificationData";
import { SendATFReport } from "../../src/services/SendATFReport";
import event from "../resources/queue-event.json";
import testResultsList from "../resources/test-results-200-response.json";
import waitActivitiesList from "../resources/wait-time-response.json";
import { TEMPLATE_IDS } from "../../src/assets/enum";
import { TestResultsService } from "../../src/services/TestResultsService";
import mockConfig from "../util/mockConfig";
jest.mock("notifications-node-client");

describe("notification service", () => {
    mockConfig();
    afterAll(() => {
        jest.restoreAllMocks();
        jest.resetModuleRegistry();
    });
    context("send email", () => {
        context("when sending email with the correct data and emails", () => {
            it("should invoke the NotificationClient with correct arguments", async () => {
                const visit: any = JSON.parse(event.Records[0].body);
                const testResultsArray = TestResultsService.prototype.expandTestResults(JSON.parse(testResultsList.body));
                const waitActivitesArray = JSON.parse(waitActivitiesList.body);
                const sendAtfReport: SendATFReport = new SendATFReport();
                const notificationData: NotificationData = new NotificationData();
                const sendNotificationData = notificationData.generateActivityDetails(visit, sendAtfReport.computeActivitiesList(testResultsArray, waitActivitesArray));

                const sendEmailMock = jest.fn();
                const notifyClientMock = jest.fn().mockImplementation(() => {
                    return {
                        sendEmail: sendEmailMock
                    };
                });
                const notifyService: NotificationService = new NotificationService(new notifyClientMock());

                await notifyService.sendNotification(sendNotificationData, ["test@test.com"]);
                const args = sendEmailMock.mock.calls[0];
                const personalisation = args[2].personalisation;
                expect(args[0]).toEqual(TEMPLATE_IDS.ATF_REPORT_TEMPLATE);
                expect(args[1]).toEqual("test@test.com");
                expect(personalisation.testStationPNumber).toEqual(visit.testStationPNumber);
                expect(personalisation.testStationName).toEqual(visit.testStationName);
                expect(personalisation.testerName).toEqual(visit.testerName);
            });
        });
    });
});
