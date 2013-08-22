var viewCommand = require('../../../backend_plugins/package-manager-library/view-command').viewCommand,
    Q = require("q"),
    ErrorsCodes = require("../../../extensions/package-manager.filament-extension/core/package-tools.js").Errors.commands.view.codes;

describe("view command", function () {

    beforeEach(function() {
        this.addMatchers({
            toBeError: function() {
                return (this.actual instanceof Error);
            }
        });
    });

    describe("request", function () {

        it('should throw an error if the request is not valid', function() {

            return Q.invoke(viewCommand, 'run', 'montage@').then(null, function (error) {
                expect(error).toBeError();
                expect(error.message).toEqual(ErrorsCodes.wrongRequestFormat.toString());

                return Q.invoke(viewCommand, 'run', 'montage@1.0').then(null, function (error) {
                    expect(error).toBeError();
                    expect(error.message).toEqual(ErrorsCodes.wrongRequestFormat.toString());

                    return Q.invoke(viewCommand, 'run', 45).then(null, function (error) {
                        expect(error).toBeError();
                        expect(error.message).toEqual(ErrorsCodes.requestInvalid.toString());
                    });
                });
            });
        });

        it("should throw an error if the dependency doesn't exist", function() {

            return Q.invoke(viewCommand, 'run', 'ducem').then(null, function (error) {
                expect(error).toBeError();
                expect(error.message).toEqual(ErrorsCodes.dependencyNotFound.toString());
            });

        });

        it("should get correct information about montage@0.13.0", function() {

            return Q.invoke(viewCommand, "run", 'montage@0.13.0').then(function (module) {
                expect(module.name).toBeDefined();
                expect(module.version).toBeDefined();
                expect(module.name).toEqual('montage');
                expect(module.version).toEqual('0.13.0');
            });

        });

    });

});
