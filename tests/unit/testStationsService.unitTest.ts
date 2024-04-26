import { LambdaClient } from "@aws-sdk/client-lambda";
import { mockClient } from "aws-sdk-client-mock";
import sinon from "sinon";
import { LambdaService } from "../../src/services/LambdaService";

import { TestStationsService } from "../../src/services/TestStationsService";
import testStationResponse from "../resources/test-stations-200-response.json";
import mockConfig from "../util/mockConfig";

describe("TestStationsService", () => {
  mockClient(LambdaClient);
  const sandbox = sinon.createSandbox();
  mockConfig();

  const lambdaMock = jest.fn().mockImplementation(() => {
    return {
      invoke: jest.fn().mockResolvedValue(""),
      validateInvocationResponse: jest.fn().mockReturnValue(testStationResponse),
      send: jest.fn().mockResolvedValue({ Payload: testStationResponse }),
    };
  });

  const testStationsService: TestStationsService = new TestStationsService(new lambdaMock());

  afterEach(() => {
    sandbox.restore();
  });

  context("when fetching the test stations", () => {
    context("and the lambda function exists", () => {
      context("and the response is 200", () => {
        it("should return a correct test stations emails", () => {
          return testStationsService.getTestStationEmail("87-1369569").then((data) => {
            expect(data[0].testStationEmails.length).toEqual(3);
          });
        });
      });
    });

    context("and the lambda function throws an error", () => {
      it("should bubble up the error (error in Invoke)", async () => {
        const service = new TestStationsService(new LambdaService(new LambdaClient()));
        sandbox.stub(LambdaService.prototype, "invoke").throws(new Error("Oh no"));
        expect.assertions(1);
        try {
          await service.getTestStationEmail("something");
        } catch (e) {
          expect(e.message).toEqual("Oh no");
        }
      });

      it("should bubble up the error (error in validateInvocationResponse)", async () => {
        const lambda = new LambdaClient();
        const service = new TestStationsService(new LambdaService(lambda));

        sandbox.stub(LambdaService.prototype, "validateInvocationResponse").throws(new Error("Not again"));
        expect.assertions(1);
        try {
          await service.getTestStationEmail("something");
        } catch (e) {
          expect(e.body).toEqual("Not again");
        }
      });
    });
  });
});
