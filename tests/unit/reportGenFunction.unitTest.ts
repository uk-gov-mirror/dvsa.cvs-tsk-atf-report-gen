import { ReportGenerationService } from "../../src/services/ReportGenerationService";
import { SendATFReport } from "../../src/services/SendATFReport";
import { reportGen } from "../../src/functions/reportGen";
import { ERRORS } from "../../src/assets/enum";

const mockProcessRecord = jest.fn();

jest.mock("../../src/services/ReportGenerationService");
jest.mock("../../src/services/SendATFReport");

const mockSQSPayload = {
  messageId: "059f36b4-87a3-44ab-83d2-661975830a7d",
  receiptHandle: "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a",
  body: JSON.stringify({
    dynamodb: {
      NewImage: {
        testerStaffId: { S: "132" },
        testStationPNumber: { S: "87-1369564" },
        testerEmail: { S: "tester@dvsa.gov.uk1111" },
        testStationType: { S: "gvts" },
        testStationEmail: { S: "teststationname@dvsa.gov.uk" },
        startTime: { S: "2022-01-01T10:00:40.561Z" },
        endTime: { S: "2022-01-01T10:00:40.561Z" },
        id: { S: "6e4bd304-446e-4678-8289-dasdasjkl" },
        testStationName: { S: "Rowe, Wunsch and Wisoky" },
        activityType: { S: "visit" },
        activityDay: { S: "2022-01-01" },
        testerName: { S: "Jon Mcdonald" }
      }
    }
  }),
  attributes: {
    ApproximateReceiveCount: "1",
    SentTimestamp: "1545082649183",
    SenderId: "AIDAIENQZJOLO23YVJ4VO",
    ApproximateFirstReceiveTimestamp: "1545082649185"
  },
  messageAttributes: {},
  md5OfBody: "e4e68fb7bd0e697a0ae8f1bb342846b3",
  eventSource: "aws:sqs",
  eventSourceARN: "arn:aws:sqs:region:123456789012:queue",
  awsRegion: "eu-west-1"
};

describe("Report Generation Lambda Function", () => {
  beforeAll(() => jest.setTimeout(60000));
  afterAll(() => {
    jest.setTimeout(5000);
    return new Promise((r) => setTimeout(r, 0));
  });

  const ctx = {};

  describe("When Receiving an invalid event", () => {
    it("should throw an error when it is empty", async () => {
      await expect(reportGen({}, ctx as any, () => {
        return;
      })).rejects.toThrow(ERRORS.EVENT_IS_EMPTY);
    });

    it("should throw an error when the event is null", async () => {
      await expect(reportGen(null, ctx as any, () => {
        return;
      })).rejects.toThrow(ERRORS.EVENT_IS_EMPTY);
    });

    it("should throw an error when the event has no records", async () => {
      await expect(reportGen({ something: true }, ctx as any, () => {
        return;
      })).rejects.toThrow(ERRORS.EVENT_IS_EMPTY);
    });

    it("should throw an error when the event records is not array", async () => {
      await expect(reportGen({ Records: true }, ctx as any, () => {
        return;
      })).rejects.toThrow(ERRORS.EVENT_IS_EMPTY);
    });

    it("should throw an error when the event records array is empty", async () => {
      await expect(reportGen({ Records: [] }, ctx as any, () => {
        return;
      })).rejects.toThrow(ERRORS.EVENT_IS_EMPTY);
    });
  });

  describe("Inner services fail", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("Should add to batchItemFailures when generateATFReport fails", async () => {
      ReportGenerationService.prototype.generateATFReport = jest.fn().mockRejectedValue(new Error("Oh no!"));
      mockProcessRecord.mockReturnValueOnce("All good");

      const result = await reportGen({ Records: [mockSQSPayload] }, ctx as any, () => {
        return;
      });

      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe(mockSQSPayload.messageId);
    });

    it("Should add to batchItemFailures when bucket upload fails", async () => {
      ReportGenerationService.prototype.generateATFReport = jest.fn().mockResolvedValue("Looking good");
      SendATFReport.prototype.sendATFReport = jest.fn().mockRejectedValue(new Error("Oh dear"));
      mockProcessRecord.mockReturnValueOnce("All good");

      const result = await reportGen({ Records: [mockSQSPayload] }, ctx as any, () => {
        return;
      });
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe(mockSQSPayload.messageId);
    });
  });
});
