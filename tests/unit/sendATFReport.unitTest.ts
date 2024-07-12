import { NotificationService } from "../../src/services/NotificationService";
import { SendATFReport } from "../../src/services/SendATFReport";
// @ts-ignore
import { NotifyClient } from "notifications-node-client";
import mockConfig from "../util/mockConfig";
import { ActivityType } from "@dvsa/cvs-type-definitions/types/v1/enums/activityType.enum";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";
import { TestStationTypes } from "@dvsa/cvs-type-definitions/types/v1/enums/testStationType.enum";
import { TestStatus } from "@dvsa/cvs-type-definitions/types/v1/enums/testStatus.enum";
import { TestResultSchema, TestTypeSchema } from "@dvsa/cvs-type-definitions/types/v1/test-result";

describe("sendATFReport", () => {
  mockConfig();
  context("ATF report sent by email",
    () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });
      const visit = {
        id: "5e4bd304-446e-4678-8289-d34fca9256e9",
        activityType: ActivityType.VISIT,
        testStationName: "Rowe, Wunsch and Wisoky",
        testStationPNumber: "87-1369569",
        testStationEmail: "teststationname@dvsa.gov.uk",
        testStationType: TestStationTypes.GVTS,
        testerName: "Gica",
        testerEmail: "test@dvsa.gov.uk",
        testerStaffId: "1",
        startTime: "2019-01-14T08:47:33.987Z",
        endTime: "2019-01-14T15:36:33.987Z",
      };
      const generationServiceResponse = {
        waitActivities: [] as ActivitySchema[],
        testResults: [
          {
            testResultId: "234234324-3423432-434-3423",
            testStationName: "Rowe, Wunsch and Wisoky",
            testStationType: TestStationTypes.GVTS,
            testerName: "tester name",
            testerStaffId: "1",
            vrm: "JY58FPP",
            testStationPNumber: "87-1369569",
            preparerId: "ak4434",
            numberOfSeats: 45,
            testStartTimestamp: "2019-01-14T10:36:33.987Z",
            testEndTimestamp: "2019-01-14T10:36:33.987Z",
            testTypes: [{
              prohibitionIssued: false,
              testNumber: "1",
              testAnniversaryDate: "2019-12-22T08:47:59.749Z",
              additionalCommentsForAbandon: "none",
              numberOfSeatbeltsFitted: 2,
              testTypeEndTimestamp: "2019-01-14T10:36:33.987Z",
              reasonForAbandoning: "none",
              lastSeatbeltInstallationCheckDate: "2019-01-14",
              testExpiryDate: "2020-02-21T08:47:59.749Z",
              testTypeId: "1",
              testTypeStartTimestamp: "2019-01-14T10:36:33.987Z",
              certificateNumber: "1234",
              testTypeName: "Annual test",
              seatbeltInstallationCheckDate: true,
              additionalNotesRecorded: "VEHICLE FRONT REGISTRATION PLATE MISSING",
              defects: [
                {
                  deficiencyCategory: "major",
                  deficiencyText: "missing.",
                  prs: false,
                  additionalInformation: {
                    location: {
                      axleNumber: null,
                      horizontal: null,
                      vertical: null,
                      longitudinal: "front",
                      rowNumber: null,
                      lateral: null,
                      seatNumber: null,
                    },
                    notes: "None",
                  },
                  itemNumber: 1,
                  deficiencyRef: "1.1.a",
                  stdForProhibition: false,
                  deficiencySubId: null,
                  imDescription: "Registration Plate",
                  deficiencyId: "a",
                  itemDescription: "A registration plate:",
                  imNumber: 1,
                },
              ],
              name: "Annual test",
              testResult: "pass",
            }] as TestTypeSchema[],
            vin: "XMGDE02FS0H012345",
            vehicleType: "psv",
            testerEmailAddress: "teststationname@dvsa.gov.uk",
            testStatus: TestStatus.SUBMITTED,
            reasonForCancellation: "reason",
            systemNumber: "232432411",
            vehicleClass: {
              code: "2",
              description: "desc"
            },
            vehicleConfiguration: "rigit",
            preparerName: "preparer",
            euVehicleCategory: "l3e",
            countryOfRegistration: "UK",
            noOfAxles: 4,
            numberOfWheelsDriven: 2
          },
        ] as TestResultSchema[],
        fileName: "ATFReport_14-01-2019_0847_87-1369569_Gica.xlsx",
        fileBuffer: "<Buffer 50 4b 03 04 0a 00 00 00 08 00 c6 64 c3 4e 19 f8 08 be 60 01 00 00 39 05 00 00 13 00 00 00 5b 43 6f 6e 74 65 6e 74 5f 54 79 70 65 73 5d 2e 78 6d 6c ad ... >",
      };

      context("When the Test Stations service throws an error", () => {
        it("should bubble up that error", () => {
          const sendATFReport: SendATFReport = new SendATFReport();
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
          sendATFReport.notifyService = new NotificationService(new NotifyClient());
          sendATFReport.notifyService.sendNotification = jest.fn().mockRejectedValue(new Error("It Broke"));
          sendATFReport.testStationsService.getTestStationEmail = jest.fn().mockResolvedValue([
            {
              testStationPNumber: "09-4129632",
              testStationEmails: ["teststationname@dvsa.gov.uk"],
              testStationId: "9",
            },
          ]);
          expect.assertions(1);
          return sendATFReport.sendATFReport(generationServiceResponse, visit).catch((error: any) => {
            expect(error.message).toEqual("It Broke");
          });
        });
      });

      context("When ATF email is blank", () => {
        it("skip Notify and log a message", () => {
          const sendATFReport: SendATFReport = new SendATFReport();
          sendATFReport.notifyService = new NotificationService(new NotifyClient());
          const notifyMock = jest.fn().mockResolvedValue(true);
          sendATFReport.notifyService.sendNotification = notifyMock;

          jest.spyOn(console, "log");

          sendATFReport.testStationsService.getTestStationEmail = jest.fn().mockResolvedValue([
            {
              testStationPNumber: "87-1369569",
              testStationEmails: [],
              testStationId: "9",
            },
          ]);
          expect.assertions(2);
          return sendATFReport.sendATFReport(generationServiceResponse, visit).then((response: any) => {
            expect(console.log).toBeCalledWith(`No email address exists for test station PNumber ${visit.testStationPNumber}`);
            expect(console.log).toBeCalledTimes(1);
          });
        });
      });

      context("When services succeed", () => {
        it("should return success and details of storage", () => {
          const sendATFReport: SendATFReport = new SendATFReport();
          sendATFReport.notifyService = new NotificationService(new NotifyClient());
          const notifyMock = jest.fn().mockResolvedValue(true);
          sendATFReport.notifyService.sendNotification = notifyMock;
          sendATFReport.testStationsService.getTestStationEmail = jest.fn().mockResolvedValue([
            {
              testStationPNumber: "09-4129632",
              testStationEmails: ["teststationname@dvsa.gov.uk", "anotherteststationname@dvsa.gov.uk"],
              testStationId: "9",
            },
          ]);
          expect.assertions(1);
          return sendATFReport.sendATFReport(generationServiceResponse, visit).then((response: any) => {
            const notifyCallArgs = notifyMock.mock.calls[0];
            expect(notifyCallArgs[1]).toEqual(["test@dvsa.gov.uk", "teststationname@dvsa.gov.uk", "anotherteststationname@dvsa.gov.uk"]);
          });
        });
      });
    });
});
