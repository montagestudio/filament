var Promise = require("montage/core/promise").Promise,
    documentDataSourceMock = require("test/mocks/document-data-source-mocks").documentDataSourceMock,
    WAITSFOR_TIMEOUT = 2500;

describe("extensions/code-editor.filament-extension/core/code-editor-document-spec", function () {

    var promisedDocument,
        beforeEachPromise,
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
        }),
        extensionPackageUrl = require.location + "extensions/code-editor.filament-extension",
        CodeEditorDocumentPromise = require.loadPackage(extensionPackageUrl)
        .then(function(packageRequire) {
            return packageRequire.async("core/code-editor-document")
            .then(function(exports) {
                return exports.CodeEditorDocument;
            });
        });

    beforeEach(function() {
        beforeEachPromise = CodeEditorDocumentPromise
        .then(function(CodeEditorDocument) {
            promisedDocument = new CodeEditorDocument().init(require.location + "test/mocks/ui/simple.reel/", dataSource, require).load();
        });
    });

    describe("external data changes", function() {
        it("should consider the document not modified once the data source has been changed", function() {
            return beforeEachPromise.then(function() {
                return promisedDocument.then(function (doc) {
                    doc._changeCount = 1;
                    doc.handleDataChange();
                    expect(doc._changeCount).toBe(0);
                }).timeout(WAITSFOR_TIMEOUT);
            });
        });
    });

    describe("saving", function() {
        it("should call write when there are modifications", function() {
            return beforeEachPromise.then(function() {
                return promisedDocument.then(function (doc) {
                    var spy = spyOn(doc._dataSource, "write").andCallThrough();

                    doc._hasModifiedData = {
                        undoCount: -1,
                        redoCount: -1
                    };

                    return doc.save(doc.url).then(function () {
                        expect(spy).toHaveBeenCalled();
                    });
                }).timeout(WAITSFOR_TIMEOUT);
            });
        });

        it("should not call write if there are no modifications", function() {
            return beforeEachPromise.then(function() {
                return promisedDocument.then(function (doc) {
                    var spy = spyOn(doc._dataSource, "write");

                    return doc.save(doc.url).then(function () {
                        expect(spy).not.toHaveBeenCalled();
                    });
                }).timeout(WAITSFOR_TIMEOUT);
            });
        });

        it("should stop reporting modifications on the data source on save", function() {
            return beforeEachPromise.then(function() {
                return promisedDocument.then(function (doc) {
                    doc._hasModifiedData = {
                        undoCount: -1,
                        redoCount: -1
                    };

                    expect(doc.hasModifiedData(doc.url)).toBe(true);
                    return doc.save(doc.url).then(function () {
                        expect(doc.hasModifiedData(doc.url)).toBe(false);
                    });
                }).timeout(WAITSFOR_TIMEOUT);
            });
        });
    });
});
