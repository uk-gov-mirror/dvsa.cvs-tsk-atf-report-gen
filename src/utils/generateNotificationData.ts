import moment = require("moment-timezone");
import { TIMEZONE } from "../assets/enum";

class NotificationData {
  /**
   * Generates the activity details for the ATF Report template
   * @param activity - activity that will be added in the email
   * @param testResultsList - list of test results that will be added in the email
   * @return personalization - Array that contains the entries for each activity and test result
   */
  public generateActivityDetails(visit: any, testResultsList: any) {
    const personalization: any = {};
    personalization.testStationPNumber = visit.testStationPNumber;
    personalization.testerName = visit.testerName;
    personalization.startTimeDate = this.formatDateAndTime(visit.startTime, "date");
    personalization.startTime = this.formatDateAndTime(visit.startTime, "time");
    personalization.endTime = this.formatDateAndTime(visit.endTime, "time");
    personalization.testStationName = visit.testStationName;
    personalization.activityDetails = [];
    personalization.activityType = visit.activityType;
    for (const testResult of testResultsList) {
      personalization.activityDetails.push(`^#${personalization.activityType.charAt(0).toUpperCase() + personalization.activityType.slice(1)} ${testResult.vrm}
      ^• Time: ${this.formatDateAndTime(testResult.testTypes.testTypeStartTimestamp, "time")} - ${this.formatDateAndTime(testResult.testTypes.testTypeEndTimeStamp, "time")}
      ^• Test description: ${testResult.testTypes.testTypeName}
      ^• Axles / Seats: ${testResult.numberOfSeats}
      ^• Result: ${testResult.testTypes.testResult}
      ^${testResult.testTypes.certificateNumber ? `• Certificate number: ${testResult.testTypes.certificateNumber}` : ""}
      ^${testResult.testTypes.testExpiryDate ? `• Expiry date: ${this.formatDateAndTime(testResult.testTypes.testExpiryDate, "date")}` : ""}`);
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
}

export { NotificationData };
