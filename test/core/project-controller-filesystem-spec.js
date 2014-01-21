var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    editorMock = require("test/mocks/editor-mocks").editorMock,
    editorControllerMock = require("test/mocks/editor-controller-mocks").editorControllerMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-filesystem-spec", function () {

    var bridge, viewController, editorController, projectController, mockMenu,
        projectControllerLoadedPromise, watcher;

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
                files.push(new FileDescriptor().initWithUrlAndStat("projectUrl/package.json", {mode: 0}));
                files.push(new FileDescriptor().initWithUrlAndStat("projectUrl/README", {mode: 0}));
                files.push(new FileDescriptor().initWithUrlAndStat("projectUrl/ui/", {mode: 16384}));
                return Promise.resolve(files);
            },

            listTreeAtUrl: function(url) {
                return this.list(url)
                .then(function(files) {
                    files.push(new FileDescriptor().initWithUrlAndStat("projectUrl/ui/component.reel/", {mode: 16384}));
                    files.push(new FileDescriptor().initWithUrlAndStat("projectUrl/ui/component.reel/component.js", {mode: 0}));
                    return files;
                });
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

        require.injectPackageDescription(require.location + "projectUrl/" , {
            name: "test"
        });

        viewController = ViewController.create();
        projectController = new ProjectController().init(bridge, viewController, editorController);
        projectControllerLoadedPromise = projectController.loadProject("projectUrl");

        watcher = {};
    });

    describe("observing a file creation", function () {

        describe("when the creation was at the root of the project", function () {

            var fullPath, currentStat, previousStat;

            beforeEach(function () {
                fullPath = "projectUrl/foo";
                currentStat = {};
                previousStat = null;
            });

            it("adds to the children", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");
                    expect(parent.children.length).toBe(4);

                    var file = projectController.fileInTreeAtUrl(fullPath);
                    expect(parent.children.indexOf(file)).not.toBe(-1);
                    expect(file.fileUrl).toBe(fullPath);
                    expect(file.name).toBe("foo");
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should add to the files map", function() {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(projectController._filesMap.has(fullPath)).toBe(true);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should have a filename property", function() {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);
                    var file = projectController.fileInTreeAtUrl(fullPath);

                    expect(file.filename).toBe("/foo");
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
                    expect(parent.children.length).toBe(0);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should not add to the files map", function() {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(projectController._filesMap.has(fullPath)).toBe(false);
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
                parent.expanded = true;
                return parent;
            };

            it("should add the new file as a child of its parent", function () {
                return projectControllerLoadedPromise.then(function () {
                    var parent = exploreParent();

                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(parent.children.length).toBe(1);
                    var file = projectController.fileInTreeAtUrl(fullPath);
                    expect(parent.children.indexOf(file)).not.toBe(-1);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should add to the files map", function() {
                return projectControllerLoadedPromise.then(function () {
                    exploreParent();
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(projectController._filesMap.has(fullPath)).toBe(true);
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
                    var file = projectController.fileInTreeAtUrl(fullPath);
                    expect(file).toBe(null);

                    // check that the others have been left alone
                    expect(parent.children[0].name).toBe("package.json");
                    expect(parent.children[1].name).toBe("ui");
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should remove from the files map", function() {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange(changeType, fullPath, currentStat, previousStat);

                    expect(projectController._filesMap.has(fullPath)).toBe(false);
                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

        describe("when the deletion is inside an unexplored subdirectory", function () {

            var fullPath, currentStat, previousStat, parentPath;

            beforeEach(function () {
                parentPath = "projectUrl/ui";
                fullPath = "projectUrl/ui/unexplored/foo.png";
                currentStat = {};
                previousStat = null;
            });

            var exploreParent = function () {
                var parent = projectController.fileInTreeAtUrl(parentPath);
                parent.expanded = true;
                return parent;
            };

            it("it must not learn about the deleted file upon exploration", function () {
                return projectControllerLoadedPromise.then(function () {

                    watcher.simulateChange("delete", fullPath, currentStat, previousStat);

                    var parent = exploreParent();

                    expect(parent.children.length).toBe(0);
                    var file = projectController.fileInTreeAtUrl(fullPath);
                    expect(parent.children.indexOf(file)).toBe(-1);
                }).timeout(WAITSFOR_TIMEOUT);
            });

        });
    });

    describe("file changes", function () {

        var mockFileStat;

        beforeEach(function () {
            mockFileStat = {
                node: {
                    dev: 2114,
                    ino: 48064969,
                    mode: 33188,
                    nlink: 1,
                    uid: 85,
                    gid: 100,
                    rdev: 0,
                    size: 527,
                    blksize: 4096,
                    blocks: 8,
                    atime: new Date(),
                    mtime: new Date(),
                    ctime: new Date()
                },
                size: 527
            };
        });

        it("doesn't record file changes when no document is opened", function () {
            return projectControllerLoadedPromise.then(function () {
                expect(projectController._fileChangesHead).toEqual({next: null});
                var head = projectController._fileChangesHead;

                watcher.simulateChange("update", "test", mockFileStat, mockFileStat);
                expect(projectController._fileChangesHead).toBe(head);
            });
        });

        describe("when a document is open", function () {
            var fooDocument, barDocument;

            beforeEach(function () {
                fooDocument = new (Montage.specialize({
                    constructor: {
                        value: function mockDocument() {
                            this.super();
                        }
                    },

                    url: {
                        value: "other"
                    },

                    canClose: {
                        value: Function.noop
                    },

                    filesDidChange: {
                        value: function () {}
                    }
                }, {
                    editorType: {
                        value: editorMock
                    }
                }))();

                barDocument = new (Montage.specialize({

                    constructor: {
                        value: function mockDocument() {
                            this.super();
                        }
                    },

                    url: {
                        value: "current"
                    },

                    canClose: {
                        value: Function.noop
                    },

                    filesDidChange: {
                        value: function () {}
                    }
                }, {
                    editorType: {
                        value: editorMock
                    }
                }))();

                projectController.currentEditor = editorMock();

                projectController.addDocument(fooDocument);
                projectController.addDocument(barDocument);
                projectController._setCurrentDocument(fooDocument);
            });

            it("records file changes", function () {
                return projectControllerLoadedPromise.then(function () {
                    expect(projectController._fileChangesHead).toEqual({next: null});
                    var head = projectController._fileChangesHead;

                    watcher.simulateChange("update", "test", mockFileStat, mockFileStat);
                    expect(projectController._fileChangesHead).not.toBe(head);
                    expect(projectController._fileChangesHead).toEqual({
                        change: "update",
                        fileUrl: "test",
                        currentStat: mockFileStat,
                        previousStat: mockFileStat,
                        next: null
                    });
                });
            });

            it("calls filesDidChange on document", function () {
                return projectControllerLoadedPromise.then(function () {
                    spyOn(fooDocument, "filesDidChange");
                    spyOn(barDocument, "filesDidChange");

                    watcher.simulateChange("update", "test", mockFileStat, mockFileStat);

                    expect(barDocument.filesDidChange).not.toHaveBeenCalled();
                    expect(fooDocument.filesDidChange).toHaveBeenCalled();
                    expect(fooDocument.filesDidChange.mostRecentCall.args.length).toBe(1);
                    expect(Array.isArray(fooDocument.filesDidChange.mostRecentCall.args[0])).toBe(true);
                    expect(fooDocument.filesDidChange.mostRecentCall.args[0].length).toBe(1);
                });
            });

            it("called filesDidChange with queued changes when a document is focused", function () {
                return projectControllerLoadedPromise.then(function () {
                    spyOn(barDocument, "filesDidChange");

                    watcher.simulateChange("update", "test1", mockFileStat, mockFileStat);
                    watcher.simulateChange("update", "test2", mockFileStat, mockFileStat);
                    watcher.simulateChange("update", "test3", mockFileStat, mockFileStat);

                    expect(barDocument.filesDidChange).not.toHaveBeenCalled();

                    projectController._setCurrentDocument(barDocument);

                    expect(barDocument.filesDidChange).toHaveBeenCalled();
                    expect(barDocument.filesDidChange.mostRecentCall.args.length).toBe(1);
                    expect(Array.isArray(barDocument.filesDidChange.mostRecentCall.args[0])).toBe(true);
                    expect(barDocument.filesDidChange.mostRecentCall.args[0].length).toBe(3);
                });
            });

        });
    });

    describe("fileInTreeAtUrl", function () {

        it("works when passed a trailing slash", function () {
            return projectControllerLoadedPromise.then(function () {
                var ui = projectController.fileInTreeAtUrl("projectUrl/ui/");
                expect(ui.name).toBe("ui");
            });
        });

    });

    describe("files map", function() {
        it("should get the map of all files", function() {
            return projectController.getFilesMap().then(function(files) {
                expect(files.length).toBe(5);
            });
        });

        it("should wire the file tree", function() {
            return projectController.getFilesMap().then(function(files) {
                var ui = files.get("projectUrl/ui/");
                var component = files.get("projectUrl/ui/component.reel/");

                expect(ui.expanded).toBe(true);
                expect(ui.children.length).toBe(1);

                expect(component.expanded).toBe(true);
                expect(component.children.length).toBe(1);
            });
        });

        it("should not create a new file descriptor for a loaded file", function() {
            return projectControllerLoadedPromise.then(function () {
                var url = "projectUrl/package.json";
                var fileDescriptor = projectController.fileInTreeAtUrl(url);

                return projectController.getFilesMap().then(function(files) {
                    expect(files.get(url)).toBe(fileDescriptor);
                });
            });
        });

        it("should have a filename property", function() {
            return projectController.getFilesMap().then(function(files) {
                var file = files.get("projectUrl/package.json");

                expect(file.filename).toBe("/package.json");
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

});
