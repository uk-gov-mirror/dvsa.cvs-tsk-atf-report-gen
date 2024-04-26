// @ts-ignore
import { NotifyClient } from "notifications-node-client";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { ACTIVITY_TYPE, EMAIL_TYPE } from "../assets/enum";
import { Configuration } from "../utils/Configuration";
import { IActivitiesList, IActivity, ITestResults } from "../models";
import { LambdaService } from "./LambdaService";
import { NotificationData } from "../utils/generateNotificationData";
import { NotificationService } from "./NotificationService";
import { TestStationsService } from "./TestStationsService";

class SendATFReport {
  public testStationsService: TestStationsService;
  public notifyService: NotificationService | undefined;
  private readonly notificationData: NotificationData;
  private apiKey: string | undefined;

  constructor() {
    this.testStationsService = new TestStationsService(new LambdaService(new LambdaClient()));
    this.notificationData = new NotificationData();
  }

  /**
   * Service that sends ATF Report emails to the Test Stations Email
   * @param generationServiceResponse - The response from the ATF generation service
   * @param visit - Data about the current visit
   */
  public async sendATFReport(generationServiceResponse: any, visit: any): Promise<any> {
    // Add testResults and waitActivities in a common list and sort it by startTime
    const activitiesList = this.computeActivitiesList(generationServiceResponse.testResults, generationServiceResponse.waitActivities);

    const response = await this.testStationsService.getTestStationEmail(visit.testStationPNumber);
    const sendNotificationData = this.notificationData.generateActivityDetails(visit, activitiesList);
    if (!this.notifyService) {
      if (!this.apiKey) {
        this.apiKey = (await Configuration.getInstance().getGovNotifyConfig()).api_key;
      }
      this.notifyService = new NotificationService(new NotifyClient(this.apiKey));
    }
    // VTM allows blank email addresses on a test-station record so check before sending
    if (response[0].testStationEmails && response[0].testStationEmails.length > 0) {
      await this.notifyService.sendNotification(sendNotificationData, response[0].testStationEmails, EMAIL_TYPE.ATF, visit.id);
    } else {
      console.log(`No email address exists for test station PNumber ${visit.testStationPNumber}`);
    }
    return this.notifyService.sendNotification(sendNotificationData, [visit.testerEmail], EMAIL_TYPE.VSA, visit.id);
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
        activity: testResult,
      };
      list.push(act);
    }
    // Adding Wait activities to the list
    for (const waitTime of waitActivitiesList) {
      const act: IActivitiesList = {
        startTime: waitTime.startTime,
        activityType: ACTIVITY_TYPE.TIME_NOT_TESTING,
        activity: waitTime,
      };
      list.push(act);
    }
    // Sorting the list by StartTime
    const sortDateAsc = (date1: any, date2: any) => {
      const date = new Date(date1.startTime).toISOString();
      const dateToCompare = new Date(date2.startTime).toISOString();
      if (date > dateToCompare) {
        return 1;
      }
      if (date < dateToCompare) {
        return -1;
      }
      return 0;
    };
    // Sort the list by startTime
    list.sort(sortDateAsc);
    return list;
  }
}

export { SendATFReport };
