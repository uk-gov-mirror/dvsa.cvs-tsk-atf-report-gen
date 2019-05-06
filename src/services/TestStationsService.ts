import { IInvokeConfig } from "../models";
import { PromiseResult } from "aws-sdk/lib/request";
import { AWSError, Lambda } from "aws-sdk";
import { LambdaService } from "./LambdaService";
import { Configuration } from "../utils/Configuration";
import { Service } from "../models/injector/ServiceDecorator";
import { HTTPError } from "../models/HTTPError";

@Service()
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
                    testStationPNumber
                }
            }),
        };
        return this.lambdaClient.invoke(invokeParams)
            .then((response: PromiseResult<Lambda.Types.InvocationResponse, AWSError>) => {
                const payload: any = this.lambdaClient.validateInvocationResponse(response); // Response validation
                const testStationEmails: any[] = JSON.parse(payload.body); // Response conversion
                return testStationEmails;
            }).catch((error) => {
                console.log(error);
                throw new HTTPError(500, "Internal server error");
            });
    }
}

export { TestStationsService };
