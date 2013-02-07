/*global describe,beforeEach,it,expect,waits,waitsFor,runs,afterEach */

var PATH = require("path");

var SandboxedModule = require('sandboxed-module');
var QFSMock = require("q-io/fs-mock");

describe("filament backend", function () {

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
                globals: {clientPath: "a"}
            });
        });

        it("lists a tree", function () {
            return filamentBackend.listTree("/simple/a")
            .then(function (fileDescriptors) {
                expect(fileDescriptors.length).toEqual(4);
                expect(fileDescriptors[0].url).toBe("fs://simple/a");
                expect(fileDescriptors[1].url).toBe("fs://simple/a/b.js");
                expect(fileDescriptors[2].url).toBe("fs://simple/a/c");
                expect(fileDescriptors[3].url).toBe("fs://simple/a/c/d.js");
            });
        });

        it("ignores some names, and doesn't traverse into the directories", function () {
            return filamentBackend.listTree("/ignore")
            .then(function (fileDescriptors) {
                expect(fileDescriptors.length).toEqual(2);
                expect(fileDescriptors[0].url).toBe("fs://ignore");
                expect(fileDescriptors[1].url).toBe("fs://ignore/ok.js");
            });
        });

        it("will list a path containing node_modules", function () {
            return filamentBackend.listTree("/ignore/node_modules/x")
            .then(function (fileDescriptors) {
                expect(fileDescriptors.length).toEqual(2);
                expect(fileDescriptors[0].url).toBe("fs://ignore/node_modules/x");
                expect(fileDescriptors[1].url).toBe("fs://ignore/node_modules/x/index.js");
            });
        });
    });

});

