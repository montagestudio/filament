var Promise = require("montage/core/promise").Promise,
    documentDataSourceMock = require("mocks/document-data-source-mocks").documentDataSourceMock;

describe("extensions/code-editor.filament-extension/core/code-editor-document-spec", function () {

    var doc,
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
        }),
        extensionPackageUrl = "../extensions/code-editor.filament-extension",
        CodeEditorDocumentPromise = require.loadPackage(extensionPackageUrl)
            .then(function (packageRequire) {
                return packageRequire.async("core/code-editor-document")
                .then(function (exports) {
                    return exports.CodeEditorDocument;
                });
            });

    beforeEach(function(done) {
        CodeEditorDocumentPromise
            .then(function (CodeEditorDocument) {
                return new CodeEditorDocument().init(require.location + "mocks/ui/simple.reel/simple.js", dataSource, require).load();
            }).then(function (loadedDoc) {
                doc = loadedDoc;
            }).then(done);
    });

    describe("external data changes", function () {
        it("should consider the document not modified once the data source has been changed", function () {
            doc._changeCount = 1;
            doc.handleDataChange();
            expect(doc._changeCount).toBe(0);
        });
    });

    describe("saving", function() {
        it("should call write when there are modifications", function (done) {
            var spy = spyOn(doc._dataSource, "write").and.callThrough();

            doc.isDirty = true;

            doc.save(doc.url).then(function () {
                expect(spy).toHaveBeenCalled();
            }).then(done);
        });

        it("should not call write if there are no modifications", function (done) {
            var spy = spyOn(doc._dataSource, "write");

            return doc.save(doc.url).then(function () {
                expect(spy).not.toHaveBeenCalled();
            }).then(done);
        });

        it("should stop reporting modifications on the data source on save", function (done) {
            doc.isDirty = true;
            doc._hasModifiedData = {
                undoCount: -1,
                redoCount: -1
            };

            expect(doc.hasModifiedData(doc.url)).toBe(true);
            return doc.save(doc.url).then(function () {
                expect(doc.hasModifiedData(doc.url)).toBe(false);
            }).then(done);
        });
    });
});
