/*global describe,beforeEach,it,expect */

var SandboxedModule = require('sandboxed-module');
var QFSMock = require("q-io/fs-mock");
var Q = require("q");

describe("filament backend", function () {

    describe("getExtensions", function () {
        var mockFS, filamentBackend;

        beforeEach(function () {
            mockFS = QFSMock({
                "root": {
                    "extensions": {
                        "a.filament-extension": 1,
                        "b.filament-extension": 1
                    }
                }
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {"q-io/fs": mockFS},
                globals: {clientPath: "/root"}
            });
        });

        it("lists files with .filament-extension in extensions directory", function () {
            return filamentBackend.getExtensions().then(function (extensions) {
                expect(extensions.length).toBe(2);
                expect(extensions[0].url).toBe("fs://localhost/root/extensions/a.filament-extension");
                expect(extensions[1].url).toBe("fs://localhost/root/extensions/b.filament-extension");
            });
        });
    });

    describe("createApplication", function () {
        var mockFS, filamentBackend, minitCreateSpy;

        beforeEach(function () {
            mockFS = QFSMock();

            minitCreateSpy = jasmine.createSpy("minitCreate").andCallFake(function () { return Q(); });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {
                    "q-io/fs": mockFS,
                    "minit/lib/create": {
                        create: minitCreateSpy
                    }
                },
                globals: {clientPath: "/root"}
            });

            filamentBackend.setup(true, {
                application: Q({
                    specialFolderURL: function () {
                        return Q({url: "fs://localhost/Application%20Support"});
                    }
                })
            });
        });

        it("calls minit create with 'digit' template", function () {
            return filamentBackend.createApplication("", "")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalled();
                expect(minitCreateSpy.mostRecentCall.args[0]).toEqual("digit");
            });
        });

        it("calls minit create with name and packageHome", function () {
            return filamentBackend.createApplication("name", "dir")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalled();
                expect(minitCreateSpy.mostRecentCall.args[1].name).toEqual("name");
                expect(minitCreateSpy.mostRecentCall.args[1].packageHome).toEqual("dir");
            });
        });

        it("calls minit create with npmCache", function () {
            return filamentBackend.createApplication("", "")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalled();
                expect(minitCreateSpy.mostRecentCall.args[1].npmCache).toEqual("/Application Support/npm-cache");
            });
        });

    });

    describe("createComponent", function () {
        var mockFS, filamentBackend, minitCreateSpy;

        beforeEach(function () {
            mockFS = QFSMock();

            minitCreateSpy = jasmine.createSpy("minitCreate").andCallFake(function () {
                return Q({resultPath: "resultPath"});
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {
                    "q-io/fs": mockFS,
                    "minit/lib/create": {
                        create: minitCreateSpy
                    }
                },
                globals: {clientPath: "/root"}
            });
        });

        it("calls minit create with with 'application' template", function () {
            return filamentBackend.createComponent("name", "package", "dest")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalledWith(
                    "component",
                    {name: "name", packageHome: "package", destination: "dest"}
                );
            });
        });

        it("uses the package location as the destination by default", function () {
            return filamentBackend.createComponent("name", "package")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalledWith(
                    "component",
                    {name: "name", packageHome: "package", destination: "."}
                );
            });
        });

        it("strips .reel from the name", function () {
            return filamentBackend.createComponent("name.reel", "package", "dest")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalledWith(
                    "component",
                    {name: "name", packageHome: "package", destination: "dest"}
                );
            });
        });

        it("resolves as the path to the created component", function () {
            return filamentBackend.createComponent("name.reel", "package", "dest")
                .then(function (path) {
                    expect(path).toEqual("resultPath");
                });
        });
    });

    describe("createModule", function () {
        var mockFS, filamentBackend, minitCreateSpy;

        beforeEach(function () {
            mockFS = QFSMock();

            minitCreateSpy = jasmine.createSpy("minitCreate").andCallFake(function () {
                return Q({name: "returnedName"});
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {
                    "q-io/fs": mockFS,
                    "minit/lib/create": {
                        create: minitCreateSpy
                    }
                },
                globals: {clientPath: "/root"}
            });
        });

        it("calls minit create with with 'module' template", function () {
            return filamentBackend.createModule("name", "package", "dest")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalledWith(
                    "module",
                    {name: "name", packageHome: "package", destination: "dest"}
                );
            });
        });

        it("uses the package location as the destination by default", function () {
            return filamentBackend.createModule("name", "package")
            .then(function () {
                expect(minitCreateSpy).toHaveBeenCalledWith(
                    "module",
                    {name: "name", packageHome: "package", destination: "."}
                );
            });
        });

        it("uses the package location as the destination by default", function () {
            return filamentBackend.createModule("name", "package", "dest")
            .then(function (path) {
                expect(path).toEqual("package/dest/returnedName");
            });
        });
    });



    describe("listTree", function () {
        var mockFS, filamentBackend;

        beforeEach(function () {
            mockFS = QFSMock({
                "simple": {
                    "a": {
                        "b.js": 1,
                        "c": {
                            "d.js": 1
                        }
                    }
                },

                "ignore": {
                    ".git": {
                        "xxx": 1
                    },
                    ".gitignore": 1,
                    ".DS_Store": 1,
                    ".idea": 1,
                    "node_modules": {
                        "x": {
                            "node_modules": {
                                "y": {
                                    "y.js": 1
                                }
                            },
                            "index.js": 1
                        }
                    },
                    "ok.js": 1
                }
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {"q-io/fs": mockFS},
            });
        });

        it("lists a tree", function () {
            return filamentBackend.listTree("/simple/a")
            .then(function (fileDescriptors) {
                expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                    "fs://localhost/simple/a/", "fs://localhost/simple/a/b.js", "fs://localhost/simple/a/c/", "fs://localhost/simple/a/c/d.js"
                ]);

            });
        });

        it("ignores some names, and doesn't traverse into the directories", function () {
            return filamentBackend.listTree("/ignore")
            .then(function (fileDescriptors) {
                expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                    "fs://localhost/ignore/", "fs://localhost/ignore/ok.js"
                ]);
            });
        });

        xit("will list a path containing node_modules", function () {
            return filamentBackend.listTree("/ignore/node_modules/x")
            .then(function (fileDescriptors) {
                return filamentBackend.listPackage("/root/a").then(function (fileDescriptors) {
                    expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                        "fs://localhost/ignore/node_modules/x/", "fs://localhost/ignore/node_modules/x/index.js"
                    ]);
                });
            });
        });
    });

    describe("listPackage", function () {

        it("skips node_modules", function() {
            var mockFS, filamentBackend;
            mockFS = QFSMock({
                "root": {
                    "a": {
                        "node_modules": {
                            "x": {
                                "node_modules": {
                                    "y": {
                                        "y.js": 1
                                    }
                                },
                                "index.js": 1
                            }
                        },
                        "ok.js": 1
                    }
                }
            });
            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {"q-io/fs": mockFS},
            });

            return filamentBackend.listPackage("/root/a").then(function (fileDescriptors) {
                expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                    "fs://localhost/root/a/", "fs://localhost/root/a/ok.js"
                ]);
            });
        });

        it("skips dotfiles", function() {
            var mockFS, filamentBackend;
            mockFS = QFSMock({
                "root": {
                    "a": {
                        ".git": {
                            "xxx": 1
                        },
                        ".gitignore": 1,
                        "ok.js": 1
                    }
                }
            });
            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {"q-io/fs": mockFS},
            });

            return filamentBackend.listPackage("/root/a").then(function (fileDescriptors) {
                expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                    "fs://localhost/root/a/", "fs://localhost/root/a/ok.js"
                ]);
            });
        });

        it("ignores excluded files", function() {
            var mockFS, filamentBackend;
            mockFS = QFSMock({
                "root": {
                    "a": {
                        "test": {
                            "xxx": 1,
                            "yyy": {
                                "zzz": 1
                            }
                        },
                        "package.json": JSON.stringify({
                            exclude: [ "test", "*-thing" ]
                        }),
                        "ok.js": 1,
                        "a-thing": 1,
                        "b-thing": 1
                    }
                }
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {"q-io/fs": mockFS},
            });

            return filamentBackend.listPackage("/root/a").then(function (fileDescriptors) {
                expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                    "fs://localhost/root/a/", "fs://localhost/root/a/ok.js", "fs://localhost/root/a/package.json"
                ]);
            });
        });

    });

    describe("list", function () {
        var mockFS, filamentBackend;

        beforeEach(function () {
            mockFS = QFSMock({
                "simple": {
                    "a": {
                        "b.js": 1,
                        "c": {
                            "d.js": 1
                        }
                    }
                },

                "ignore": {
                    ".git": {
                        "xxx": 1
                    },
                    ".gitignore": 1,
                    ".DS_Store": 1,
                    ".idea": 1,
                    "node_modules": {
                        "x": {
                            "node_modules": {
                                "y": {
                                    "y.js": 1
                                }
                            },
                            "index.js": 1
                        }
                    },
                    "ok.js": 1
                }
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {"q-io/fs": mockFS}
            });
        });

        it("lists the files and directories at the specified path without any deep traversal", function () {
            return filamentBackend.list("/simple/a")
                .then(function (fileDescriptors) {
                    expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                        "fs://localhost/simple/a/b.js", "fs://localhost/simple/a/c/"
                    ]);

                });
        });

        it("should ignore hidden files", function () {
            return filamentBackend.list("/ignore")
                .then(function (fileDescriptors) {
                    expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                        "fs://localhost/ignore/node_modules/", "fs://localhost/ignore/ok.js"
                    ]);

                });
        });

    });

});

