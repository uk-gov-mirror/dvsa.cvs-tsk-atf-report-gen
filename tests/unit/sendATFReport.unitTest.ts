import { describe } from "mocha";
import { expect } from "chai";
import { SendATFReport } from "../../src/services/SendATFReport";
import { Injector } from "../../src/models/injector/Injector";
import { S3BucketMockService } from "../models/S3BucketMockService";
import { LambdaMockService } from "../models/LambdaMockService";
import { TestStationsService } from "../../src/services/TestStationsService";

describe("sendATFReport", () => {
    context("ATF report upload to S3 Bucket and sent by email", () => {
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

      it("When the bucket is not defined should throw error", () => {
        const sendATFReport: SendATFReport = new SendATFReport();
        sendATFReport.s3BucketService = Injector.resolve<S3BucketMockService>(S3BucketMockService);
        return sendATFReport.sendATFReport(generationServiceResponse, visit).then((response: any) => {
          expect.fail();
        }).catch((error: any) => {
          expect(error.statusCode).to.be.equal(404);
          expect(error.message).to.be.equal("The specified bucket does not exist.");
        });
      });

      it("When the bucket is defined should return", () => {
        LambdaMockService.populateFunctions();
        const sendATFReport: SendATFReport = new SendATFReport();
        sendATFReport.testStationsService = Injector.resolve<TestStationsService>(TestStationsService, [LambdaMockService]);
        sendATFReport.s3BucketService = Injector.resolve<S3BucketMockService>(S3BucketMockService);
        S3BucketMockService.buckets.push({
          files: ["ATFReport_14-01-2019_0847_87-1369569_Gica.xlsx"],
          bucketName: `cvs-atf-reports-${process.env.BUCKET}`
        });
        return sendATFReport.sendATFReport(generationServiceResponse, visit).then((response: any) => {
          expect(response.Bucket).to.be.equal(`cvs-atf-reports-${process.env.BUCKET}`);
          expect(response.Key).to.be.equal("ATFReport_14-01-2019_0847_87-1369569_Gica.xlsx");
          expect(response.Location.length).to.be.at.least(1);
          expect(response.ETag.length).to.be.at.least(1);

        });
      });
    });
});
