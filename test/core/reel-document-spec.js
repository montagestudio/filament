var Promise = require("montage/core/promise").Promise,
    ReelDocument = require("core/reel-document").ReelDocument,
    documentDataSourceMock = require("test/mocks/document-data-source-mocks").documentDataSourceMock,
    WAITSFOR_TIMEOUT = 2500;

describe("core/reel-document-spec", function () {

    var reelDocumentPromise,
        dataSource = documentDataSourceMock({
            read: function(url) {
                return require.async(url.slice(require.location.length))
                .then(function(exports) {
                    return exports.content;
                });
            },
            write: function(url) {
                return Promise.resolve();
            }
        });

    describe("loading a data model given a locationId", function () {

        beforeEach(function () {
            reelDocumentPromise = new ReelDocument().init(require.location + "test/mocks/ui/simple.reel/", dataSource, require).load();
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
            reelDocumentPromise = new ReelDocument().init(require.location + "test/mocks/ui/images.reel", dataSource, require).load();
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

        var mockDocument, serialization, dataSource;

        beforeEach(function () {
            mockDocument = document.implementation.createHTMLDocument();

            serialization = '{"owner": {"properties": {}}, "foo": {"prototype": "foo-module"}}';

            var serializationNode = mockDocument.createElement("script");
            serializationNode.setAttribute("type", "text/montage-serialization");
            serializationNode.innerHTML = serialization;
            mockDocument.getElementsByTagName("head")[0].appendChild(serializationNode);

            dataSource = documentDataSourceMock({
                read: function(url) {
                    return Promise.resolve(mockDocument.documentElement.outerHTML);
                }
            });

            reelDocumentPromise = new ReelDocument().init(require.location + "test/mocks/ui/simple.reel/", dataSource, require).load();
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

    describe("external data changes", function() {
        it("should consider the document not modified once the data source has been changed", function() {
            return reelDocumentPromise.then(function (doc) {
                doc._changeCount = 1;
                doc.handleDataChange();
                expect(doc._changeCount).toBe(0);
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });
});
