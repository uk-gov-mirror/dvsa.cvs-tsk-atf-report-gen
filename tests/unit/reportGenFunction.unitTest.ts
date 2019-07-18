import { describe } from "mocha";
import { expect } from "chai";
import { reportGen } from "../../src/functions/reportGen";
import mockContext from "aws-lambda-mock-context";
import sinon from "sinon";
import { ReportGenerationService } from "../../src/services/ReportGenerationService";
import { SendATFReport } from "../../src/services/SendATFReport";
const sandbox = sinon.createSandbox();

const ctx = mockContext();


describe("Retro Gen Function", () => {
    context("Receiving an empty event (of various types)", () => {
        it("should throw errors (event = {})", async () => {
            try {
                await reportGen({}, ctx, () => {
                    return;
                });
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Event is empty");
            }
        });
        it("should throw errors (event = null)", async () => {
            try {
                await reportGen(null, ctx, () => {
                    return;
                });
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Event is empty");
            }
        });
        it("should throw errors (event has no records)", async () => {
            try {
                await reportGen({something: true}, ctx, () => {
                    return;
                });
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Event is empty");
            }
        });
        it("should throw errors (event Records is not array)", async () => {
            try {
                await reportGen({Records: true}, ctx, () => {
                    return;
                });
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Event is empty");
            }
        });
        it("should throw errors (event Records array is empty)", async () => {
            try {
                await reportGen({Records: []}, ctx, () => {
                    return;
                });
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Event is empty");
            }
        });
    });

    context("Inner services fail", () => {
        afterEach(() => {
            sandbox.restore();
        });

        it("Should throw an error (generateATFReport fails)", async () => {
            sandbox.stub(ReportGenerationService.prototype, "generateATFReport").throws(new Error("Oh no!"));
            try {
                await reportGen({Records: [{body: true }]}, ctx, () => {return; });
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Oh no!");
            }
        });
        it("Should throw an error (bucket upload fails)", async () => {
            sandbox.stub(ReportGenerationService.prototype, "generateATFReport").resolves("Looking good");
            sandbox.stub(SendATFReport.prototype, "sendATFReport").throws(new Error("Oh dear"));
            try {
                await reportGen({Records: [{body: true }]}, ctx, () => {return; });
                expect.fail();
            } catch (e) {
                console.log(e);
                expect(e.message).to.deep.equal("Oh dear");
            }
        });
    });
});
