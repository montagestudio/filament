/*global describe,beforeEach,it,expect,waitsFor,runs*/

var viewCommand = require('../../../backend_plugins/package-manager-library/view-command').viewCommand,
    ErrorsCodes = require("../../../extensions/package-manager.filament-extension/core/package-tools.js").Errors.commands.view.codes,
    SandboxedModule = require('sandboxed-module'),
    npm = require("npm"),
    Q = require("q");

describe("view command", function () {

    beforeEach(function () {

        runs(function() {
            npm.load(null, function () {
                viewCommand = SandboxedModule.require('../../../backend_plugins/package-manager-library/view-command', {
                    requires: {"npm": npm}
                }).viewCommand;
            });
        });

        waitsFor(function() {
            return npm.config.loaded;
        }, "The npm package should be loaded", 750);
    });

    it('should throw an error if the request is not valid.', function() {

        return Q.invoke(viewCommand, 'run', 'montage@').then(null, function (error) {
            expect(error instanceof Error).toEqual(true);
            expect(error.code).toEqual(ErrorsCodes.wrongRequestFormat);

            return Q.invoke(viewCommand, 'run', 'montage@1.0').then(null, function (error) {
                expect(error instanceof Error).toEqual(true);
                expect(error.code).toEqual(ErrorsCodes.wrongRequestFormat);

                return Q.invoke(viewCommand, 'run', 45).then(null, function (error) {
                    expect(error instanceof Error).toEqual(true);
                    expect(error.code).toEqual(ErrorsCodes.requestInvalid);
                });
            });
        });
    });

    it("should throw an error if the dependency doesn't exist.", function() {

        return Q.invoke(viewCommand, 'run', 'ducem').then(null, function (error) {
            expect(error instanceof Error).toEqual(true);
            expect(error.code).toEqual(ErrorsCodes.dependencyNotFound);
        });
    });

    it("should get some valid information about montage@0.13.0.", function() {

        return Q.invoke(viewCommand, "run", 'montage@0.13.0').then(function (module) {
            expect(typeof module === 'object').toBeDefined();
            expect(module.name).toEqual('montage');
            expect(module.version).toEqual('0.13.0');
        });
    });

});
