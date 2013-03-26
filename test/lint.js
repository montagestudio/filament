#!/usr/bin/env node

var JSHINT = require("jshint").JSHINT;
var reporter = require("jshint/src/reporters/default").reporter;
require('shelljs/global');
/*global cat,exec,__dirname,process,console */

var baseName = process.argv[2] || "origin/master";
var baseHash = exec("git rev-parse --short " + baseName, {silent: true}).output.trim();
var HEAD = exec("git rev-parse --short HEAD", {silent: true}).output.trim();
var jshintOptions = JSON.parse(cat(__dirname + "/../.jshintrc"));

// globals is not accepted as an option through the API, pass along as its own arg
var globals = jshintOptions.globals;
delete jshintOptions.globals;

var changedJsFiles = exec("git diff --name-only " + baseHash, {silent: true}).output
.trim()
.split("\n")
.filter(function (filename) {
    return filename.match(/\.js$/);
});

console.log("Linting " + changedJsFiles.length + " changed files between " + baseHash + " (" + baseName + ") and " + HEAD);
console.log();

var results = [], data = [];
changedJsFiles.forEach(function (filename) {
    if (!JSHINT(cat(filename), jshintOptions, globals)) {
        JSHINT.errors.forEach(function (err) {
            if (err) {
                results.push({ file: filename, error: err });
            }
        });
    }

    var lintData = JSHINT.data();

    if (lintData) {
        lintData.file = filename;
        data.push(lintData);
    }
});

reporter(results, data);
if (results.length) {
    process.exit(1);
}

console.log("No errors!");
process.exit(0);
