import moment = require("moment-timezone");
import { ACTIVITY_TYPE, TIMEZONE } from "../assets/enum";

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
    personalization.activityDetails = "";
    personalization.activityType = (visit.activityType === "visit") ? ACTIVITY_TYPE.TEST : ACTIVITY_TYPE.WAIT_TIME;
    for (const [index, testResult] of testResultsList.entries()) {
      const axlesSeats = (testResult.vehicleType === "psv") ? testResult.numberOfSeats : testResult.noOfAxles;
      console.log("NUMBER_OF_SEATS", testResult.numberOfSeats);
      console.log("NUMBER_OF_AXLES", testResult.noOfAxles);
      console.log("AXLE_SEATS", axlesSeats);
      personalization.activityDetails += `^#${this.capitalise(personalization.activityType)} (${testResult.vrm})
      ^• Time: ${this.formatDateAndTime(testResult.testTypes.testTypeStartTimestamp, "time")} - ${this.formatDateAndTime(testResult.testTypes.testTypeEndTimeStamp, "time")}
      ^• Test description: ${testResult.testTypes.testTypeName}
      ^• Axles / Seats: ${axlesSeats}
      ^• Result: ${this.capitalise(testResult.testTypes.testResult)}`
      + `${testResult.testTypes.certificateNumber ? `\n^• Certificate number: ${testResult.testTypes.certificateNumber}` : ""}`
      + `${testResult.testTypes.testExpiryDate ? `\n^• Expiry date: ${this.formatDateAndTime(testResult.testTypes.testExpiryDate, "date")}` : ""}`
      + `${(index < testResultsList.length - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
    }
    console.log("PERSONALIZATION ->", personalization);
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
