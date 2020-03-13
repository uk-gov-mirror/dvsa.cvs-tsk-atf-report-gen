import moment = require("moment-timezone");
import { ACTIVITY_TYPE, TIMEZONE, VEHICLE_TYPES } from "../assets/enum";
import { IActivitiesList } from "../models";
import { ReportGenerationService } from "../services/ReportGenerationService";

class NotificationData {
  /**
   * Generates the activity details for the ATF Report template
   * @param activity - activity that will be added in the email
   * @param testResultsList - list of test results that will be added in the email
   * @return personalization - Array that contains the entries for each activity and test result
   */
  public generateActivityDetails(visit: any, activitiesList: IActivitiesList[]) {
    // Populating the list details.
    const personalization: any = {};
    personalization.testStationPNumber = visit.testStationPNumber;
    personalization.testerName = visit.testerName;
    personalization.startTimeDate = this.formatDateAndTime(visit.startTime, "date");
    personalization.startTime = this.formatDateAndTime(visit.startTime, "time");
    personalization.endTime = this.formatDateAndTime(visit.endTime, "time");
    personalization.testStationName = visit.testStationName;
    personalization.activityDetails = "";
    for (const [index, event] of activitiesList.entries()) {
      if (event.activityType === ACTIVITY_TYPE.TEST) {
        const axlesSeats = (event.activity.vehicleType === VEHICLE_TYPES.PSV) ? event.activity.numberOfSeats : event.activity.noOfAxles;
        const vrmTrailerId = (event.activity.vehicleType === VEHICLE_TYPES.TRL) ? event.activity.trailerId : event.activity.vrm;
        personalization.activityDetails += `^#${this.capitalise(event.activityType)} (${vrmTrailerId})
      ^• Time: ${this.formatDateAndTime(event.activity.testTypes.testTypeStartTimestamp, "time")} - ${this.formatDateAndTime(event.activity.testTypes.testTypeEndTimestamp, "time")}
      ^• Test description: ${event.activity.testTypes.testTypeName}
      ^• Axles / Seats: ${axlesSeats}
      ^• Result: ${this.capitalise(event.activity.testTypes.testResult)}`
          + `${event.activity.testTypes.certificateNumber ? `\n^• Certificate number` + (ReportGenerationService.isTestTypeCoifWithAnnualTestOrCoifWithAnnualTestRetest(event.activity.testTypes) ? `(Annual test)` : "") +
            `: ${event.activity.testTypes.certificateNumber}` : ""}`
          + `${event.activity.testTypes.secondaryCertificateNumber ? `\n^• Certificate number (COIF): ${event.activity.testTypes.secondaryCertificateNumber}` : ""}`
          + `${event.activity.testTypes.testExpiryDate ? `\n^• Expiry date: ${this.formatDateAndTime(event.activity.testTypes.testExpiryDate, "date")}` : ""}`
          + `${(index < activitiesList.length - 1) ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
      }
      if (event.activityType === ACTIVITY_TYPE.TIME_NOT_TESTING) {
        personalization.activityDetails += `^#${this.capitalise(ACTIVITY_TYPE.TIME_NOT_TESTING)}
      ^• Time: ${this.formatDateAndTime(event.activity.startTime, "time")} - ${this.formatDateAndTime(event.activity.endTime, "time")}
      ^• Reason: ${event.activity.waitReason}`
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
  public formatDateAndTime(param: string, type: string) {
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
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export { NotificationData };
