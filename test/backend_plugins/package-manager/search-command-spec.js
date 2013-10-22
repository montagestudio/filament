/*global describe,beforeEach,it,expect,waitsFor,runs*/

var searchCommand = require('../../../backend_plugins/package-manager-library/search-command').searchCommand,
    loadPackageManager = require('../../../backend_plugins/package-manager').loadPackageManager,
    ErrorsCodes = require("../../../extensions/package-manager.filament-extension/core/package-tools.js").Errors.commands.search.codes,
    npm = require("npm"),
    path = require("path"),
    Q = require("q"),
    PackageManagerLoaded = false;

describe("search command", function () {

    beforeEach(function () {

        runs(function() {
            loadPackageManager('/', path.join(process.env.HOME, "/Library/Application Support/Lumieres/"))
                .then(function (loaded) {
                    PackageManagerLoaded = loaded;
                });
        });

        waitsFor(function() {
            return PackageManagerLoaded;
        }, "The PackageManager should be loaded", 1250);
    });

    it("the request should be a valid name.", function() {

        return searchCommand.run('montage%').then(null, function (error) {
            expect(error instanceof Error).toEqual(true);
            expect(error.code).toEqual(ErrorsCodes.requestInvalid);

            return searchCommand.run(4).then(null, function (error) {
                expect(error instanceof Error).toEqual(true);
                expect(error.code).toEqual(ErrorsCodes.requestInvalid);
            });
        });
    });

    it("should return an array when there are some results.", function() {

        return searchCommand.run('montage').then(function (results) {
            expect(Array.isArray(results)).toEqual(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBeDefined();
            expect(results[0].version).toBeDefined();
            expect(results[0].description).toBeDefined();
        });
    });

    it("When a request represents exactly a package name, this one should be first within the search result", function() {

        return searchCommand.run('montage').then(function (results) {
            expect(results[0].name).toEqual('montage');
        });
    });

    it("should return an empty array when there is no result.", function() {

        return searchCommand.run('ducem').then(function (results) {
            expect(Array.isArray(results)).toEqual(true);
            expect(results.length).toEqual(0);
        });
    });

});
