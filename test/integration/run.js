/* global process */
var path = require ("path");
var fs = require("fs");
var Q = require("q");
var childProcess = require('child_process');

var sikuli = process.env.SIKULI;
var lumieres = process.env.LUMIERES;

if (!sikuli) {
	console.error("Unable to find SIKULI, please set this environment variable to point to the Sikuli built `runScript`");
	process.exit(1);
}

if (!lumieres) {
	console.error("Unable to find LUMIERES, please set this environment variable to point to the lumieres binary (inside the app bundle) to test");
	process.exit(1);
}

var testDirectoryPath = "test/integration";

var scripts = [
	"auto-refresh-preview",
	"todo"
];

scripts.reduce(function (promise, testName) {
    return promise.fin(function () {
		return runTest(testName);
	});
}, Q());

function runTest (name) {
	var testPath = path.join(testDirectoryPath, name + ".sikuli");
	if (fs.existsSync(testPath)) {
		var deferredExit = Q.defer();
		var testResultCode = null;

		console.log("Running", testPath);
		
		childProcess.execFile(lumieres, null, null, function (error, stdout, stderr) {
			if (null === testResultCode) {
				console.log("[FAILED]", name);
				console.error(error);
				deferredExit.reject(new Error("Lumieres exited unexpectedly"));
			} else if (0 === testResultCode) {
				console.log("[PASSED]", name);
				deferredExit.resolve(testResultCode);
			} else {
				console.log("[FAILED]", name);
				deferredExit.reject(testResultCode);
			}
		});

		// Make sure app is front
		childProcess.spawn("osascript", [path.join(testDirectoryPath, "activate.scpt")]);

		var sikuliProcess = childProcess.spawn("sh", [sikuli, "-r", testPath]);
		sikuliProcess.on("close", function (code) {
			testResultCode = code;
			// Gracefully quit the app
			childProcess.spawn("osascript", [path.join(testDirectoryPath, "quit.scpt")]);
		});
		
		return deferredExit.promise;
		
	} else {
		throw new Error("Could not find test '" + testPath + "'");
	}
}
