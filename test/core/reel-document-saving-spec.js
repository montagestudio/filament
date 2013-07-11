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
                    var serialization = reelDocument._buildSerializationObjects();
                    expect(serialization.owner).toBeTruthy();
                    expect(serialization.foo).toBeTruthy();
                }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must have the owner label before any other labels", function () {
            return mockReelDocument("foo/bar/mock.reel", {"owner": {"properties": {}}, "alpha": {"prototype": "alpha.reel"}})
                .then(function (reelDocument) {
                    var serializationString = JSON.stringify(reelDocument._buildSerializationObjects()),
                        ownerLabelIndex = serializationString.indexOf('"owner":'),
                        alphaLabelIndex = serializationString.indexOf('"alpha":');

                    expect(ownerLabelIndex).toBeLessThan(alphaLabelIndex);
                }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should have labels in alphabetical order", function () {
            return mockReelDocument("foo/bar/mock.reel", {"beta": {"prototype": "beta.reel"}, "owner": {"properties": {}}, "alpha": {"prototype": "alpha.reel"}})
                .then(function (reelDocument) {
                    var serializationString = JSON.stringify(reelDocument._buildSerializationObjects()),
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
                        "value": {"<-": "@owner.aProperty"},
                        "anotherValue": {"<->": "@owner.anotherProperty"}
                    }
                }
            });
        });

        it("should serialize a one-way binding correctly", function () {
            return promisedDocument.then(function (reelDocument) {
                var serialization = reelDocument._buildSerializationObjects();
                expect(serialization.foo.bindings).toBeTruthy();
                expect(serialization.foo.bindings.value).toBeTruthy();
                expect(serialization.foo.bindings.value["<-"]).toBe("@owner.aProperty");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should serialize a two-way binding correctly", function () {
            return promisedDocument.then(function (reelDocument) {
                var serialization = reelDocument._buildSerializationObjects();
                expect(serialization.foo.bindings).toBeTruthy();
                expect(serialization.foo.bindings.anotherValue).toBeTruthy();
                expect(serialization.foo.bindings.anotherValue["<->"]).toBe("@owner.anotherProperty");
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
                var serialization = reelDocument._buildSerializationObjects();
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
                var serialization = reelDocument._buildSerializationObjects();
                expect(serialization.foo.listeners).toBeTruthy();
                expect(serialization.foo.listeners[0].type).toBe("fooEvent");
                expect(serialization.foo.listeners[0].listener["@"]).toBe("owner");
                expect(serialization.foo.listeners[0].useCapture).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("save", function () {

        var promisedDocument;

        beforeEach(function () {
            promisedDocument = mockReelDocument("foo/bar/mock.reel", {
                "owner": {
                    "properties": {}
                },
                "foo": {
                    "prototype": "fooExportId",
                    "bindings": {
                        "value": {"<-": "@owner.aProperty"},
                        "anotherValue": {"<->": "@owner.anotherProperty"}
                    }
                }
            });
        });

        it("only saves to reel directories", function () {
            var spec = this;
            return promisedDocument.then(function (reelDocument) {
                return reelDocument.save("foo/bar/mock/", function () {});
            })
            .then(function () {
                spec.fail("Expected error about not saving to reel dir");
            }, function (error) {
                expect(error.message).toEqual('Components can only be saved into directories with a ".reel" extension');
            });
        });

        it("calls dataWriter", function () {
            var dataWriter = jasmine.createSpy('dataWriter');
            return promisedDocument.then(function (reelDocument) {
                return reelDocument.save("foo/bar/mock.reel/", dataWriter);
            })
            .then(function () {
                expect(dataWriter).toHaveBeenCalled();
            });
        });

        it("calls callback for each type of file", function () {
            var dataWriter = function (){};
            var savePassFile = jasmine.createSpy('savePassFile');

            return promisedDocument.then(function (reelDocument) {
                reelDocument.registerFile("pass", savePassFile);

                return reelDocument.save("foo/bar/mock.reel/", dataWriter);
            })
            .then(function () {
                expect(savePassFile).toHaveBeenCalled();
            });
        });

        it("calls dataWriter with the file location", function () {
            var dataWriter = function () {};
            var savePassFile = jasmine.createSpy('savePassFile');
            return promisedDocument.then(function (reelDocument) {
                reelDocument.registerFile("pass", savePassFile);

                return reelDocument.save("foo/bar/mock.reel/", dataWriter);
            })
            .then(function () {
                // toHaveBeenCalledWith is buggy
                expect(savePassFile.mostRecentCall.args).toEqual(['foo/bar/mock.reel/mock.pass', dataWriter]);
            });
        });

        it("calls dataWriter with the correct file location if original location doesn't have trailing slash", function () {
            var dataWriter = function () {};
            var savePassFile = jasmine.createSpy('savePassFile');
            return promisedDocument.then(function (reelDocument) {
                reelDocument.registerFile("pass", savePassFile);

                return reelDocument.save("foo/bar/mock.reel", dataWriter);
            })
            .then(function () {
                // toHaveBeenCalledWith is buggy
                expect(savePassFile.mostRecentCall.args).toEqual(['foo/bar/mock.reel/mock.pass', dataWriter]);
            });
        });
    });

});
