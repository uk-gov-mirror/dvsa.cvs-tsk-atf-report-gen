import {Callback, Context, Handler} from "aws-lambda";
import {Injector} from "../models/injector/Injector";
import {S3BucketService} from "../services/S3BucketService";
import {ManagedUpload} from "aws-sdk/clients/s3";
import {ReportGenerationService} from "../services/ReportGenerationService";
import {AWSError} from "aws-sdk";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const reportGen: Handler = async (event: any, context?: Context, callback?: Callback): Promise<void | ManagedUpload.SendData[]> => {
    if (!event) {
        console.error("ERROR: event is not defined.");
        return;
    }

    const s3BucketService: S3BucketService = Injector.resolve<S3BucketService>(S3BucketService);
    const reportService: ReportGenerationService = Injector.resolve<ReportGenerationService>(ReportGenerationService);
    const retroUploadPromises: Array<Promise<ManagedUpload.SendData>> = [];

    event.Records.forEach((record: any) => {
        const visit: any = JSON.parse(record.body);
        const retroUploadPromise = reportService.generateATFReport(visit)
        .then((generationServiceResponse: { fileName: string, fileBuffer: Buffer}) => {

            return s3BucketService.upload(`cvs-atf-reports-${process.env.BUCKET}`, generationServiceResponse.fileName, generationServiceResponse.fileBuffer)
            .then((result: any) => {
                return result;
            });
        })
        .catch((error: any) => {
            console.log(error);
        });

        retroUploadPromises.push(retroUploadPromise);
    });

    return Promise.all(retroUploadPromises)
    .catch((error: AWSError) => {
        console.error(error);
    });
};

export {reportGen};
