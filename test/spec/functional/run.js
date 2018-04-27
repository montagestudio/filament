/* global process, __dirname*/
var path = require ("path");
var fs = require("fs");
var Promise = require("montage/core/promise").Promise;
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

var testDirectoryPath = __dirname;

var scripts = [
    "auto-refresh-preview",
    "todo"
];

scripts.reduce(function (promise, testName) {
    return promise.fin(function () {
        return runTest(testName);
    });
}, Promise.resolve());

function runTest (name) {
    var testPath = path.join(testDirectoryPath, name + ".sikuli");
    var finishedPromise;

    if (fs.existsSync(testPath)) {
        finishedPromise = setupTest(name).then(function (setupSuccess) {
            return executeTest(name, testPath).then(function (resultCode) {
                var result = 0 === resultCode ? "PASSED" : "FAILED";
                console.log("[" + result + "]", name);
            }).fin(function () {
                return teardownTest(name);
            });

        }, function (failure) {
            console.log("[ERROR]", name);
            console.error(failure.message);
        });
    } else {
        finishedPromise = Promise.reject(new Error("Could not find test '" + testPath + "'"));
    }

    return finishedPromise;
}

function setupTest (name) {
    return Promise.resolve(true);
}

function executeTest (name, testPath) {
    var lumieresExitPromise,
        sikuliTestPromise,
        activationPromise,
        testingDonePromise;

    lumieresExitPromise = new Promise(function(resolve, reject) {
        childProcess.execFile(lumieres, null, null, function (error, stdout, stderr) {
            if (error || !sikuliTestPromise.isFulfilled()) {
                if (error) {
                    console.error(error);
                }
                reject(new Error("Lumieres exited unexpectedly"));
            } else {
                resolve(0);
            }
        });
    });

    activationPromise = activateLumieres();
    sikuliTestPromise = runSikuliTest(testPath);

    testingDonePromise = Promise.all([sikuliTestPromise, activationPromise]).spread(function (testingExitCode) {
        childProcess.spawn("osascript", [path.join(testDirectoryPath, "quit.scpt")]);
        return testingExitCode;
    });

    return Promise.all([testingDonePromise, lumieresExitPromise]).spread(function (testingExitCode) {
        return testingExitCode;
    });
}

function activateLumieres () {
    var activationProcess = childProcess.spawn("osascript", [path.join(testDirectoryPath, "activate.scpt")]);

    return new Promise(function(resolve) {
        activationProcess.on("close", function (code) {
            if (1 === code) {
                resolve(activateLumieres());
            } else {
                resolve(code);
            }
        });
    });
}

function runSikuliTest (testPath) {
    var sikuliProcess = childProcess.spawn("sh", [sikuli, "-r", testPath]);

    return new Promise(function(resolve) {
        sikuliProcess.on("close", function (code) {
            resolve(code);
        });
    });
}

function teardownTest (name) {
    return Promise.resolve(true);
}
