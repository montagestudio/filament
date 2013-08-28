var Montage = require("montage").Montage,
    Template = require("montage/core/template").Template,
    Promise = require("montage/core/promise").Promise,
    mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument,
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
                "lumieres" : {
                    "comment" : "This comment should be deserializable."
                }
            },
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

    describe("serialization of lumieres comment", function () {

        it("should deserialize the lumieres comment", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.owner;
                expect(proxy._comment).toEqual("This comment should be deserializable.");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should serialize the comment in the lumieres property", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.owner;
                proxy._comment = "Updated the comment";
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization.lumieres.comment).toEqual("Updated the comment");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not serialize lumieres property if comment is empty", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.owner;
                proxy._comment = "";
                var serialization = reelDocument.serializationForProxy(proxy);
                expect(serialization.lumieres).toBeUndefined();
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

});
