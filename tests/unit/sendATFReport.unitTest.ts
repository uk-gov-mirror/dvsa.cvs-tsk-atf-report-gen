import { SendATFReport } from "../../src/services/SendATFReport";
import mockConfig from "../util/mockConfig";

describe("sendATFReport", () => {
  mockConfig();
  context("ATF report upload to S3 Bucket and sent by email", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    const visit = {
      id: "5e4bd304-446e-4678-8289-d34fca9256e9",
      activityType: "visit",
      testStationName: "Rowe, Wunsch and Wisoky",
      testStationPNumber: "87-1369569",
      testStationEmail: "teststationname@dvsa.gov.uk",
      testStationType: "gvts",
      testerName: "Gica",
      testerStaffId: "1",
      startTime: "2019-01-14T08:47:33.987Z",
      endTime: "2019-01-14T15:36:33.987Z"
    };
    const generationServiceResponse = {
        waitActivities:[],
      testResults:
        [ { testerStaffId: "1",
          vrm: "JY58FPP",
          testStationPNumber: "87-1369569",
          preparerId: "ak4434",
          numberOfSeats: 45,
          testStartTimestamp: "2019-01-14T10:36:33.987Z",
          testEndTimestamp: "2019-01-14T10:36:33.987Z",
          testTypes: [Object],
          vin: "XMGDE02FS0H012345",
          vehicleType: "psv" } ],
      fileName: "ATFReport_14-01-2019_0847_87-1369569_Gica.xlsx",
      fileBuffer:
        "<Buffer 50 4b 03 04 0a 00 00 00 08 00 c6 64 c3 4e 19 f8 08 be 60 01 00 00 39 05 00 00 13 00 00 00 5b 43 6f 6e 74 65 6e 74 5f 54 79 70 65 73 5d 2e 78 6d 6c ad ... >",
      };

    context("When the s3Bucket service throws an error", () => {
      it("should bubble up that error", () => {
        const sendATFReport: SendATFReport = new SendATFReport();
        sendATFReport.s3BucketService.upload = jest.fn().mockRejectedValue(new Error("Nope"));
        expect.assertions(1);
        return sendATFReport.sendATFReport(generationServiceResponse, visit).catch((error: any) => {
          expect(error.message).toEqual("Nope");
        });
      });
    });

    context("When the Test Stations service throws an error", () => {
      it("should bubble up that error", () => {
        const sendATFReport: SendATFReport = new SendATFReport();
        sendATFReport.s3BucketService.upload = jest.fn().mockResolvedValue("ok");
        sendATFReport.testStationsService.getTestStationEmail = jest.fn().mockRejectedValue(new Error("It Broke"));
        expect.assertions(1);
        return sendATFReport.sendATFReport(generationServiceResponse, visit).catch((error: any) => {
          expect(error.message).toEqual("It Broke");
        });
      });
    });

    context("When the Notification service throws an error", () => {
      it("should bubble up that error", () => {
        const sendATFReport: SendATFReport = new SendATFReport();
        sendATFReport.s3BucketService.upload = jest.fn().mockResolvedValue("ok");
        sendATFReport.testStationsService.getTestStationEmail = jest.fn().mockResolvedValue([{
          testStationPNumber: "09-4129632",
          testStationEmails: [
            "teststationname@dvsa.gov.uk"
          ],
          testStationId: "9"
        }]);
        // @ts-ignore
        sendATFReport.notifyService.sendNotification = jest.fn().mockRejectedValue(new Error("It Broke"));
        expect.assertions(1);
        return sendATFReport.sendATFReport(generationServiceResponse, visit).catch((error: any) => {
          expect(error.message).toEqual("It Broke");
        });
      });
    });

    context("When services succeed", () => {
      it("should return success and details of storage", () => {
        const sendATFReport: SendATFReport = new SendATFReport();
        sendATFReport.s3BucketService.upload = jest.fn().mockResolvedValue("details from s3");
        sendATFReport.testStationsService.getTestStationEmail = jest.fn().mockResolvedValue([{
          testStationPNumber: "09-4129632",
          testStationEmails: [
            "teststationname@dvsa.gov.uk"
          ],
          testStationId: "9"
        }]);
        const notifyMock = jest.fn().mockResolvedValue("We won!");
        // @ts-ignore
        sendATFReport.notifyService.sendNotification = notifyMock;
        expect.assertions(2);
        return sendATFReport.sendATFReport(generationServiceResponse, visit).then((response: any) => {
          const notifyCallArgs = notifyMock.mock.calls[0];
          expect(notifyCallArgs[1]).toEqual(["teststationname@dvsa.gov.uk"]);
          expect(response).toEqual("details from s3");
        });
      });
    });
  });
});
