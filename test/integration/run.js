/* global process, __dirname*/
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

var testDirectoryPath = __dirname;

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
        finishedPromise = Q.reject(new Error("Could not find test '" + testPath + "'"));
    }

    return finishedPromise;
}

function setupTest (name) {
    return Q(true);
}

function executeTest (name, testPath) {
    var deferredLumieresExit = Q.defer(),
        sikuliTestPromise,
        activationPromise,
        testingDonePromise;

    childProcess.execFile(lumieres, null, null, function (error, stdout, stderr) {
        if (error || !sikuliTestPromise.isFulfilled()) {
            if (error) {
                console.error(error);
            }
            deferredLumieresExit.reject(new Error("Lumieres exited unexpectedly"));
        } else {
            deferredLumieresExit.resolve(0);
        }
    });

    activationPromise = activateLumieres();
    sikuliTestPromise = runSikuliTest(testPath);

    testingDonePromise = Q.all([sikuliTestPromise, activationPromise]).spread(function (testingExitCode) {
        childProcess.spawn("osascript", [path.join(testDirectoryPath, "quit.scpt")]);
        return testingExitCode;
    });

    return Q.all([testingDonePromise, deferredLumieresExit.promise]).spread(function (testingExitCode) {
        return testingExitCode;
    });
}

function activateLumieres () {
    var deferredActivation = Q.defer();
    var activationProcess = childProcess.spawn("osascript", [path.join(testDirectoryPath, "activate.scpt")]);

    activationProcess.on("close", function (code) {
        if (1 === code) {
            deferredActivation.resolve(activateLumieres());
        } else {
            deferredActivation.resolve(code);
        }
    });

    return deferredActivation.promise;
}

function runSikuliTest (testPath) {
    var deferredSikuliExit = Q.defer();
    var sikuliProcess = childProcess.spawn("sh", [sikuli, "-r", testPath]);

    sikuliProcess.on("close", function (code) {
        deferredSikuliExit.resolve(code);
    });

    return deferredSikuliExit.promise;
}

function teardownTest (name) {
    return Q(true);
}
