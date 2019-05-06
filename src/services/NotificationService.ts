import { Service } from "../models/injector/ServiceDecorator";
import { NotifyClientMock } from "../../tests/models/NotifyClientMock";
import { TEMPLATE_IDS } from "../assets/enum";
import { AWSError } from "aws-sdk";
import { HTTPError } from "../models/HTTPError";
// @ts-ignore
import { NotifyClient } from "notifications-node-client";

/**
 * Service class for Certificate Notifications
 */
@Service()
class NotificationService {
    private readonly notifyClient: NotifyClient | NotifyClientMock;

    constructor(notifyClient: NotifyClient | NotifyClientMock) {
        this.notifyClient = notifyClient;
    }

    /**
     * Sending email with the certificate according to the given params
     * @param params - personalization details,email and certificate
     */
    public sendNotification(params: any, emails: string[]) {
        const emailDetails = {
            personalisation: params
        };
        const sendEmailPromise = [];
        for (const email of emails) {
            const sendEmail = this.notifyClient.sendEmail(TEMPLATE_IDS.ATF_REPORT_TEMPLATE, email, emailDetails);
            sendEmailPromise.push(sendEmail);
        }

        console.log(`Sent email using ${TEMPLATE_IDS.ATF_REPORT_TEMPLATE} templateId for test station PNumber ${params.testStationPNumber}`);
        return Promise.all(sendEmailPromise)
            .catch((error: AWSError) => {
                console.error(error);
                throw new HTTPError(error.statusCode, error.message);
            });
    }
}

export { NotificationService };
