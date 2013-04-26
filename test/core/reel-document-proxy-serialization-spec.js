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

});
