import { Service } from "../models/injector/ServiceDecorator";
import { S3BucketService } from "../services/S3BucketService";
import { Injector } from "../models/injector/Injector";
import { Configuration } from "../utils/Configuration";
import { TestStationsService } from "./TestStationsService";
import { NotificationData } from "../utils/generateNotificationData";
import { NotificationService } from "./NotificationService";
// @ts-ignore
import { NotifyClient } from "notifications-node-client";
import { S3BucketMockService } from "../../tests/models/S3BucketMockService";

@Service()
class SendATFReport {
  public s3BucketService: S3BucketService | S3BucketMockService;
  public testStationsService: TestStationsService;
  private readonly notificationData: NotificationData;
  private readonly notifyService: NotificationService;
  private readonly notifyClient: NotifyClient;

  constructor() {
    this.s3BucketService = Injector.resolve<S3BucketService>(S3BucketService);
    this.testStationsService = Injector.resolve<TestStationsService>(TestStationsService);
    this.notificationData = new NotificationData();
    this.notifyClient = new NotifyClient(Configuration.getInstance().getGovNotifyConfig().api_key);
    this.notifyService = new NotificationService(this.notifyClient);
  }

/**
 * Service that uploads the ATF Report in S3 Bucket and send emails to the Test Stations Email
 * @param generationServiceResponse - The response from the ATF generation service
 * @param visit - Data about the current visit
 */
  public sendATFReport(generationServiceResponse: any, visit: any) {
    const testResultsList = generationServiceResponse.testResults;
    return this.s3BucketService.upload(`cvs-atf-reports-${process.env.BUCKET}`, generationServiceResponse.fileName, generationServiceResponse.fileBuffer)
      .then((result: any) => {
        return this.testStationsService.getTestStationEmail(visit.testStationPNumber)
          .then((response: any) => {
            const sendNotificationData = this.notificationData.generateActivityDetails(visit, testResultsList);
            return this.notifyService.sendNotification(sendNotificationData, response[0].testStationEmails).then(() => {
              return result;
            }).catch((error: any) => {
              console.log(error);
              throw error;
            });
          }).catch((error: any) => {
            console.log(error);
            throw error;
          });
      });
  }
}

export { SendATFReport };
