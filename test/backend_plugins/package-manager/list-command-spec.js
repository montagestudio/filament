var SandboxedModule = require('sandboxed-module'),
    ProjectFSMocks = require("./mocks/project-fs-mocks").ProjectFSMocks,
    ProjectFSMocksFactory = require('./mocks/project-fs-mocks-factory').ProjectFSMocksFactory,
    ErrorsCodes = require("../../../extensions/package-manager.filament-extension/core/package-tools.js").Errors.commands.list.codes,
    QFSMock = require("q-io/fs-mock"),
    Q = require("q"),
    DEFAULT_PROJECT_APP = 'MyProject',
    DEPENDENCY_TYPE_REGULAR = 'dependencies',
    DEPENDENCY_TYPE_OPTIONAL = 'optionalDependencies',
    DEPENDENCY_TYPE_BUNDLE = 'bundledDependencies',
    DEPENDENCY_TYPE_DEV = 'devDependencies';

describe("list command", function () {
    var mockFS, listCommand;

    describe("no errors situation:", function () {

        beforeEach(function () {
            mockFS = ProjectFSMocks(DEFAULT_PROJECT_APP);

            listCommand = SandboxedModule.require('../../../backend_plugins/package-manager-library/list-command', {
                requires: {"q-io/fs": mockFS}
            }).listCommand;
        });

        it('should gather some correct information about the project.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(typeof tree).toEqual("object");
                expect(tree.name).toEqual(DEFAULT_PROJECT_APP);
                expect(tree.version).toEqual('0.1.0');
                expect(tree.file).toBeDefined();
                expect(tree.dependencies.length).toBeGreaterThan(0);
            });
        });

        it('should has no errors in this situation.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                for (var i = 0, length = tree.dependencies.length; i < length; i++) {
                    expect(tree.dependencies[i].problems).not.toBeDefined();
                }
            });
        });

        it('should detect when an ancestor is used by a deeper dependency.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[2].problems).not.toBeDefined(); // montage
            });
        });

        it('a dependency is not extraneous if it belongs to the "bundledDependencies" field.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[8].problems).not.toBeDefined(); // zip
                expect(tree.dependencies[8].type).toEqual(DEPENDENCY_TYPE_BUNDLE);
            });
        });

        it('a dependency is not missing if it belongs to the "devDependencies" or the "optionalDependencies" field.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[6].problems).not.toBeDefined(); // sip
                expect(tree.dependencies[6].type).toEqual(DEPENDENCY_TYPE_OPTIONAL);
                expect(tree.dependencies[7].problems).not.toBeDefined(); // underscore
                expect(tree.dependencies[7].type).toEqual(DEPENDENCY_TYPE_DEV);
            });
        });

    });

    describe("errors situation:", function () {

        beforeEach(function () {
            mockFS = ProjectFSMocks(DEFAULT_PROJECT_APP, true); // returns a mock tree with several errors.

            listCommand = SandboxedModule.require('../../../backend_plugins/package-manager-library/list-command', {
                requires: {"q-io/fs": mockFS}
            }).listCommand;
        });

        it('should detect when a regular dependency is missing.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[0].missing).toEqual(true); // digit
                expect(tree.dependencies[0].type).toEqual(DEPENDENCY_TYPE_REGULAR);
                expect(tree.dependencies[0].problems).toBeDefined();
                expect(tree.dependencies[0].problems[0].type).toEqual(ErrorsCodes.missing);
                expect(tree.dependencies[1].missing).toEqual(false); // filament
            });
        });

        it('should detect an extraneous dependency.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[1].extraneous).toEqual(true); // filament
                expect(tree.dependencies[1].problems).toBeDefined();
                expect(tree.dependencies[1].problems[0].type).toEqual(ErrorsCodes.extraneous);
            });
        });

        it('should detect an invalid regular or optional dependency version.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[2].invalid).toEqual(true); // montage
                expect(tree.dependencies[2].type).toEqual(DEPENDENCY_TYPE_REGULAR);
                expect(tree.dependencies[2].problems).toBeDefined();
                expect(tree.dependencies[2].problems[0].type).toEqual(ErrorsCodes.versionInvalid);

                expect(tree.dependencies[3].type).toEqual(DEPENDENCY_TYPE_OPTIONAL); // montage-testing
                expect(tree.dependencies[3].problems).toBeDefined();
                expect(tree.dependencies[3].problems[0].type).toEqual(ErrorsCodes.versionInvalid);

                expect(tree.dependencies[4].type).toEqual(DEPENDENCY_TYPE_DEV); // native
                expect(tree.dependencies[4].problems).not.toBeDefined();
            });
        });

        it('should detect an invalid ancestor which its used by a deeper dependency.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[2].problems).toBeDefined(); // montage
                expect(tree.dependencies[2].problems[1].type).toEqual(ErrorsCodes.missing);
                expect(tree.dependencies[2].problems[2].type).toEqual(ErrorsCodes.versionInvalid); // the module joey needs a valid version of the package named zip.
            });
        });

        it('should detect when a package.json file is missing.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[9].problems).toBeDefined(); // zy
                expect(tree.dependencies[9].problems[0].type).toEqual(ErrorsCodes.fileErrors);
            });
        });

        it('should detect when a package.json file shows some errors.', function() {

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect(tree.dependencies[10].problems).toBeDefined(); // zx
                expect(tree.dependencies[10].problems[0].type).toEqual(ErrorsCodes.fileErrors);
            });
        });

        it('should detect when the project package.json file shows some errors.', function() {
            mockFS = QFSMock(ProjectFSMocksFactory.build({
                name: DEFAULT_PROJECT_APP,
                version: '0.1.1',
                jsonFileError: true
            }));

            listCommand = SandboxedModule.require('../../../backend_plugins/package-manager-library/list-command', {
                requires: {"q-io/fs": mockFS}
            }).listCommand;

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(null, function (error) {
                expect(error.message).toEqual(ErrorsCodes.projectFileErrors.toString());
            });
        });

        it('should handle wrong project paths.', function() {

            return Q.invoke(listCommand, 'run', '/root/', true).then(null, function (error) {
                expect(error.message).toEqual(ErrorsCodes.projectFileErrors.toString());

                return Q.invoke(listCommand, 'run', 1, true).then(null, function (error) {
                    expect(error.message).toEqual(ErrorsCodes.pathMissing.toString());
                });
            });
        });

        it('should not complain if no dependencies are required.', function() {
            mockFS = QFSMock(ProjectFSMocksFactory.build({
                name: DEFAULT_PROJECT_APP,
                version: '0.1.1'
            }));

            listCommand = SandboxedModule.require('../../../backend_plugins/package-manager-library/list-command', {
                requires: {"q-io/fs": mockFS}
            }).listCommand;

            return Q.invoke(listCommand, 'run', DEFAULT_PROJECT_APP, true).then(function (tree) {
                expect((Array.isArray(tree.dependencies) && tree.dependencies.length === 0)).toEqual(true);
            });
        });

    });

});
