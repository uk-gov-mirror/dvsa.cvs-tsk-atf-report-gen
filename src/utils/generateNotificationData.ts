import moment = require("moment-timezone");
import { ACTIVITY_TYPE, TIMEZONE, VEHICLE_TYPES } from "../assets/enum";
import { IActivitiesList } from "../models";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";

class NotificationData {
  /**
   * Generates the activity details for the ATF Report template
   * @param activitiesList
   * @param visit
   * @param activitiesList
   */
  public generateActivityDetails(visit: ActivitySchema, activitiesList: IActivitiesList[]) {
    // console.log(visit)
    // console.log(activitiesList)
    // Populating the list details.
    const personalization: any = {};
    personalization.testStationPNumber = visit.testStationPNumber;
    personalization.testerName = visit.testerName;
    personalization.startTimeDate = this.formatDateAndTime(visit.startTime, "date");
    personalization.startTime = this.formatDateAndTime(visit.startTime, "time");
    personalization.endTime = this.formatDateAndTime(visit.endTime!, "time");
    personalization.testStationName = visit.testStationName;
    personalization.activityDetails = "";
    for (const [index, event] of activitiesList.entries()) {
      // console.log(event);
      if (event.activityType === ACTIVITY_TYPE.TEST) {
        const axlesSeats = event.activity.vehicleType === VEHICLE_TYPES.PSV ? event.activity.numberOfSeats : event.activity.noOfAxles;
        const vrmTrailerId = event.activity.vehicleType === VEHICLE_TYPES.TRL ? event.activity.trailerId : event.activity.vrm;
        personalization.activityDetails +=
          `^#${this.capitalise(event.activityType)} (${vrmTrailerId})
      ^• Time: ${this.formatDateAndTime((event.activity.testTypes[0]).testTypeStartTimestamp, "time")} - ${this.formatDateAndTime((event.activity.testTypes[0]).testTypeEndTimestamp, "time")}
      ^• Test description: ${event.activity.testTypes[0].testTypeName}
      ^• Axles / Seats: ${axlesSeats}
      ^• Result: ${this.capitalise((event.activity.testTypes[0]).testResult)}` +
          `${(event.activity.testTypes[0]).certificateNumber ? `\n^• Certificate number: ${(event.activity.testTypes[0]).certificateNumber}` : ""}` +
          `${(event.activity.testTypes[0]).testExpiryDate ? `\n^• Expiry date: ${this.formatDateAndTime((event.activity.testTypes[0]).testExpiryDate, "date")}` : ""}` +
          `${index < activitiesList.length - 1 ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
      }
      if (event.activityType === ACTIVITY_TYPE.TIME_NOT_TESTING) {
        personalization.activityDetails +=
          `^#${this.capitalise(ACTIVITY_TYPE.TIME_NOT_TESTING)}
      ^• Time: ${this.formatDateAndTime(event.activity.startTime, "time")} - ${this.formatDateAndTime(event.activity.endTime, "time")}
      ^• Reason: ${event.activity.waitReason}` + `${index < activitiesList.length - 1 ? `\n---\n` : "\n"}`; // Add divider line if all BUT last entry
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
