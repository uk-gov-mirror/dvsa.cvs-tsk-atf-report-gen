import { LambdaClient } from "@aws-sdk/client-lambda";
// @ts-ignore
import { NotifyClient } from "notifications-node-client";
import { ACTIVITY_TYPE } from "../assets/enum";
import { IActivitiesList } from "../models";
import { Configuration } from "../utils/Configuration";
import { NotificationData } from "../utils/generateNotificationData";
import { LambdaService } from "./LambdaService";
import { NotificationService } from "./NotificationService";
import { TestStationsService } from "./TestStationsService";
import { TestResultSchema } from "@dvsa/cvs-type-definitions/types/v1/test-result";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";

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
  public async sendATFReport(generationServiceResponse: { testResults: TestResultSchema[]; waitActivities: ActivitySchema[]; }, visit: ActivitySchema) {
    // Add testResults and waitActivities in a common list and sort it by startTime
    // TODO RENAME
    const activitiesList = this.computeActivitiesList(generationServiceResponse.testResults, generationServiceResponse.waitActivities);

    const response = await this.testStationsService.getTestStationEmail(visit.testStationPNumber!);
    console.debug("get test stations responded");
    const sendNotificationData = this.notificationData.generateActivityDetails(visit, activitiesList);
    console.debug(`send notification data: ${JSON.stringify(sendNotificationData)}`);
    if (!this.notifyService) {
      if (!this.apiKey) {
        this.apiKey = (await Configuration.getInstance().getGovNotifyConfig()).api_key;
      }
      this.notifyService = new NotificationService(new NotifyClient(this.apiKey));
    }

    const emails = [visit.testerEmail!];
    // VTM allows blank email addresses on a test-station record so check before sending
    if (response[0].testStationEmails && response[0].testStationEmails.length > 0) {
      emails.push(...response[0].testStationEmails);
    } else {
      console.log(`No email address exists for test station PNumber ${visit.testStationPNumber}`);
    }
    await this.notifyService.sendNotification(sendNotificationData, emails, visit.id!);
  }

  /**
   * Method to collate testResults and waitActivities into a common list
   * and then sort them on startTime to display the activities in a sequence.
   * @param testResultsList
   * @param waitActivitiesList
   */
  public computeActivitiesList(testResultsList: TestResultSchema[], waitActivitiesList: ActivitySchema[]) {
    const list: IActivitiesList[] = [];

    // Adding Test activities to the list
    for (const testResult of testResultsList) {
      const act: IActivitiesList = {
        startTime: testResult.testTypes[0].testTypeStartTimestamp!,
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
    const sortDateAsc = (date1: IActivitiesList, date2: IActivitiesList) => {
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
