var viewCommand = require('../../../backend_plugins/package-manager-library/view-command').viewCommand,
    Q = require("q"),
    ERROR_TYPE_NOT_FOUND = 404,
    ERROR_TYPE_UNKNOWN = -1;

describe("view command", function () {

    beforeEach(function() {
        this.addMatchers({
            toBeError: function() {
                return (this.actual instanceof Error);
            }
        });

        this.addMatchers({
            toBeTypeError: function() {
                return (this.actual instanceof TypeError);
            }
        });
    });

    describe("request", function () {

        it('should throw an error if the request is not valid', function() {

            return Q.invoke(viewCommand, 'run', 'montage@').then(null, function (error) {
                expect(error).toBeError();
            });

            return Q.invoke(viewCommand, 'run', 'montage@1.0').then(null, function (error) {
                expect(error).toBeError();
            });

            return Q.invoke(viewCommand, 'run', 45).then(null, function (error) {
                expect(error).toBeTypeError();
            });

        });

        it("should throw an error if the dependency doesn't exist", function() {

            return Q.invoke(viewCommand, 'run', 'ducem').then(null, function (error) {
                expect(error).toBeError();
                expect(error).toEqual(ERROR_TYPE_NOT_FOUND);
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
