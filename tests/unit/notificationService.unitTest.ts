import { EMAIL_TYPE } from "../../src/assets/enum";
import { NotificationService } from "../../src/services/NotificationService";
import { SendATFReport } from "../../src/services/SendATFReport";
import { TestResultsService } from "../../src/services/TestResultsService";
import { NotificationData } from "../../src/utils/generateNotificationData";
import event from "../resources/queue-event.json";
import testResultsList from "../resources/test-results-200-response.json";
import waitActivitiesList from "../resources/wait-time-response.json";
import mockConfig from "../util/mockConfig";

jest.mock("notifications-node-client");

describe("notification service", () => {
  mockConfig();
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
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

        const sendEmailMock = jest.fn().mockResolvedValue({ data: "it worked" });
        const notifyClientMock = jest.fn().mockImplementation(() => {
          return {
            sendEmail: sendEmailMock,
          };
        });
        const notifyService: NotificationService = new NotificationService(new notifyClientMock());

        await notifyService.sendNotification(sendNotificationData, ["test@test.com"], EMAIL_TYPE.VSA, "3124124-12341243");
        const args = sendEmailMock.mock.calls[0];
        const personalisation = args[2].personalisation;
        expect(args[0]).toEqual("306d864b-a56d-49eb-b3cc-6d23cf8bcc26");
        expect(args[1]).toEqual("test@test.com");
        expect(personalisation.testStationPNumber).toEqual(visit.testStationPNumber);
        expect(personalisation.testStationName).toEqual(visit.testStationName);
        expect(personalisation.testerName).toEqual(visit.testerName);
      });
    });
  });
});
