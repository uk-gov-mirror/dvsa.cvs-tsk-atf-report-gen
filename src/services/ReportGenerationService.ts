import { IActivity } from "../models";
import { TestResultsService } from "./TestResultsService";
import { ERRORS, STATUSES } from "../assets/enum";
import { HTTPError } from "../models/HTTPError";
import { ActivitiesService } from "./ActivitiesService";

class ReportGenerationService {
  private readonly testResultsService: TestResultsService;
  private readonly activitiesService: ActivitiesService;

  constructor(testResultsService: TestResultsService, activitiesService: ActivitiesService) {
    this.testResultsService = testResultsService;
    this.activitiesService = activitiesService;
  }

  /**
   * Generates the ATF report for a given activity
   * @param activity - activity for which to generate the report
   */
  public generateATFReport(activity: IActivity): Promise<any> {
    return this.testResultsService
      .getTestResults({
        testerStaffId: activity.testerStaffId,
        fromDateTime: activity.startTime,
        toDateTime: activity.endTime,
        testStationPNumber: activity.testStationPNumber,
        testStatus: STATUSES.SUBMITTED,
      })
      .then((testResults: any) => {
        // Fetch 'wait' activities for this visit activity
        return this.activitiesService
          .getActivities({
            testerStaffId: activity.testerStaffId,
            fromStartTime: activity.startTime,
            toStartTime: activity.endTime,
            testStationPNumber: activity.testStationPNumber,
            activityType: "wait",
          })
          .then((waitActivities: any[]) => {
            console.log(`wait Activities Size: ${waitActivities.length}`);
            const totalActivitiesLen = testResults.length + waitActivities.length;
            console.log(`Total Activities Len: ${totalActivitiesLen}`);

            return { testResults, waitActivities };
          })
          .catch((error: any) => {
            console.log(error);
            throw new HTTPError(500, ERRORS.ATF_CANT_BE_CREATED);
          });
      });
  }
}

export { ReportGenerationService };
