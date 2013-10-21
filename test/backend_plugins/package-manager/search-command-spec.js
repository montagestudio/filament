/*global describe,beforeEach,it,expect,waitsFor,runs*/

var searchCommand = require('../../../backend_plugins/package-manager-library/search-command').searchCommand,
    SandboxedModule = require('sandboxed-module'),
    ErrorsCodes = require("../../../extensions/package-manager.filament-extension/core/package-tools.js").Errors.commands.search.codes,
    npm = require("npm"),
    Q = require("q");

describe("search command", function () {

    beforeEach(function () {

        runs(function() {
            npm.load(null, function () {
                searchCommand = SandboxedModule.require('../../../backend_plugins/package-manager-library/search-command', {
                    requires: {"npm": npm}
                }).searchCommand;
            });
        });

        waitsFor(function() {
            return npm.config.loaded;
        }, "The npm package should be loaded", 750);
    });

    it("the request should be a valid name.", function() {

        return Q.invoke(searchCommand, 'run', 'montage%').then(null, function (error) {
            expect(error instanceof Error).toEqual(true);
            expect(error.code).toEqual(ErrorsCodes.requestInvalid);

            return Q.invoke(searchCommand, 'run', 4).then(null, function (error) {
                expect(error instanceof Error).toEqual(true);
                expect(error.code).toEqual(ErrorsCodes.requestInvalid);
            });
        });
    });

    it("should return an array when there are some results.", function() {

        return Q.invoke(searchCommand, 'run', 'montage').then(function (results) {
            expect(Array.isArray(results)).toEqual(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBeDefined();
            expect(results[0].version).toBeDefined();
            expect(results[0].description).toBeDefined();
        });
    });

    it("should return an array with a length corresponding to the limit, when it's specified.", function() {

        return Q.invoke(searchCommand, 'run', 'montage', 5).then(function (results) {
            expect(Array.isArray(results)).toEqual(true);
            expect(results.length).not.toBeGreaterThan(5);
        });
    });

    it("should return an empty array when there is no result.", function() {

        return Q.invoke(searchCommand, 'run', 'ducem').then(function (results) {
            expect(Array.isArray(results)).toEqual(true);
            expect(results.length).toEqual(0);
        });
    });

});
