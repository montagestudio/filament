/* global process */
var path = require ("path");
var fs = require("fs");
var Q = require("q");
var childProcess = require('child_process');

var sikuli = process.env.SIKULI;

if (!sikuli) {
	console.error("Unable to find SIKULI, please set this environment variable to point to the Sikuli built `runScript`");
	process.exit(1);
}

var testDirectoryPath = "test/integration";

var scripts = [
	"auto-refresh-preview",
	"todo"
];

var result = scripts.reduce(function (promise, testName) {
    return promise.then(function (success) {
		return runTest(testName);
	}, function (failure) {
		console.log("Stopped on failure.");
	});
}, Q());

function runTest (name) {
	var testPath = path.join(testDirectoryPath, name + ".sikuli");
	if (fs.existsSync(testPath)) {
		var deferredExit = Q.defer();
		console.log("Running", testPath);
		var child = childProcess.spawn("sh", [sikuli, "-r", testPath]);
		
		child.on("close", function (code) {
			if (0 === code) {
				console.log("[PASSED]", name);
				deferredExit.resolve(code);
			} else {
				console.log("[FAILED]", name);
				deferredExit.reject(code);
			}
		});
		
		return deferredExit.promise;
		
	} else {
		throw new Error("Could not find test '" + testPath + "'");
	}
}
