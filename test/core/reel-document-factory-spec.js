var ReelDocumentFactory = require("core/reel-document-factory").ReelDocumentFactory,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    DocumentDataSource = require("core/document-data-source").DocumentDataSource,
    ReelDocument = require("core/reel-document").ReelDocument;

// Need to fake the entire file structure to run in the browser
var environmentBridge = environmentBridgeMock({
    list: function (path) {
        switch (path) {
            case "projectUrl":
                return Promise.resolve([
                    {fileUrl: "projectUrl/ui", isDirectory: true}
                ]);

            case "projectUrl/ui":
            case "projectUrl/ui/":
                return Promise.resolve([
                    {fileUrl: "projectUrl/ui/main.reel", isReel: true, isDirectory: true},
                    {fileUrl: "projectUrl/ui/second.reel", isReel: true, isDirectory: true}
                ]);
            case "projectUrl/ui/main.reel":
            case "projectUrl/ui/main.reel/":
                return Promise.resolve([
                    {fileUrl: "projectUrl/ui/main.reel/main.html"},
                    {fileUrl: "projectUrl/ui/main.reel/main.css"},
                    {fileUrl: "projectUrl/ui/main.reel/main.js"}
                ]);
            case "projectUrl/ui/second.reel":
            case "projectUrl/ui/second.reel/":
                return Promise.resolve([
                    {fileUrl: "projectUrl/ui/second.reel/second.html"},
                    {fileUrl: "projectUrl/ui/second.reel/second.css"},
                    {fileUrl: "projectUrl/ui/second.reel/second.js"}
                ]);
            default:
                return Promise.reject(new Error("Can't list " + path));
        }
    },

    componentsInPackage: function () {
        return Promise.resolve([
            "projectUrl/ui/main.reel/",
            "projectUrl/ui/second.reel/"
        ]);
    },

    read: function (path) {
        return Promise.delay(100).then(function () {
            switch (path) {
                case "projectUrl/ui/main.reel/main.html":
                    return '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n    <link rel="stylesheet" type="text/css" href="main.css">\n    <script type="text/montage-serialization">\n    {\n        "owner": {\n            "properties": {\n                "element": {"#": "owner"}\n            }\n        },\n\n        "second": {\n            "prototype": "ui/second.reel",\n            "properties": {\n                "element": {"#": "second"}\n            }\n        }\n        }\n    </script>\n</head>\n<body>\n    <div data-montage-id="owner" class="Main">\n        <div data-montage-id="second"></div>\n        </div>\n</body>\n</html>\n';
                case "projectUrl/ui/main.reel/main.css":
                    return '\n';
                case "projectUrl/ui/main.reel/main.js":
                    return 'var Component=require("montage/core/core").Component;\nexports.Main = Component.specialize({});\n';

                case "projectUrl/ui/second.reel/second.html":
                    return '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n    <link rel="stylesheet" type="text/css" href="second.css">\n    <script type="text/montage-serialization">\n    {\n        "owner": {\n            "properties": {\n                "element": {"#": "owner"}\n            }\n        }\n        }\n    </script>\n</head>\n<body>\n    <div data-montage-id="owner" class="Second"></div>\n</body>\n</html>\n';
                case "projectUrl/ui/second.reel/second.css":
                    return '\n';
                case "projectUrl/ui/second.reel/second.js":
                    return 'var Component=require("montage/core/core").Component;\nexports.Second = Component.specialize({});\n';

                default:
                    return null;
            }
        });
    }
});
var documentDataSource = new DocumentDataSource(environmentBridge);
var packageRequire = { location: "projectUrl/" };

describe("core/reel-document-factory", function () {
    var factory;

    beforeEach(function () {
        factory = new ReelDocumentFactory().init(documentDataSource, environmentBridge, packageRequire);
    });

    describe("makeReelDocument", function () {
        it("can load a valid component", function () {
            return factory.makeReelDocument("ui/main.reel")
                .then(function (doc) {
                    expect(doc.title).toBe("main.reel");
                });
        });

        it("caches documents", function () {
            return factory.makeReelDocument("ui/main.reel")
                .then(function (doc) {
                    doc.myNewProperty = "abc";
                    return factory.makeReelDocument("ui/main.reel");
                })
                .then(function (doc) {
                    expect(doc.myNewProperty).toBe("abc");
                });
        });

        it("preloads children by default", function () {
            return factory.makeReelDocument("ui/main.reel")
                .delay(100)
                .then(function (doc) {
                    return factory.makeReelDocument("ui/second.reel")
                        .timeout(0);
                })
                .then(Function.noop);
        });

        it("does not cache documents with loading errors", function () {
            var oldList = environmentBridge.list,
                oldRead = environmentBridge.read;
            return factory.makeReelDocument("ui/invalid.reel")
                .then(function (doc) {
                    throw new Error("Document should not have loaded");
                }).catch(function (err) {
                    environmentBridge.list = function (path) {
                        if (path === "ui/invalid.reel") {
                            return Promise.resolve([
                                {fileUrl: "projectUrl/ui/invalid.reel/invalid.html"},
                                {fileUrl: "projectUrl/ui/invalid.reel/invalid.css"},
                                {fileUrl: "projectUrl/ui/invalid.reel/invalid.js"}
                            ]);
                        }
                        return oldList(path);
                    }
                    environmentBridge.read = function (path) {
                        return Promise.resolve((function () {
                            switch (path) {
                                case "projectUrl/ui/invalid.reel/invalid.html":
                                    return '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n    <link rel="stylesheet" type="text/css" href="invalid.css">\n    <script type="text/montage-serialization">\n    {\n        "owner": {\n            "properties": {\n                "element": {"#": "owner"}\n            }\n        }\n        }\n    </script>\n</head>\n<body>\n    <div data-montage-id="owner" class="invalid"></div>\n</body>\n</html>\n';
                                case "projectUrl/ui/invalid.reel/invalid.css":
                                    return '\n';
                                case "projectUrl/ui/invalid.reel/invalid.js":
                                    return 'var Component=require("montage/core/core").Component;\nexports.Invalid = Component.specialize({});\n';
                                default:
                                    return oldRead(path);
                            }
                        })());
                    }
                    // Clear the document data source's cache
                    documentDataSource._data = {};
                    return factory.makeReelDocument("ui/invalid.reel");
                })
                .then(Function.noop)
                .finally(function () {
                    environmentBridge.list = oldList;
                    environmentBridge.read = oldRead;
                });
        });
    });
});
