var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    ReelReviver = require("core/serialization/reel-reviver").ReelReviver,
    ReelContext = require("core/serialization/reel-context").ReelContext,
    mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

var getContextFor = function (ownerExportId, serialization, markup) {
    return mockReelDocument(ownerExportId, serialization, markup)
        .then(function (reelDocument) {
            var reviver = ReelReviver.create();
            var context = ReelContext.create().init(serialization, reviver);
            context.editingDocument = reelDocument;
            return context;
        });
};

describe("core/reel-context-spec", function () {

    describe("proxies created from a serialization", function () {

        it("should have the expected label", function () {
            var serialization = {
                "owner": {
                    "properties": {
                        "element": {"#": "ownerElement"}
                    }
                }
            };

            var markup = '<div data-montage-id="ownerElement"></div>';

            return getContextFor("foo/bar/mock.reel", serialization, markup).then(function (context) {
                var proxy = context.getObjects()[0];
                expect(proxy.label).toBe("owner");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        describe("exportId", function () {

            it("TODO should have the expected exportId when representing the owner", function () {

                // TODO we need to actually look into the JS file to more accurately determine what is exported
                // and which exportName the owner is using.

                // The owner should probably know its prototype within lumieres, but we shouldn't write it out
                // into the serialization unless explicitly instructed.

                var serialization = {
                    "owner": {
                        "properties": {
                            "element": {"#": "ownerElement"}
                        }
                    }
                };

                var markup = '<div data-montage-id="ownerElement"></div>';

                return getContextFor("foo/bar/mock.reel", serialization, markup).then(function (context) {
                    var proxy = context.getObjects()[0];
                    expect(proxy.exportId).toBe("foo/bar/mock.reel");
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should have the expected exportId when a prototype is provided", function () {
                var serialization = {
                    "foo": {
                        "prototype": "ui/foo.reel",
                        "properties": {
                            "element": {"#": "fooElement"}
                        }
                    }
                };

                var markup = '<div data-montage-id="fooElement"></div>';

                return getContextFor("foo/bar/mock.reel", serialization, markup).then(function (context) {
                    var proxy = context.getObjects()[0];
                    expect(proxy.exportId).toBe("ui/foo.reel");
                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should have the expected exportId when an object is provided", function () {
                var serialization = {
                    "foo": {
                        "object": "core/foo",
                        "properties": {
                            "element": {"#": "fooElement"}
                        }
                    }
                };

                var markup = '<div data-montage-id="fooElement"></div>';

                return getContextFor("foo/bar/mock.reel", serialization, markup).then(function (context) {
                    var proxy = context.getObjects()[0];
                    expect(proxy.exportId).toBe("core/foo");
                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

    });

});
