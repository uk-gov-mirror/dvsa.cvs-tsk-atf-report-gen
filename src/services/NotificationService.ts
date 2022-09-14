import { AWSError } from "aws-sdk";
import { HTTPError } from "../models/HTTPError";
// @ts-ignore
import { NotifyClient } from "notifications-node-client";
import { Configuration } from "../utils/Configuration";

/**
 * Service class for Certificate Notifications
 */
class NotificationService {
  private readonly notifyClient: NotifyClient;
  private readonly config: Configuration;

  constructor(notifyClient: NotifyClient) {
    this.notifyClient = notifyClient;
    this.config = Configuration.getInstance();
  }

  /**
   * Sending email with the certificate according to the given params
   * @param params - personalization details,email and certificate
   * @param emails - emails to send to
   */
  public async sendNotification(params: any, emails: string[]): Promise<any[]> {
    const templateId: string = await this.config.getTemplateIdFromEV();
    const emailDetails = {
      personalisation: params,
    };
    const sendEmailPromise = [];

    for (const email of emails) {
      const sendEmail = this.notifyClient.sendEmail(templateId, email, emailDetails)
        .then((response: any) => response.data);
      sendEmailPromise.push(sendEmail);
    }

    console.log(`Sent email using ${templateId} templateId for test station PNumber ${params.testStationPNumber}`);
    return Promise.all(sendEmailPromise).catch((error: AWSError) => {
      console.error(error);
      throw new HTTPError(error.statusCode, error.message);
    });
  }
}

export { NotificationService };
