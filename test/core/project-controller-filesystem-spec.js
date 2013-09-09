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

describe("core/project-controller-filesystem-spec", function () {

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

            describe("insertion order", function () {
                it("is first if alphabetical ordering is first", function () {
                    return projectControllerLoadedPromise.then(function () {
                        watcher.simulateChange("create", "projectUrl/a", currentStat, previousStat);

                        var parent = projectController.fileInTreeAtUrl("projectUrl");
                        expect(parent.children.length).toBe(4);

                        var file = parent.children.array.get(1);
                        expect(file.name).toBe("a");
                    }).timeout(WAITSFOR_TIMEOUT);
                });

                it("is last if alphabetical ordering is last", function () {
                    return projectControllerLoadedPromise.then(function () {
                        watcher.simulateChange("create", "projectUrl/z", currentStat, previousStat);

                        var parent = projectController.fileInTreeAtUrl("projectUrl");
                        expect(parent.children.length).toBe(4);

                        var file = parent.children.array.get(3);
                        expect(file.name).toBe("z");
                    }).timeout(WAITSFOR_TIMEOUT);
                });
            });

            it("should add the new file as a child of its parent", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");

                    expect(parent.children.length).toBe(4);
                    expect(parent.children.array.get(1).fileUrl).toBe(fullPath);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should be considered a directory if it was a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    currentStat = {mode: 16384};
                    fullPath += "/";
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");
                    expect(parent.children.array.get(0).fileUrl).toBe(fullPath);
                    expect(parent.children.array.get(0).isDirectory).toBe(true);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should not be considered a directory if it was not a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    var parent = projectController.fileInTreeAtUrl("projectUrl");
                    expect(parent.children.array.get(1).isDirectory).toBe(false);
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
                    expect(parent.children.array.get(0).fileUrl).toBe(fullPath);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should be ordered correctly", function () {
                return projectControllerLoadedPromise.then(function () {
                    var parent = exploreParent();

                    watcher.simulateChange("create", parentPath + "/z", currentStat, previousStat);
                    watcher.simulateChange("create", parentPath + "/a", currentStat, previousStat);

                    expect(parent.children.length).toBe(2);

                    var file = parent.children.array.get(0);
                    expect(file.name).toBe("a");
                }).timeout(WAITSFOR_TIMEOUT);
            });


            it("should be considered a directory if it was a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    var parent = exploreParent();

                    currentStat = {mode: 16384};
                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(parent.children.array.get(0).isDirectory).toBe(true);
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should not be considered a directory if it was not a directory", function () {
                return projectControllerLoadedPromise.then(function () {
                    var parent = exploreParent();

                    watcher.simulateChange("create", fullPath, currentStat, previousStat);

                    expect(parent.children.array.get(0).isDirectory).toBe(false);
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
                    expect(parent.children.array.get(1).name).toBe("package.json");
                    expect(parent.children.array.get(0).name).toBe("ui");
                }).timeout(WAITSFOR_TIMEOUT);
            });

        });
    });

    describe("file changes", function () {

        var mockFileStat;

        beforeEach(function () {
            var editorType = editorMock;

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

});
