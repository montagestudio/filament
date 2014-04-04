var Promise = require("montage/core/promise").Promise,
    ReelDocument = require("core/reel-document").ReelDocument,
    Template = require("montage/core/template").Template,
    WAITSFOR_TIMEOUT = 2500;

describe("core/reel-document-spec", function () {

    var reelDocumentPromise,
        dataReader = function(url) {
            return require.async(url.slice(require.location.length))
            .then(function(exports) {
                return exports.content;
            });
        };

    describe("loading a data model given a locationId", function () {

        beforeEach(function () {
            reelDocumentPromise = ReelDocument.load(require.location + "test/mocks/ui/simple.reel", require.location, require, dataReader);
        });

        it("should return a promise for the populated document", function () {
            expect(Promise.isPromiseAlike(reelDocumentPromise)).toBeTruthy();
            reelDocumentPromise.timeout(WAITSFOR_TIMEOUT).done();
        });

        it("should resolve as a populated document", function () {
            return reelDocumentPromise.then(function (doc) {
                expect(doc).toBeTruthy();
                expect(doc.editingProxies).toBeTruthy();
                expect(doc.editingProxies.length).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("loading a template with image references", function () {
        beforeEach(function () {
            reelDocumentPromise = ReelDocument.load(require.location + "test/mocks/ui/images.reel", require.location, require, dataReader);
        });

        it("should return a promise for the populated document", function () {
            expect(Promise.isPromiseAlike(reelDocumentPromise)).toBeTruthy();
            reelDocumentPromise.timeout(WAITSFOR_TIMEOUT).done();
        });

        it("should resolve as a populated document", function () {
            return reelDocumentPromise.then(function (doc) {
                expect(doc).toBeTruthy();
                expect(doc.editingProxies).toBeTruthy();
                expect(doc.editingProxies.length).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not add a src attribute to images that did not have one", function () {
            return reelDocumentPromise.then(function (doc) {
                var image = doc.htmlDocument.getElementById("noSrc");
                expect(image.hasAttribute("src")).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not populate a src attribute on images that has an empt src attribute", function () {
            return reelDocumentPromise.then(function (doc) {
                var image = doc.htmlDocument.getElementById("emptySrc");
                expect(image.hasAttribute("src")).toBeTruthy();
                expect(image.getAttribute("src")).toBe("");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not rebase a relative url in a src attribute on images", function () {
            return reelDocumentPromise.then(function (doc) {
                var image = doc.htmlDocument.getElementById("relativeSrc");
                expect(image.hasAttribute("src")).toBeTruthy();
                expect(image.getAttribute("src")).toBe("foo.png");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not alter a src attribute on images with an absolute url", function () {
            return reelDocumentPromise.then(function (doc) {
                var image = doc.htmlDocument.getElementById("absoluteSrc");
                expect(image.hasAttribute("src")).toBeTruthy();
                expect(image.getAttribute("src")).toBe("http://example.com/bar.png");
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("once initialized", function () {

        var mockDocument, serialization;

        beforeEach(function () {
            mockDocument = document.implementation.createHTMLDocument();

            serialization = '{"owner": {"properties": {}}, "foo": {"prototype": "foo-module"}}';

            var serializationNode = mockDocument.createElement("script");
            serializationNode.setAttribute("type", "text/montage-serialization");
            serializationNode.innerHTML = serialization;
            mockDocument.getElementsByTagName("head")[0].appendChild(serializationNode);

            reelDocumentPromise = Template.initWithDocument(mockDocument).then(function (template) {
                return ReelDocument.create().init("test/mocks/ui/simple.reel", template, void 0, "test/mocks/ui/simple.reel");
            });
        });

        it("should have a proxy object for each serialization label", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                expect(reelDocument.editingProxyMap.owner.label).toBe("owner");
                expect(reelDocument.editingProxyMap.foo.label).toBe("foo");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should have a title that is the last path component and extension of the fileUrl", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                expect(reelDocument.title).toBe("simple.reel");
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

});
