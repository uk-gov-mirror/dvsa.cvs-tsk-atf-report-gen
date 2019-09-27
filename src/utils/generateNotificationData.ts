import moment = require("moment-timezone");
import { ACTIVITY_TYPE, TIMEZONE } from "../assets/enum";
import {IActivitiesList, ITestResults} from "../models";

class NotificationData {
  /**
   * Generates the activity details for the ATF Report template
   * @param activity - activity that will be added in the email
   * @param testResultsList - list of test results that will be added in the email
   * @return personalization - Array that contains the entries for each activity and test result
   */
  public generateActivityDetails(visit: any, activitiesList: IActivitiesList[]) {
    //Populating the list details.
    const personalization: any = {};
    personalization.testStationPNumber = visit.testStationPNumber;
    personalization.testerName = visit.testerName;
    personalization.startTimeDate = this.formatDateAndTime(visit.startTime, "date");
    personalization.startTime = this.formatDateAndTime(visit.startTime, "time");
    personalization.endTime = this.formatDateAndTime(visit.endTime, "time");
    personalization.testStationName = visit.testStationName;
    personalization.activityDetails = "";
    for (const [index, act] of activitiesList.entries()) {
      if(act.activityType === ACTIVITY_TYPE.TEST) {
        personalization.activityDetails += `^#${this.capitalise(ACTIVITY_TYPE.TEST)} (${act.activity.vrm})
      ^• Time: ${this.formatDateAndTime(act.activity.testTypes.testTypeStartTimestamp, "time")} - ${this.formatDateAndTime(act.activity.testTypes.testTypeEndTimeStamp, "time")}
      ^• Test description: ${act.activity.testTypes.testTypeName}
      ^• Axles / Seats: ${act.activity.numberOfSeats}
      ^• Result: ${this.capitalise(act.activity.testTypes.testResult)}`
            + `${act.activity.testTypes.certificateNumber ? `\n^• Certificate number: ${act.activity.testTypes.certificateNumber}` : ""}`
            + `${act.activity.testTypes.testExpiryDate ? `\n^• Expiry date: ${this.formatDateAndTime(act.activity.testTypes.testExpiryDate, "date")}` : ""}`
            + `${(index < activitiesList.length - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
      }
      if(act.activityType === ACTIVITY_TYPE.TIME_NOT_TESTING) {
        personalization.activityDetails += `^#${this.capitalise(ACTIVITY_TYPE.TIME_NOT_TESTING)}
      ^• Time: ${this.formatDateAndTime(act.activity.startTime, "time")} - ${this.formatDateAndTime(act.activity.endTime, "time")}
      ^• Reason: ${act.activity.waitReason}`
            + `${(index < activitiesList.length - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
      }
    }
    return personalization;
  }

  /**
   * Formats the data based on the parameters
   * @param param - The date
   * @param type - "DD/MM/YYYY" for a data | "HH:mm:ss" for time
   * @return the date or the time
   */
  private formatDateAndTime(param: string, type: string) {
    switch (type) {
      case "date":
        return moment(param).tz(TIMEZONE.LONDON).format("DD/MM/YYYY");
      case "time":
        return moment(param).tz(TIMEZONE.LONDON).format("HH:mm:ss");
    }
  }

  /**
   * Make first character of string upper case
   * @param str
   */
  private capitalise(str: string) {
    if(!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export { NotificationData };
