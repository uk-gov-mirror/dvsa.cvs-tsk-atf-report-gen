import { describe } from "mocha";
import { expect } from "chai";
import { Injector } from "../../src/models/injector/Injector";
import { LambdaMockService } from "../models/LambdaMockService";
import { TestStationsService } from "../../src/services/TestStationsService";

describe("report-gen", () => {
    context("TestStationsService", () => {
        const testStationsService: TestStationsService = Injector.resolve<TestStationsService>(TestStationsService, [LambdaMockService]);
        LambdaMockService.populateFunctions();

        context("when fetching the test stations", () => {
            context("and the lambda function exists", () => {
                context("and the response is 200", () => {
                    it("should return a correct test stations emails", () => {
                        return testStationsService.getTestStationEmail("87-1369569").then((data) => {
                           expect(data[0].testStationEmails.length).to.equal(3);
                        });
                    });
                });
            });
        });

    });
});
