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
import {IActivitiesList, IActivity, ITestResults} from "../models";
import {ACTIVITY_TYPE} from "../assets/enum";

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
    const activitiesList = this.computeActivitiesList(generationServiceResponse.testResults, generationServiceResponse.waitActivities);
    return this.s3BucketService.upload(`cvs-atf-reports-${process.env.BUCKET}`, generationServiceResponse.fileName, generationServiceResponse.fileBuffer)
      .then((result: any) => {
        return this.testStationsService.getTestStationEmail(visit.testStationPNumber)
          .then((response: any) => {
            const sendNotificationData = this.notificationData.generateActivityDetails(visit, activitiesList);
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

  private computeActivitiesList(testResultsList: ITestResults[], waitActivitiesList: IActivity[]) {
    let list : IActivitiesList[] = [];
    // Adding Test activities to the list
    for (const [index, testResult] of testResultsList.entries()) {
      const act: IActivitiesList = {
        startTime: testResult.testTypes.testTypeStartTimestamp,
        activityType: ACTIVITY_TYPE.TEST,
        activity: testResult
      }
      list.push(act);
    }
    // Adding Wait activities to the list
    for (const [index, waitTime] of waitActivitiesList.entries()) {
      const act: IActivitiesList = {
        startTime: waitTime.startTime,
        activityType: ACTIVITY_TYPE.TIME_NOT_TESTING,
        activity: waitTime
      }
      list.push(act);
    }
    // Sorting the list by StartTime
    const sortDateAsc = (date1: any, date2: any) => {
      const date = new Date(date1.startTime).toISOString();
      const dateToCompare = new Date(date2.startTime).toISOString();
      if (date > dateToCompare) { return 1; }
      if (date < dateToCompare) { return -1; }
      return 0;
    };
    console.log(`Sorting the list`);
    list.sort(sortDateAsc);
    return list;
  }
}

export { SendATFReport };
