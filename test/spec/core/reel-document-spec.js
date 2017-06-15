var Promise = require("montage/core/promise").Promise,
    ReelDocument = require("filament/core/reel-document").ReelDocument,
    documentDataSourceMock = require("mocks/document-data-source-mocks").documentDataSourceMock;

describe("core/reel-document-spec", function () {

    var reelDocument,
        dataSource = documentDataSourceMock({
            read: function (url) {
                return require.async(url.slice(require.location.length))
                .then(function(exports) {
                    return exports.content;
                });
            },
            write: function (url) {
                return Promise.resolve();
            }
        });

    describe("loading a data model given a locationId", function () {

        beforeEach(function (done) {
            new ReelDocument()
                .init(require.location + "mocks/ui/simple.reel/", dataSource, require)
                .load()
                .then(function (doc) {
                    reelDocument = doc;
                })
                .then(done);
        });

        it("should resolve as a populated document", function () {
            expect(reelDocument).toBeTruthy();
            expect(reelDocument.editingProxies).toBeTruthy();
            expect(reelDocument.editingProxies.length).toBe(1);
        });

    });

    describe("loading a template with image references", function () {
        beforeEach(function (done) {
            new ReelDocument()
                .init(require.location + "mocks/ui/images.reel/", dataSource, require)
                .load()
                .then(function (doc) {
                    reelDocument = doc;
                })
                .then(done);
        });

        it("should resolve as a populated document", function () {
            expect(reelDocument).toBeTruthy();
            expect(reelDocument.editingProxies).toBeTruthy();
            expect(reelDocument.editingProxies.length).toBe(1);
        });

        it("should not add a src attribute to images that did not have one", function () {
            var image = reelDocument.htmlDocument.getElementById("noSrc");
            expect(image.hasAttribute("src")).toBeFalsy();
        });

        it("should not populate a src attribute on images that has an empt src attribute", function () {
            var image = reelDocument.htmlDocument.getElementById("emptySrc");
            expect(image.hasAttribute("src")).toBeTruthy();
            expect(image.getAttribute("src")).toBe("");
        });

        it("should not rebase a relative url in a src attribute on images", function () {
            var image = reelDocument.htmlDocument.getElementById("relativeSrc");
            expect(image.hasAttribute("src")).toBeTruthy();
            expect(image.getAttribute("src")).toBe("foo.png");
        });

        it("should not alter a src attribute on images with an absolute url", function () {
            var image = reelDocument.htmlDocument.getElementById("absoluteSrc");
            expect(image.hasAttribute("src")).toBeTruthy();
            expect(image.getAttribute("src")).toBe("http://example.com/bar.png");
        });
    });

    describe("once initialized", function () {

        var mockDocument, serialization, dataSource;

        beforeEach(function (done) {
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

            new ReelDocument()
                .init(require.location + "mocks/ui/simple.reel/", dataSource, require)
                .load()
                .then(function (doc) {
                    reelDocument = doc;
                })
                .then(done);
        });

        it("should have a proxy object for each serialization label", function () {
            expect(reelDocument.editingProxyMap.owner.label).toBe("owner");
            expect(reelDocument.editingProxyMap.foo.label).toBe("foo");
        });

        it("should have a title that is the last path component and extension of the fileUrl", function () {
            expect(reelDocument.title).toBe("simple.reel");
        });

    });

    describe("external data changes", function() {
        it("should consider the document not modified once the data source has been changed", function() {
            reelDocument._changeCount = 1;
            reelDocument.handleDataChange();
            expect(reelDocument._changeCount).toBe(0);
        });
    });
});
