#! /usr/bin/env node
var childProcess = require('child_process');
var env = process.env;

var mappings = Object.keys(env).filter(function (key) {
    return (/^npm_package_mappings_\S+_name$/).test(key);
}).map(function (mappingNameKey) {
    var mappingName = mappingNameKey.replace(/^npm_package_mappings_(\S+)_name$/, "$1");
    var locationKey = "npm_package_mappings_" + mappingName + "_location";
    return {dependencyName: mappingName, name: env[mappingNameKey], location: env[locationKey]}
});

var lifecycleEvent = env.npm_lifecycle_event;
mappings.forEach(function (mapping) {
    var f = childProcess.spawn('npm', [lifecycleEvent], {
        cwd: env.PWD + "/" + mapping.location,
        stdio: "inherit"});
});
