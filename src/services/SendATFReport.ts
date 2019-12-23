// @ts-ignore
import { NotifyClient } from "notifications-node-client";
import { Lambda, S3 } from "aws-sdk";
import { ACTIVITY_TYPE } from "../assets/enum";
import { Configuration } from "../utils/Configuration";
import { IActivitiesList, IActivity, ITestResults } from "../models";
import { LambdaService } from "./LambdaService";
import { NotificationData } from "../utils/generateNotificationData";
import { NotificationService } from "./NotificationService";
import { S3BucketService } from "./S3BucketService";
import { TestStationsService } from "./TestStationsService";

class SendATFReport {
  public s3BucketService: S3BucketService;
  public testStationsService: TestStationsService;
  private readonly notificationData: NotificationData;
  private readonly notifyService: NotificationService;
  private readonly notifyClient: NotifyClient;

  constructor() {
    this.s3BucketService = new S3BucketService(new S3());
    this.testStationsService = new TestStationsService(new LambdaService( new Lambda()));
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
    // Add testResults and waitActivities in a common list and sort it by startTime
    const activitiesList = this.computeActivitiesList(generationServiceResponse.testResults, generationServiceResponse.waitActivities);
    console.log("CHECK HERE THE ACTIVITIES LIST ->", activitiesList);
    return this.s3BucketService.upload(`cvs-atf-reports-${process.env.BUCKET}`, generationServiceResponse.fileName, generationServiceResponse.fileBuffer)
      .then((result: any) => {
        return this.testStationsService.getTestStationEmail(visit.testStationPNumber)
          .then((response: any) => {
            const sendNotificationData = this.notificationData.generateActivityDetails(visit, activitiesList);
            console.log("CHECK SENDNOTIFICATIONDAATA HERE ->", sendNotificationData);
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

  /**
   * Method to collate testResults and waitActivities into a common list
   * and then sort them on startTime to display the activities in a sequence.
   * @param testResultsList: testResults list
   * @param waitActivitiesList: wait activities list
   */
  public computeActivitiesList(testResultsList: ITestResults[], waitActivitiesList: IActivity[]) {
    const list: IActivitiesList[] = [];
    // Adding Test activities to the list
    for (const testResult of testResultsList) {
      const act: IActivitiesList = {
        startTime: testResult.testTypes.testTypeStartTimestamp,
        activityType: ACTIVITY_TYPE.TEST,
        activity: testResult
      };
      list.push(act);
    }
    // Adding Wait activities to the list
    for (const waitTime of waitActivitiesList) {
      const act: IActivitiesList = {
        startTime: waitTime.startTime,
        activityType: ACTIVITY_TYPE.TIME_NOT_TESTING,
        activity: waitTime
      };
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
    // Sort the list by startTime
    list.sort(sortDateAsc);
    return list;
  }
}

export { SendATFReport };
