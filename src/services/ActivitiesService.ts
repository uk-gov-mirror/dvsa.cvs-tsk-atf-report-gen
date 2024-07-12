import { InvocationRequest, InvocationResponse } from "@aws-sdk/client-lambda";
import { toUint8Array } from "@smithy/util-utf8";
import moment from "moment";
import { IInvokeConfig } from "../models";
import { Configuration } from "../utils/Configuration";
import { LambdaService } from "./LambdaService";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";

class ActivitiesService {
  private readonly lambdaClient: LambdaService;
  private readonly config: Configuration;

  constructor(lambdaClient: LambdaService) {
    this.lambdaClient = lambdaClient;
    this.config = Configuration.getInstance();
  }

  /**
   * Retrieves Activities based on the provided parameters
   * @param params - getActivities query parameters
   */
  public getActivities(params: any): Promise<ActivitySchema[]> {
    console.log(`getActivities called with params: ${JSON.stringify(params)}`);
    const config: IInvokeConfig = this.config.getInvokeConfig();
    const invokeParams: InvocationRequest = {
      FunctionName: config.functions.getActivities.name,
      InvocationType: "RequestResponse",
      LogType: "Tail",
      Payload: toUint8Array(
        JSON.stringify({
          httpMethod: "GET",
          path: "/activities/details",
          queryStringParameters: params,
        })
      ),
    };

    if (params.activityType !== "visit") {
      console.log("not a visit, resolving a promise with an empty array");
      return Promise.resolve([]);
    }

    return this.lambdaClient.invoke(invokeParams).then((response: InvocationResponse) => {
      const payload: any = this.lambdaClient.validateInvocationResponse(response); // Response validation
      const activityResults: ActivitySchema[] = JSON.parse(payload.body); // Response conversion
      console.log(`Activities: ${activityResults.length}`);

      // Sort results by startTime
      activityResults.sort((first: any, second: any): number => {
        if (moment(first.startTime).isBefore(second.startTime)) {
          return -1;
        }

        if (moment(first.startTime).isAfter(second.startTime)) {
          return 1;
        }

        return 0;
      });

      return activityResults;
    });
  }
}

export { ActivitiesService };
