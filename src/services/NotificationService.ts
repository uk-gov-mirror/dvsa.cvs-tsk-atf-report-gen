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
   * @param activityId - activityId for logging purposes
   */
  public async sendNotification(params: any, emails: string[], activityId: string) {
    const templateId: string = await this.config.getTemplateIdFromEV();
    const emailDetails = {
      personalisation: params,
    };

    for (const email of emails) {
      try {
        await this.notifyClient.sendEmail(templateId, email, emailDetails);
        console.log(`report successfully sent email for PNumber ${params.testStationPNumber} with activity ${activityId}.`);
      } catch (error) {
        console.log(`failed to send for ${email}`);
        console.error(error);
      }
    }
  }
}

export { NotificationService };
