import moment = require("moment-timezone");
import { ACTIVITY_TYPE, TIMEZONE } from "../assets/enum";
import { IActivitiesList } from "../models";

class NotificationData {
  /**
   * Generates the activity details for the ATF Report template
   * @param activity - activity that will be added in the email
   * @param testResultsList - list of test results that will be added in the email
   * @return personalization - Array that contains the entries for each activity and test result
   */
  public generateActivityDetails(visit: any, testResultsList: any, waitActivitiesList: any) {
    let list : IActivitiesList[] = [];
    for (const [index, testResult] of testResultsList.entries()) {
      const act: IActivitiesList = {
        startTime: testResult.testTypes.testTypeStartTimestamp,
        activityType: ACTIVITY_TYPE.TEST,
        activity: testResult
      }
      list.push(act);
    }
    for (const [index, waitTime] of waitActivitiesList.entries()) {
      const act: IActivitiesList = {
        startTime: waitTime.startTime,
        activityType: ACTIVITY_TYPE.TIME_NOT_TESTING,
        activity: waitTime
      }
      list.push(act);
    }
    list.sort((n1,n2) => {
      if(n1.startTime > n2.startTime){
        return 1;
      }
      if(n1.startTime > n2.startTime){
        return -1;
      }
      return 0;
    });

    const personalization: any = {};
    personalization.testStationPNumber = visit.testStationPNumber;
    personalization.testerName = visit.testerName;
    personalization.startTimeDate = this.formatDateAndTime(visit.startTime, "date");
    personalization.startTime = this.formatDateAndTime(visit.startTime, "time");
    personalization.endTime = this.formatDateAndTime(visit.endTime, "time");
    personalization.testStationName = visit.testStationName;
    personalization.activityDetails = "";
    //personalization.activityType = (visit.activityType === "visit") ? ACTIVITY_TYPE.TEST : ACTIVITY_TYPE.WAIT_TIME;
    for (const [index, act] of list.entries()) {
      if(act.activityType === ACTIVITY_TYPE.TEST) {
        console.log(`Populating test activity`);
        personalization.activityDetails += `^#${this.capitalise(ACTIVITY_TYPE.TEST)} (${act.activity.vrm})
      ^• Time: ${this.formatDateAndTime(act.activity.testTypes.testTypeStartTimestamp, "time")} - ${this.formatDateAndTime(act.activity.testTypes.testTypeEndTimeStamp, "time")}
      ^• Test description: ${act.activity.testTypes.testTypeName}
      ^• Axles / Seats: ${act.activity.numberOfSeats}
      ^• Result: ${this.capitalise(act.activity.testTypes.testResult)}`
            + `${act.activity.testTypes.certificateNumber ? `\n^• Certificate number: ${act.activity.testTypes.certificateNumber}` : ""}`
            + `${act.activity.testTypes.testExpiryDate ? `\n^• Expiry date: ${this.formatDateAndTime(act.activity.testTypes.testExpiryDate, "date")}` : ""}`
            + `${(index < list.length - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
      }
      if(act.activityType === ACTIVITY_TYPE.TIME_NOT_TESTING) {
        console.log(`Populating wait activity`);
        personalization.activityDetails += `^#${this.capitalise(ACTIVITY_TYPE.TIME_NOT_TESTING)}
      ^• Time: ${this.formatDateAndTime(act.activity.startTime, "time")} - ${this.formatDateAndTime(act.activity.endTime, "time")}
      ^• Reason: ${act.activity.waitReason}`
            + `${(index < list.length - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
      }
    }

/*
    for (const [index, testResult] of testResultsList.entries()) {
      personalization.activityDetails += `^#${this.capitalise(personalization.activityType)} (${testResult.vrm})
      ^• Time: ${this.formatDateAndTime(testResult.testTypes.testTypeStartTimestamp, "time")} - ${this.formatDateAndTime(testResult.testTypes.testTypeEndTimeStamp, "time")}
      ^• Test description: ${testResult.testTypes.testTypeName}
      ^• Axles / Seats: ${testResult.numberOfSeats}
      ^• Result: ${this.capitalise(testResult.testTypes.testResult)}`
      + `${testResult.testTypes.certificateNumber ? `\n^• Certificate number: ${testResult.testTypes.certificateNumber}` : ""}`
      + `${testResult.testTypes.testExpiryDate ? `\n^• Expiry date: ${this.formatDateAndTime(testResult.testTypes.testExpiryDate, "date")}` : ""}`
      + `${(index < (testResultsList.length + waitActivitiesList.length) - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
    }
    personalization.activityType = ACTIVITY_TYPE.TIME_NOT_TESTING;
    for (const [index, waitTime] of waitActivitiesList.entries()) {
      personalization.activityDetails += `^#${this.capitalise(personalization.activityType)}
      ^• Time: ${this.formatDateAndTime(waitTime.startTime, "time")} - ${this.formatDateAndTime(waitTime.endTime, "time")}
      ^• Reason: ${waitTime.waitReason}`
          + `${(index < waitActivitiesList.length - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
    }*/
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
