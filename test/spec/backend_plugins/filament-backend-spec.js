/*global describe,beforeEach,it,expect */

var SandboxedModule = require('sandboxed-module');
var QFSMock = require("q-io/fs-mock");
var Promise = require("montage/core/promise").Promise;

describe("filament backend", function () {

    describe("createApplication", function () {
        var mockFS, filamentBackend, serverMock;

        beforeEach(function () {
            mockFS = QFSMock({
                "root": {
                    "npm-cache": {
                        "seed": 1
                    }
                },
                "user": {}
            });

            serverMock = {
                application: Promise.resolve({
                    specialFolderURL: function () {
                        return Promise.resolve({url: "/user"});
                    }
                })
            };

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {
                    "adaptor/server/backend": {}
                },
                globals: {clientPath: "/root"}
            })(mockFS);

        });

        it("seeds the npm cache if it doesn't exist", function () {
            return filamentBackend.setup(true, serverMock)
            .then(function () {
                return mockFS.listTree("/user");
            }).then(function (list) {
                expect(list).toEqual(["/user", "/user/npm-cache", "/user/npm-cache/seed"]);
            });
        });

        it("does not seed the npm cache if it does not exist", function () {
            return mockFS.makeDirectory("/user/npm-cache")
            .then(function () {
                filamentBackend.setup(true, serverMock);
            }).then(function () {
                return mockFS.listTree("/user");
            }).then(function (list) {
                expect(list).toEqual(["/user", "/user/npm-cache"]);
            });
        });
    });

    describe("createApplication", function () {
        var mockFS, filamentBackend, minitCreateSpy;

        beforeEach(function () {
            mockFS = QFSMock();

            minitCreateSpy = jasmine.createSpy("minitCreate").andCallFake(function () { return Promise.resolve(); });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {
                    "minit/lib/create": {
                        create: minitCreateSpy
                    },
                    "adaptor/server/backend": {}
                },
                globals: {clientPath: "/root"}
            })(mockFS);

            filamentBackend.setup(false, {
                application: Promise.resolve({
                    specialFolderURL: function () {
                        return Promise.resolve({url: "fs://localhost/Application%20Support"});
                    }
                })
            }).done();
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
                return Promise.resolve({resultPath: "resultPath"});
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {
                    "minit/lib/create": {
                        create: minitCreateSpy
                    },
                    "adaptor/server/backend": {}
                },
                globals: {clientPath: "/root"}
            })(mockFS);
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
                return Promise.resolve({name: "returnedName"});
            });

            filamentBackend = SandboxedModule.require("../../backend_plugins/filament-backend", {
                requires: {
                    "minit/lib/create": {
                        create: minitCreateSpy
                    },
                    "adaptor/server/backend": {}
                },
                globals: {clientPath: "/root"}
            })(mockFS);
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

});

