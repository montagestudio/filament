/*global describe,beforeEach,it,expect,waits,waitsFor,runs,afterEach */

var PATH = require("path");

var SandboxedModule = require('sandboxed-module');
var QFSMock = require("q-io/fs-mock");

describe("filament backend", function () {

    describe("getExtensions", function () {
        var mockFS, filamentBackend;

        beforeEach(function () {
            mockFS = {
                existsSync: function (path) {
                    expect(path).toEqual("/root/extensions");
                    return true;
                },
                readdirSync: function (path) {
                    return ["a.filament-extension", "b.filament-extension", "c.js", "filament-extension"];
                }
            };

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {"fs": mockFS},
                globals: {clientPath: "/root"}
            });
        });

        it("lists files with .filament-extension in extensions directory", function () {
            var extensions = filamentBackend.getExtensions();
            expect(extensions.length).toBe(2);
            expect(extensions[0]).toBe("http://client/extensions/a.filament-extension");
            expect(extensions[1]).toBe("http://client/extensions/b.filament-extension");
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
                    "fs://localhost/simple/a", "fs://localhost/simple/a/b.js", "fs://localhost/simple/a/c", "fs://localhost/simple/a/c/d.js"
                ]);

            });
        });

        it("ignores some names, and doesn't traverse into the directories", function () {
            return filamentBackend.listTree("/ignore")
            .then(function (fileDescriptors) {
                expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                    "fs://localhost/ignore", "fs://localhost/ignore/ok.js"
                ]);
            });
        });

        xit("will list a path containing node_modules", function () {
            return filamentBackend.listTree("/ignore/node_modules/x")
            .then(function (fileDescriptors) {
                return filamentBackend.listPackage("/root/a").then(function (fileDescriptors) {
                    expect(fileDescriptors.map(function (desc) { return desc.url; })).toEqual([
                        "fs://localhost/ignore/node_modules/x", "fs://localhost/ignore/node_modules/x/index.js"
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
                    "fs://localhost/root/a", "fs://localhost/root/a/ok.js"
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
                    "fs://localhost/root/a", "fs://localhost/root/a/ok.js"
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
                    "fs://localhost/root/a", "fs://localhost/root/a/ok.js", "fs://localhost/root/a/package.json"
                ]);
            });
        });

    });

});

