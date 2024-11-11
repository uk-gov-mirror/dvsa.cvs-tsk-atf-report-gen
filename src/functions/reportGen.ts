import { LambdaClient } from "@aws-sdk/client-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { Callback, Context, Handler, SQSBatchItemFailure, SQSBatchResponse, SQSEvent } from "aws-lambda";
import { ERRORS } from "../assets/enum";
import { ActivitiesService } from "../services/ActivitiesService";
import { LambdaService } from "../services/LambdaService";
import { ReportGenerationService } from "../services/ReportGenerationService";
import { SendATFReport } from "../services/SendATFReport";
import { TestResultsService } from "../services/TestResultsService";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";

/**
 * λ function to process a SQS of test results into a queue for certificate generation.
 * @param event - SQS event
 * @param context - λ Context
 * @param callback - callback function
 */
const reportGen: Handler = async (event: SQSEvent, context?: Context, callback?: Callback): Promise<SQSBatchResponse> => {
  if (!event || !event.Records || !Array.isArray(event.Records) || !event.Records.length) {
    console.error("ERROR: event is not defined.");
    throw new Error(ERRORS.EVENT_IS_EMPTY);
  }
  const batchItemFailures: SQSBatchItemFailure[] = [];

  const lambdaService = new LambdaService(new LambdaClient({}));
  const reportService: ReportGenerationService = new ReportGenerationService(new TestResultsService(lambdaService), new ActivitiesService(lambdaService));
  const sendATFReport: SendATFReport = new SendATFReport();

  console.debug("Services injected, looping over sqs events");
  for (const record of event.Records) {
    try {
      const recordBody = JSON.parse(record?.body);
      const visit: ActivitySchema = unmarshall(recordBody?.dynamodb.NewImage) as ActivitySchema;

      console.debug(`visit is: ${JSON.stringify(visit.id)}`);

      if (visit) {
        const generationServiceResponse = await reportService.generateATFReport(visit);
        console.debug(`Report generated: ${JSON.stringify(generationServiceResponse)}`);
        await sendATFReport.sendATFReport(generationServiceResponse, visit);
      }

    } catch (error) {
      console.error(error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures };
};

export { reportGen };
