var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    editorMock = require("test/mocks/editor-mocks").editorMock,
    editorControllerMock = require("test/mocks/editor-controller-mocks").editorControllerMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    FileDescriptor = require("core/file-descriptor").FileDescriptor,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-spec", function () {

    var bridge, viewController, editorController, projectController, mockMenu, textUrl, reelUrl,
        editor, projectControllerLoadedPromise, watcher;

    beforeEach(function () {
        mockMenu = menuMock({
            menuItems: {
                "newComponent": Montage.create(),
                "newModule": Montage.create()
            }
        });

        watcher = {};

        bridge = environmentBridgeMock({
            mainMenu: mockMenu,
            list: function (url) {
                var files = [];
                files.push(FileDescriptor.create().initWithUrlAndStat("projectUrl/package.json", {mode: 0}));
                files.push(FileDescriptor.create().initWithUrlAndStat("projectUrl/README", {mode: 0}));
                files.push(FileDescriptor.create().initWithUrlAndStat("projectUrl/ui/", {mode: 16384}));
                return Promise.resolve(files);
            },

            watch: function (path, ignoreSubPaths, changeHandler, errorHandler) {
                watcher.simulateChange = function () {
                    changeHandler.apply(this, arguments);
                };

                watcher.simulateError = function () {
                    errorHandler.apply(this, arguments);
                };

                return Promise.resolve();
            }
        });

        editorController = editorControllerMock();

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController, editorController);
        projectControllerLoadedPromise = projectController.loadProject("projectUrl");

        watcher = {};
    });

    describe("observing a file creation", function () {

        describe("when the creation was at the root of the project", function () {

            var fullPath, currentStat, previousStat;

            beforeEach(function () {
                fullPath = "projectUrl/foo/";
                currentStat = {};
                previousStat = null;
            });

            it("should add the new file as a child of its parent", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");

                    expect(parent.children.length).toBe(4);
                    expect(parent.children[3].fileUrl).toBe(fullPath);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should be considered a directory if it was a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    currentStat = {mode: 16384};
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");
                    expect(parent.children[3].isDirectory).toBe(true);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should not be considered a directory if it was not a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");
                    expect(parent.children[3].isDirectory).toBe(false);
                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

        describe("when the creation was inside of unexplored subdirectory", function () {

            var fullPath, currentStat, previousStat;

            beforeEach(function () {
                fullPath = "projectUrl/ui/foo/";
                currentStat = {};
                previousStat = null;
            });

            it("should not affect the root's children", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(projectController.files.children.length).toBe(3);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should not add the new file as a child of its parent", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl/ui");
                    expect(parent.children).toBeUndefined();
                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

        describe("when the creation was inside of explored subdirectory", function () {

            var fullPath, currentStat, previousStat, parentPath;

            beforeEach(function () {
                parentPath = "projectUrl/ui";
                fullPath = "projectUrl/ui/foo/";
                currentStat = {};
                previousStat = null;
            });

            var exploreParent = function () {
                var parent = projectController.fileInTreeAtUrl(parentPath);
                parent.children = [];
                return parent;
            };

            it("should add the new file as a child of its parent", function () {
                return projectControllerLoadedPromise.then(function () {
                    var parent = exploreParent();

                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(parent.children.length).toBe(1);
                    expect(parent.children[0].fileUrl).toBe(fullPath);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should be considered a directory if it was a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    var parent = exploreParent();

                    currentStat = {mode: 16384};
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(parent.children[0].isDirectory).toBe(true);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should not be considered a directory if it was not a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    var parent = exploreParent();

                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(parent.children[0].isDirectory).toBe(false);
                }).timeout(WAITSFOR_TIMEOUT);
            });


        });

    });

    describe("observing a file deletion", function () {

        describe("when the deletion was at the root of the project", function () {

            var changeType, fullPath, currentStat, previousStat;

            beforeEach(function () {
                changeType = "delete";
                fullPath = "projectUrl/README";
                currentStat = null;
                previousStat = {};
            });

            it("should remove the file as a child of its parent", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange(changeType, fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");

                    expect(parent.children.length).toBe(2);
                    expect(parent.children[0].name).toBe("package.json");
                    expect(parent.children[1].name).toBe("ui");
                }).timeout(WAITSFOR_TIMEOUT);
            });

        });
    });

});
