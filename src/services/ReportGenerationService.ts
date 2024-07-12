import { ERRORS, STATUSES } from "../assets/enum";
import { HTTPError } from "../models/HTTPError";
import { ActivitiesService } from "./ActivitiesService";
import { TestResultsService } from "./TestResultsService";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";
import { TestResultSchema } from "@dvsa/cvs-type-definitions/types/v1/test-result";

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
  public async generateATFReport(activity: ActivitySchema): Promise<{ testResults: TestResultSchema[]; waitActivities: ActivitySchema[]; }> {
    console.debug("Inside generateATFReport");
    try {
      const testResults: TestResultSchema[] = await this.testResultsService
        .getTestResults({
          testerStaffId: activity.testerStaffId,
          fromDateTime: activity.startTime,
          toDateTime: activity.endTime,
          testStationPNumber: activity.testStationPNumber,
          testStatus: STATUSES.SUBMITTED,
        });

      const waitActivities: ActivitySchema[] = await this.activitiesService
        .getActivities({
          testerStaffId: activity.testerStaffId,
          fromStartTime: activity.startTime,
          toStartTime: activity.endTime,
          testStationPNumber: activity.testStationPNumber,
          activityType: "wait",
        });

      console.log(`wait Activities Size: ${waitActivities.length}`);
      const totalActivitiesLen = testResults.length + waitActivities.length;
      console.log(`Total Activities Len: ${totalActivitiesLen}`);

      return { testResults, waitActivities };
    } catch (error) {
      console.log(error);
      throw new HTTPError(500, ERRORS.ATF_CANT_BE_CREATED);
    }
  }
}

export { ReportGenerationService };
