import { AWSError, Lambda } from "aws-sdk";
import { Callback, Context, Handler } from "aws-lambda";
import { ManagedUpload } from "aws-sdk/clients/s3";

import { ActivitiesService } from "../services/ActivitiesService";
import { ERRORS } from "../assets/enum";
import { ReportGenerationService } from "../services/ReportGenerationService";
import { SendATFReport } from "../services/SendATFReport";
import { TestResultsService } from "../services/TestResultsService";
import { LambdaService } from "../services/LambdaService";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const reportGen: Handler = async (event: any, context?: Context, callback?: Callback): Promise<void | ManagedUpload.SendData[]> => {
  if (!event || !event.Records || !Array.isArray(event.Records) || !event.Records.length) {
    console.error("ERROR: event is not defined.");
    throw new Error(ERRORS.EVENT_IS_EMPTY);
  }
  const lambdaService = new LambdaService(new Lambda());
  const reportService: ReportGenerationService = new ReportGenerationService(new TestResultsService(lambdaService), new ActivitiesService(lambdaService));
  const retroUploadPromises: Array<Promise<ManagedUpload.SendData>> = [];

  const sendATFReport: SendATFReport = new SendATFReport();

  event.Records.forEach((record: any) => {
    const visit: any = JSON.parse(record.body);
    const retroUploadPromise = reportService
      .generateATFReport(visit)
      .then((generationServiceResponse: { fileName: string; fileBuffer: Buffer; testResults: any }) => {
        return sendATFReport.sendATFReport(generationServiceResponse, visit);
      })
      .catch((error: any) => {
        console.log(error);
        throw error;
      });

    retroUploadPromises.push(retroUploadPromise);
  });

  return Promise.all(retroUploadPromises).catch((error: AWSError) => {
    console.error(error);
    throw error;
  });
};

export { reportGen };
