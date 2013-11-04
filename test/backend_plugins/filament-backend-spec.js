/*global describe,beforeEach,it,expect */

var SandboxedModule = require('sandboxed-module');
var QFSMock = require("q-io/fs-mock");

describe("filament backend", function () {

    describe("createApplication", function () {
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
                requires: {
                    "q-io/fs": mockFS,
                    "adaptor/server/backend": {}
                },
                globals: {clientPath: "/root"}
            });
        });

        it("creates an app with a space in its name", function (done) {
            var timestamp = Date.now();
            filamentBackend.createApplication("my app" + timestamp, "/tmp/")
            .then(function (minitResults) {
                expect(minitResults.name).toEqual("my-app" + timestamp);
            })
            .then(done, done);
        }, 5000);

        // Disabled due to timeout issue
        xit("creates an app with a non-ascii characters in its name", function (done) {
            var timestamp = Date.now();
            return filamentBackend.createApplication("râțéăü" + timestamp, "/tmp/")
            .then(function (minitResults) {
                expect(minitResults.name).toEqual("rateau" + timestamp);
            })
            .then(done, done);
        }, 5000);
    });

    describe("createComponent", function () {
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
                requires: {
                    "q-io/fs": mockFS,
                    "adaptor/server/backend": {}
                },
                globals: {clientPath: "/root"}
            });
        });

        it("resolves as the path to the created component", function () {
            var timestamp = Date.now();
            return filamentBackend.createComponent("foo" + timestamp, "/tmp", "bar")
                .then(function (path) {
                    expect(path).toEqual("/tmp/bar/foo" + timestamp + ".reel");
                });
        });

        it("creates an component with a space in its name", function () {
            var timestamp = Date.now();
            return filamentBackend.createComponent("my component" + timestamp, "/tmp/", "")
            .then(function (path) {
                var pieces = path.split("/");
                expect(pieces[pieces.length -1]).toEqual("my-component" + timestamp + ".reel");
            });
        });

        it("creates an component with a non-ascii characters in its name", function () {
            var timestamp = Date.now();
            return filamentBackend.createComponent("føø" + timestamp, "/tmp/", "")
            .then(function (path) {
                var pieces = path.split("/");
                expect(pieces[pieces.length -1]).toEqual("foo" + timestamp + ".reel");
            });
        });
    });

    describe("createModule", function () {
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
                requires: {
                    "q-io/fs": mockFS,
                    "adaptor/server/backend": {}
                },
                globals: {clientPath: "/root"}
            });
        });

        it("creates an module with a space in its name", function () {
            var timestamp = Date.now();
            return filamentBackend.createModule("my module" + timestamp, "/tmp/", "")
            .then(function (path) {
                var pieces = path.split("/");
                expect(pieces[pieces.length -1]).toEqual("my-module" + timestamp);
            });
        });

        it("creates an module with a non-ascii characters in its name", function () {
            var timestamp = Date.now();
            return filamentBackend.createModule("bär" + timestamp, "/tmp/", "")
            .then(function (path) {
                var pieces = path.split("/");
                expect(pieces[pieces.length -1]).toEqual("bar" + timestamp);
            });
        });
    });

});

