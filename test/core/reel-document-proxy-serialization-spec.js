var Template = require("montage/core/template").Template,
    mockReelDocument = require("mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

describe("core/reel-document-proxy-serialization-spec", function () {

    var reelDocumentPromise;

    beforeEach(function () {
        Template._templateCache = {
            moduleId: Object.create(null)
        };
        reelDocumentPromise = mockReelDocument("foo/bar/mock.reel", {
            "owner": {
                "properties": {
                    "element": {"#": "ownerElement"}
                },
                "_dev" : {
                    "comment" : "This comment should be deserializable."
                }
            },
            "application": {},
            "foo": {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": {"#": "foo"}
                },
                "bindings": {
                    "targetValue": {"<-": "@bar.sourceValue"}
                },
                "listeners": [
                    {
                        "type": "fooEvent",
                        "listener": {"@": "owner"}
                    }
                ]
            },
            "bar": {
                "prototype": "bar-exportId"
            }
        }, '<div data-montage-id="ownerElement"><div data-montage-id="foo"></div></div>');
    });

    describe("serialization of listeners", function () {

        it("should serialize the listeners unit as an array", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.foo;
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(Array.isArray(serialization.listeners)).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("serialization of builder comment", function () {

        it("should deserialize the builder comment", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.owner;
                expect(proxy.editorMetadata.get('comment')).toEqual("This comment should be deserializable.");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should serialize the comment in the builder serialization unit", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.owner;
                reelDocument.setOwnedObjectEditorMetadata(proxy, "comment", "Updated the comment");
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization._dev.comment).toEqual("Updated the comment");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not serialize a builder serialization unit if comment is empty", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.owner;
                reelDocument.setOwnedObjectEditorMetadata(proxy, "comment", "");
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization._dev).toBeUndefined();
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("serialization of the owner", function () {

        it("should not have a serialized prototype", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.owner;
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization.prototype).toBeUndefined();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("serialization of external objects", function () {

        it("should not have a serialized prototype", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.application;
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization.prototype).toBeUndefined();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("when user a object has a property", function () {

        beforeEach(function () {
            Template._templateCache = {
                moduleId: Object.create(null)
            };
            reelDocumentPromise = mockReelDocument("foo/bar/mock.reel", {
                "owner": {
                    "properties": {
                        "element": {"#": "ownerElement"}
                    }
                },
                "application": {
                    "properties": {
                        "delegate": {"@": "owner"}
                    }
                }

            }, '<div data-montage-id="ownerElement"></div></div>');
        });

        it("should preserve the properties of the user object", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.application;
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization.properties.delegate["@"]).toBe("owner");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not introduce a prototype to the user object", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.application;
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization.prototype).toBeUndefined();
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

});
