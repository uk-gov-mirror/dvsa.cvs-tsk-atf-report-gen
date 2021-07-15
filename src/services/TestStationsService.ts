import { IInvokeConfig } from "../models";
import { Lambda } from "aws-sdk";
import { LambdaService } from "./LambdaService";
import { Configuration } from "../utils/Configuration";
import { HTTPError } from "../models/HTTPError";

class TestStationsService {
  private readonly lambdaClient: LambdaService;
  private readonly config: Configuration;

  constructor(lambdaClient: LambdaService) {
    this.lambdaClient = lambdaClient;
    this.config = Configuration.getInstance();
  }

  /**
   * Retrieves test station emails based on the provided parameters
   * @param params - getTestStationEmails query parameters
   */
  public getTestStationEmail(testStationPNumber: string): Promise<any> {
    const config: IInvokeConfig = this.config.getInvokeConfig();
    const invokeParams: any = {
      FunctionName: config.functions.testStations.name,
      InvocationType: "RequestResponse",
      LogType: "Tail",
      Payload: JSON.stringify({
        httpMethod: "GET",
        path: `/test-stations/${testStationPNumber}`,
        pathParameters: {
          testStationPNumber,
        },
      }),
    };
    return this.lambdaClient
      .invoke(invokeParams)
      .then((response: Lambda.Types.InvocationResponse) => {
        const payload: any = this.lambdaClient.validateInvocationResponse(response); // Response validation
        return JSON.parse(payload.body); // Response conversion
      })
      .catch((error) => {
        console.log(error);
        throw new HTTPError(500, error.message);
      });
  }
}

export { TestStationsService };
