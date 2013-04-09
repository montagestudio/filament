var Montage = require("montage").Montage,
    Template = require("montage/core/template").Template,
    mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

describe("core/reel-document-saving-spec", function () {

    var reelDocument;

    describe("labels", function () {

        it("should have all the expected labels", function () {
            return mockReelDocument("foo/bar/mock.reel", {"owner": {"properties": {}}, "foo": {"prototype": "foo.reel"}})
                .then(function (reelDocument) {
                    var serialization = reelDocument._buildSerialization();
                    expect(serialization.owner).toBeTruthy();
                    expect(serialization.foo).toBeTruthy();
                }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must have the owner label before any other labels", function () {
            return mockReelDocument("foo/bar/mock.reel", {"owner": {"properties": {}}, "alpha": {"prototype": "alpha.reel"}})
                .then(function (reelDocument) {
                    var serializationString = JSON.stringify(reelDocument._buildSerialization()),
                        ownerLabelIndex = serializationString.indexOf('"owner":'),
                        alphaLabelIndex = serializationString.indexOf('"alpha":');

                    expect(ownerLabelIndex).toBeLessThan(alphaLabelIndex);
                }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should have labels in alphabetical order", function () {
            return mockReelDocument("foo/bar/mock.reel", {"beta": {"prototype": "beta.reel"}, "owner": {"properties": {}}, "alpha": {"prototype": "alpha.reel"}})
                .then(function (reelDocument) {
                    var serializationString = JSON.stringify(reelDocument._buildSerialization()),
                        ownerLabelIndex = serializationString.indexOf('"owner":'),
                        alphaLabelIndex = serializationString.indexOf('"alpha":'),
                        betaLabelIndex = serializationString.indexOf('"beta":');

                    expect(alphaLabelIndex).toBeGreaterThan(ownerLabelIndex);
                    expect(alphaLabelIndex).toBeLessThan(betaLabelIndex);
                }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("bindings", function () {

        var promisedDocument;

        beforeEach(function () {
            promisedDocument = mockReelDocument("foo/bar/mock.reel", {
                "owner": {
                    "properties": {}
                },
                "foo": {
                    "prototype": "fooExportId",
                    "bindings": {
                        "value": {"<-": "@owner.aProperty"}
                    }
                }
            });
        });

        it("should serialize a binding correctly", function () {
            return promisedDocument.then(function (reelDocument) {
                var serialization = reelDocument._buildSerialization();
                expect(serialization.foo.bindings).toBeTruthy();
                expect(serialization.foo.bindings.value).toBeTruthy();
                expect(serialization.foo.bindings.value["<-"]).toBe("@owner.aProperty");
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("listeners", function () {

        it("should serialize a bubble listener correctly", function () {

            var promisedDocument = mockReelDocument("foo/bar/mock.reel", {
                "owner": {
                    "properties": {}
                },
                "foo": {
                    "prototype": "fooExportId",
                    "listeners": [
                        {
                            "type": "fooEvent",
                            "listener": {"@": "owner"}
                        }
                    ]
                }
            });

            return promisedDocument.then(function (reelDocument) {
                var serialization = reelDocument._buildSerialization();
                expect(serialization.foo.listeners).toBeTruthy();
                expect(serialization.foo.listeners[0].type).toBe("fooEvent");
                expect(serialization.foo.listeners[0].listener["@"]).toBe("owner");
                expect(serialization.foo.listeners[0].useCapture).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should serialize a capture listener correctly", function () {

            var promisedDocument = mockReelDocument("foo/bar/mock.reel", {
                "owner": {
                    "properties": {}
                },
                "foo": {
                    "prototype": "fooExportId",
                    "listeners": [
                        {
                            "type": "fooEvent",
                            "listener": {"@": "owner"},
                            "useCapture": true
                        }
                    ]
                }
            });

            return promisedDocument.then(function (reelDocument) {
                var serialization = reelDocument._buildSerialization();
                expect(serialization.foo.listeners).toBeTruthy();
                expect(serialization.foo.listeners[0].type).toBe("fooEvent");
                expect(serialization.foo.listeners[0].listener["@"]).toBe("owner");
                expect(serialization.foo.listeners[0].useCapture).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

});
