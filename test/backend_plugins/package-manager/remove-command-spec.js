var SandboxedModule = require('sandboxed-module'),
    ProjectFSMocks = require("./mocks/project-fs-mocks").ProjectFSMocks,
    ErrorsCodes = require("../../../extensions/package-manager.filament-extension/core/package-tools.js").Errors.commands.remove.codes,
    Q = require("q"),
    PROJECT_APP_NAME = 'MyProject';

describe("remove command", function () {
    var mockFS, removeCommand;

    beforeEach(function () {
        mockFS = ProjectFSMocks(PROJECT_APP_NAME);

        removeCommand = SandboxedModule.require('../../../backend_plugins/package-manager-library/remove-command', {
            requires: {"q-io/fs": mockFS}
        }).removeCommand;
    });

    it('should remove a specified dependency.', function() {

        return Q.invoke(removeCommand, 'run', 'montage', PROJECT_APP_NAME).then(function (module) {
            expect(typeof module).toEqual("object");
            expect(module.name).toEqual("montage");

        });
    });

    it('should throw an error when the dependency name is not a valid string.', function() {

        return Q.invoke(removeCommand, 'run', 3, PROJECT_APP_NAME).then(null, function (error) {
            expect(error.code).toEqual(ErrorsCodes.nameInvalid);
        });
    });

    it('should throw an error when the dependency name is not valid.', function() {

        return Q.invoke(removeCommand, 'run', 'Montage%', PROJECT_APP_NAME).then(null, function (error) {
            expect(error.code).toEqual(ErrorsCodes.nameInvalid);
        });
    });

    it('should throw an error when the project path is not valid.', function() {

        return Q.invoke(removeCommand, 'run', 'montage', 3).then(null, function (error) {
            expect(error.code).toEqual(ErrorsCodes.pathInvalid);
        });
    });

});
