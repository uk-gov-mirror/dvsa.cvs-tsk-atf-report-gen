const mockProcessRecord = jest.fn();

import { reportGen } from "../../src/functions/reportGen";
import { ReportGenerationService } from "../../src/services/ReportGenerationService";
import { SendATFReport } from "../../src/services/SendATFReport";
// import mockConfig from "../util/mockConfig";

jest.mock("../../src/services/ReportGenerationService");
jest.mock("../../src/services/SendATFReport");

const mockPayload = '{"eventID":"f9e63bf29bd6adf174e308201a97259f","eventName":"MODIFY","eventVersion":"1.1","eventSource":"aws:dynamodb","awsRegion":"eu-west-1","dynamodb":{"ApproximateCreationDateTime":1711549645,"Keys":{"id":{"S":"6e4bd304-446e-4678-8289-dasdasjkl"}},"NewImage":{"testerStaffId":{"S":"132"},"testStationPNumber":{"S":"87-1369564"},"testerEmail":{"S":"tester@dvsa.gov.uk1111"},"testStationType":{"S":"gvts"},"testStationEmail":{"S":"teststationname@dvsa.gov.uk"},"startTime":{"S":"2022-01-01T10:00:40.561Z"},"endTime":{"S":"2022-01-01T10:00:40.561Z"},"id":{"S":"6e4bd304-446e-4678-8289-dasdasjkl"},"testStationName":{"S":"Rowe, Wunsch and Wisoky"},"activityType":{"S":"visit"},"activityDay":{"S":"2022-01-01"},"testerName":{"S":"namey mcname"}},"OldImage":{"testerStaffId":{"S":"132"},"testStationPNumber":{"S":"87-1369564"},"testerEmail":{"S":"tester@dvsa.gov.uk1111"},"testStationType":{"S":"gvts"},"testStationEmail":{"S":"teststationname@dvsa.gov.uk"},"startTime":{"S":"2022-01-01T10:00:40.561Z"},"endTime":{"S":"2022-01-01T10:00:40.561Z"},"id":{"S":"6e4bd304-446e-4678-8289-dasdasjkl"},"testStationName":{"S":"Rowe, Wunsch and Wisoky"},"activityType":{"S":"visit"},"activityDay":{"S":"2022-01-01"},"testerName":{"S":"231232132"}},"SequenceNumber":"1234","SizeBytes":704,"StreamViewType":"NEW_AND_OLD_IMAGES"},"eventSourceARN":"arn:aws::eu--1::/cvs---//:32:37.491"}'

describe("Retro Gen Function", () => {
  beforeAll(() => jest.setTimeout(60000));
  afterAll(() => {
    jest.setTimeout(5000);
    return new Promise((r) => setTimeout(r, 0));
  });
  // const ctx = mockContext();
  // mockConfig();
  const ctx = {};
  context("Receiving an empty event (of various types)", () => {
    it("should throw errors (event = {})", async () => {
      expect.assertions(1);
      try {
        await reportGen({}, ctx as any, () => {
          return;
        });
      } catch (e) {
        expect(e.message).toEqual("Event is empty");
      }
    });
    it("should throw errors (event = null)", async () => {
      expect.assertions(1);
      try {
        await reportGen(null, ctx as any, () => {
          return;
        });
      } catch (e) {
        expect(e.message).toEqual("Event is empty");
      }
    });
    it("should throw errors (event has no records)", async () => {
      expect.assertions(1);
      try {
        await reportGen({ something: true }, ctx as any, () => {
          return;
        });
      } catch (e) {
        expect(e.message).toEqual("Event is empty");
      }
    });
    it("should throw errors (event Records is not array)", async () => {
      expect.assertions(1);
      try {
        await reportGen({ Records: true }, ctx as any, () => {
          return;
        });
      } catch (e) {
        expect(e.message).toEqual("Event is empty");
      }
    });
    it("should throw errors (event Records array is empty)", async () => {
      expect.assertions(1);
      try {
        await reportGen({ Records: [] }, ctx as any, () => {
          return;
        });
      } catch (e) {
        expect(e.message).toEqual("Event is empty");
      }
    });
  });

  context("Inner services fail", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("Should throw an error (generateATFReport fails)", async () => {
      ReportGenerationService.prototype.generateATFReport = jest.fn().mockRejectedValue(new Error("Oh no!"));
      mockProcessRecord.mockReturnValueOnce("All good");
      expect.assertions(1);
      try {
        await reportGen({ Records: [{ body: mockPayload }] }, ctx as any, () => {
          return;
        });
      } catch (e) {
        expect(e.message).toEqual("Oh no!");
      }
    });
    it("Should throw an error (bucket upload fails)", async () => {
      ReportGenerationService.prototype.generateATFReport = jest.fn().mockResolvedValue("Looking good");
      SendATFReport.prototype.sendATFReport = jest.fn().mockRejectedValue(new Error("Oh dear"));
      mockProcessRecord.mockReturnValueOnce("All good");
      expect.assertions(1);
      try {
        await reportGen({ Records: [{ body: mockPayload }] }, ctx as any, () => {
          return;
        });
      } catch (e) {
        expect(e.message).toEqual("Oh dear");
      }
    });
  });
});
