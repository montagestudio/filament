var fs = require("fs");
var path = require("path");
var modifyModule = require("../../core/modify-module");

function test(methodName, inputName, outputName) {
    var input = fs.readFileSync(path.join(__dirname, inputName + ".js"), "utf-8");
    var output = modifyModule[methodName](input, "Input", "handleActionEvent", "event");
    var oracle = fs.readFileSync(path.join(__dirname, outputName + ".js"), "utf-8");
    expect(output).toBe(oracle);
}

describe("modify-module", function () {
    describe("injectMethod", function () {
        it("adds a method to a class on one line", function () {
            test("injectMethod", "empty-one-line", "method");
        });

        it("adds a method to a class on multiple lines", function () {
            test("injectMethod", "empty-multi-line", "method");
        });

        it("puts the method after a comments", function () {
            test("injectMethod", "empty-comment", "method-comment");
        });

        it("puts the method after existing method", function () {
            test("injectMethod", "other-method", "other-method-method");
        });

        it("puts the method after another method and comment", function () {
            test("injectMethod", "other-method-comment", "other-method-comment-method");
        });

        it("idempotence", function () {
            test("injectMethod", "method", "method");
        });
    });

    describe("removeMethod", function () {
        it("removes a method", function () {
            test("removeMethod", "method", "empty-one-line");
        });

        it("idempotence", function () {
            test("removeMethod", "other-method", "other-method");
        });
    });
});
