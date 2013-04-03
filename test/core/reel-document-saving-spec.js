var Montage = require("montage").Montage,
    Template = require("montage/core/template").Template,
    mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

describe("core/reel-document-saving-spec", function () {

    var reelDocument;

    describe("preparing the serialization", function () {

        it("should have all the expected labels", function () {
            return mockReelDocument("foo/bar/mock.reel", {"owner": {}, "foo": {}})
                .then(function (reelDocument) {
                    var serialization = JSON.parse(reelDocument.serialization);
                    expect(serialization.owner).toBeTruthy();
                    expect(serialization.foo).toBeTruthy();
                }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must have the owner label before any other labels", function () {
            return mockReelDocument("foo/bar/mock.reel", {"owner": {}, "alpha": {}})
                .then(function (reelDocument) {
                    var serialization = reelDocument.serialization,
                        ownerLabelIndex = serialization.indexOf('"owner":'),
                        alphaLabelIndex = serialization.indexOf('"alpha":');

                    expect(ownerLabelIndex < alphaLabelIndex).toBeTruthy();
                }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must have the owner label before any other labels", function () {
            return mockReelDocument("foo/bar/mock.reel", {"owner": {}, "alpha": {}})
                .then(function (reelDocument) {
                    var serialization = reelDocument.serialization,
                        ownerLabelIndex = serialization.indexOf('"owner":'),
                        alphaLabelIndex = serialization.indexOf('"alpha":');

                    expect(ownerLabelIndex < alphaLabelIndex).toBeTruthy();
                }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should have labels in alphabetical order", function () {
            return mockReelDocument("foo/bar/mock.reel", {"beta": {}, "owner": {}, "alpha": {}})
                .then(function (reelDocument) {
                    var serialization = reelDocument.serialization,
                        ownerLabelIndex = serialization.indexOf('"owner":'),
                        alphaLabelIndex = serialization.indexOf('"alpha":'),
                        betaLabelIndex = serialization.indexOf('"beta":');

                    expect(ownerLabelIndex < alphaLabelIndex < betaLabelIndex).toBeTruthy();
                }).timeout(WAITSFOR_TIMEOUT);
        });

    });

});
