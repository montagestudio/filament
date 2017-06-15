var mockReelDocument = require("mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

describe("core/reel-document-saving-spec", function () {

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

    describe("unknown serialization units", function () {

        var promisedDocument;

        beforeEach(function () {
            promisedDocument = mockReelDocument("foo/bar/mock.reel", {
                "owner": {
                    "properties": {}
                },
                "foo": {
                    "prototype": "fooExportId",
                    "someProperty": "someValue",
                    "moreProperties": {
                        "stringProperty": "stringValue",
                        "arrayProperty": ["a", "b", "c"]
                    }
                }
            });
        });

        it("should serialize a simple unknown string property", function () {
            return promisedDocument.then(function (reelDocument) {
                var serialization = reelDocument._buildSerializationObjects();
                expect(serialization.foo.someProperty).toBe("someValue");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should preserve more complex properties", function () {
            return promisedDocument.then(function (reelDocument) {
                var serialization = reelDocument._buildSerializationObjects();
                expect(serialization.foo.moreProperties.stringProperty).toBe("stringValue");
                expect(JSON.stringify(serialization.foo.moreProperties.arrayProperty)).toBe(JSON.stringify(["a", "b", "c"]));
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("save", function () {

        var promisedDocument;

        beforeEach(function () {
            promisedDocument = mockReelDocument("foo/bar/mock.reel/", {
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

        it("calls data source write", function () {
            var spy;
            return promisedDocument.then(function (reelDocument) {
                spy = spyOn(reelDocument._dataSource, "write").andCallThrough();
                reelDocument._hasModifiedData.undoCount = -1;
                return reelDocument.save(reelDocument.url);
            })
            .then(function () {
                expect(spy).toHaveBeenCalled();
            });
        });

        it("calls the save function for each type of file", function () {
            var savePassFile = jasmine.createSpy('savePassFile');

            return promisedDocument.then(function (reelDocument) {
                reelDocument.registerFile("pass", savePassFile);

                return reelDocument.save("foo/bar/mock.reel/");
            })
            .then(function () {
                expect(savePassFile).toHaveBeenCalled();
            });
        });

        it("calls the save function with the file location", function () {
            var dataSource;
            var savePassFile = jasmine.createSpy('savePassFile');
            return promisedDocument.then(function (reelDocument) {
                reelDocument.registerFile("pass", savePassFile);
                dataSource = reelDocument._dataSource;
                return reelDocument.save("foo/bar/mock.reel/");
            })
            .then(function () {
                // toHaveBeenCalledWith is buggy
                expect(savePassFile.mostRecentCall.args).toEqual(['foo/bar/mock.reel/mock.pass', dataSource]);
            });
        });

        it("calls the save function with the correct file location if original location doesn't have trailing slash", function () {
            var dataSource;
            var savePassFile = jasmine.createSpy('savePassFile');
            return promisedDocument.then(function (reelDocument) {
                reelDocument.registerFile("pass", savePassFile);
                dataSource = reelDocument._dataSource;
                return reelDocument.save("foo/bar/mock.reel");
            })
            .then(function () {
                // toHaveBeenCalledWith is buggy
                expect(savePassFile.mostRecentCall.args).toEqual(['foo/bar/mock.reel/mock.pass', dataSource]);
            });
        });


        it("should not call write if there are no modifications", function() {
            return promisedDocument.then(function (doc) {
                var url = doc.url + "mock.html";

                var spy = spyOn(doc._dataSource, "write");

                return doc.save(url).then(function () {
                    expect(spy).not.toHaveBeenCalled();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should stop reporting modifications on the data source on save", function() {
            return promisedDocument.then(function (doc) {
                var url = doc.url + "mock.html";

                doc._hasModifiedData = {
                    undoCount: -1,
                    redoCount: -1
                };

                expect(doc.hasModifiedData(url)).toBe(true);
                return doc.save(url).then(function() {
                    expect(doc.hasModifiedData(url)).toBe(false);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

});
