import { PutObjectRequest } from "@aws-sdk/client-s3";
import { Readable } from "stream";

interface IBucket {
  bucketName: string;
  files: string[];
}

/**
 * Service for mocking the S3BucketService
 */
class S3BucketMockService {
  public static buckets: IBucket[] = [];

  /**
   * Uploads a file to an S3 bucket
   * @param bucketName - the bucket to upload to
   * @param fileName - the name of the file
   * @param content - contents of the file
   * @param metadata - optional metadata
   */
  public async upload(bucketName: string, fileName: string, content: Buffer | Uint8Array | Blob | string | Readable, metadata?: Record<string, string>): Promise<PutObjectRequest> {
    const bucket: IBucket | undefined = S3BucketMockService.buckets.find((currentBucket: IBucket) => {
      return currentBucket.bucketName === bucketName;
    });

    if (!bucket) {
      const error: Error = new Error();
      Object.assign(error, {
        message: "The specified bucket does not exist.",
        code: "NoSuchBucket",
        statusCode: 404,
        retryable: false,
      });

      throw error;
    }

    const response: any = {
      Location: `http://localhost:7000/${bucketName}/${fileName}`,
      ETag: "621c9c14d75958d4c3ed8ad77c80cde1",
      Bucket: bucketName,
      Key: fileName,
    };

    return response;
  }
}

export { S3BucketMockService };
