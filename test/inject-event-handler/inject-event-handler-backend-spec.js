var fs = require("fs");
var path = require("path");
var inject = require("./inject");

function test(index) {
    var input = fs.readFileSync(path.join(__dirname, "input" + index + ".js"), "utf-8");
    var output = inject(input, "Input", "handleActionEvent", "event");
    var oracle = fs.readFileSync(path.join(__dirname, "output" + index + ".js"), "utf-8");
    expect(output).toBe(oracle);
}

describe("inject-event-handler", function () {
    it("1", function () {
        test(1);
    });

    it("2", function () {
        test(2);
    });

    it("3", function () {
        test(3);
    });

    it("4", function () {
        test(4);
    });

    it("5", function () {
        test(5);
    });

    it("idempotence", function () {
        test(6);
    });
});
