import { ActivitiesService } from "../../src/services/ActivitiesService";
import { wrapLambdaResponse } from "../util/responseUtils";
import waitResponse from "../resources/wait-time-response.json";
import { LambdaService } from "../../src/services/LambdaService";
import mockConfig from "../util/mockConfig";

describe("Activities Service", () => {
  mockConfig();
  describe("getActivities function", () => {
    context("Lambda client returns a single record in expected format", () => {
      it("returns parsed result", async () => {
        const mockLambdaService = jest.fn().mockImplementation(() => {
          return {
            invoke: () =>Promise.resolve(wrapLambdaResponse(JSON.stringify(waitResponse))),
            validateInvocationResponse: LambdaService.prototype.validateInvocationResponse
          };
        });
        const activityService= new ActivitiesService(new mockLambdaService());
        const result = await activityService.getActivities({});
        expect(result).toEqual([{
          startTime: "2019-01-14T10:42:33.987Z",
          endTime: "2019-01-14T10:48:33.987Z",
          waitReason: "Break"
        }]);
      });
    });

    context("Lambda client returns multiple records in expected format", () => {
      it("returns sorted result set", async () => {
        const waitActivity = JSON.parse(waitResponse.body)[0];
        const latestActivity = {...waitActivity, startTime: "2019-01-14T10:42:33.987Z"};
        const middleActivity = {...waitActivity, startTime: "2019-01-14T09:42:33.987Z"};
        const earliestActivity = {...waitActivity, startTime: "2019-01-14T08:42:33.987Z"};
        const myEvent = {...waitResponse, body: JSON.stringify([latestActivity, earliestActivity, middleActivity, middleActivity])};

        const mockLambdaService = jest.fn().mockImplementation(() => {
          return {
            invoke: () =>Promise.resolve(wrapLambdaResponse(JSON.stringify(myEvent))),
            validateInvocationResponse: LambdaService.prototype.validateInvocationResponse

          };
        });
        const activityService = new ActivitiesService(new mockLambdaService());
        const result = await activityService.getActivities({});
        expect(result).toStrictEqual([earliestActivity, middleActivity, middleActivity, latestActivity]);
      });
    });
  });
});
