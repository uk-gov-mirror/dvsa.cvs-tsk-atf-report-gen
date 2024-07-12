import { InvocationRequest, InvocationResponse } from "@aws-sdk/client-lambda";
import { toUint8Array } from "@smithy/util-utf8";
import moment from "moment";
import { IInvokeConfig } from "../models";
import { Configuration } from "../utils/Configuration";
import { LambdaService } from "./LambdaService";
import { TestResultSchema, TestTypeSchema } from "@dvsa/cvs-type-definitions/types/v1/test-result";

class TestResultsService {
  private readonly lambdaClient: LambdaService;
  private readonly config: Configuration;

  constructor(lambdaClient: LambdaService) {
    this.lambdaClient = lambdaClient;
    this.config = Configuration.getInstance();
  }

  /**
   * Retrieves test results based on the provided parameters
   * @param params - getTestResultsByTesterStaffId query parameters
   */
  public getTestResults(params: any): Promise<TestResultSchema[]> {
    console.debug(`inside get test results: ${JSON.stringify(params)}`);
    const config: IInvokeConfig = this.config.getInvokeConfig();
    const invokeParams: InvocationRequest = {
      FunctionName: config.functions.testResults.name,
      InvocationType: "RequestResponse",
      LogType: "Tail",
      Payload: toUint8Array(
        JSON.stringify({
          httpMethod: "GET",
          path: "/test-results/getTestResultsByTesterStaffId",
          queryStringParameters: params,
        })
      ),
    };

    return this.lambdaClient.invoke(invokeParams).then((response: InvocationResponse) => {
      const payload: any = this.lambdaClient.validateInvocationResponse(response); // Response validation
      const testResults: TestResultSchema[] = JSON.parse(payload.body); // Response conversion

      console.debug(`test result response is: ${JSON.stringify(testResults)}`);
      // Sort results by testTypeEndTimeStamp
      testResults.sort((first: any, second: any): number => {
        if (moment(first.testTypes[0].testTypeEndTimeStamp).isBefore(second.testTypes[0].testTypeEndTimeStamp)) {
          return -1;
        }

        if (moment(first.testTypes[0].testTypeEndTimeStamp).isAfter(second.testTypes[0].testTypeEndTimeStamp)) {
          return 1;
        }

        return 0;
      });

      return this.expandTestResults(testResults);
    });
  }

  /**
   * Helper method for expanding a single record with multiple test types
   * into multiple records with a single test type
   * @param testResults
   */
  public expandTestResults(testResults: TestResultSchema[]): TestResultSchema[] {
    console.debug("Splitting test results into multiple records");
    return testResults
      .map((testResult: TestResultSchema) => {
        // Separate each test type in a record to form multiple test results
        const splittedRecords: TestResultSchema[] = [];
        const templateRecord: TestResultSchema = Object.assign({}, testResult);
        Object.assign(templateRecord, {});

        testResult.testTypes.forEach((testType: TestTypeSchema, i: number, array: any[]) => {
          const clonedRecord: TestResultSchema = Object.assign({}, templateRecord); // Create test result from template
          Object.assign(clonedRecord, { testTypes: [testType] }); // Assign it the test type

          splittedRecords.push(clonedRecord);
        });

        return splittedRecords;
      })
      .reduce((acc: any[], val: any) => acc.concat(val), []); // Flatten the array
  }
}

export { TestResultsService };
