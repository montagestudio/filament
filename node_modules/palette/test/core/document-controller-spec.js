var Montage = require("montage").Montage,
    DocumentController = require("core/document-controller").DocumentController,
    Promise = require("montage/core/promise").Promise;

describe("core/document-controller-spec", function () {

    var documentController;

    beforeEach(function () {
        documentController = DocumentController.create();
    });

    describe("initialization", function () {

        it("should have no currentDocument", function () {
            expect(documentController.currentDocument).toBeNull();
        });

        it("should have an empty document collection", function () {
            expect(documentController.documents.length).toBe(0);
        });

    });

    describe("opening a url", function () {

        it("should return a promise for a document", function () {
            var promisedDocument = documentController.openUrl("fileA");
            expect(Promise.isPromiseAlike(promisedDocument)).toBeTruthy();
            promisedDocument.done();
        });

        it("should resolve to a promised document instance", function () {
            return documentController.openUrl("fileA").then(function (document) {
                expect(document).toBeTruthy();
                expect(document.url).toBe("fileA");
            });
        });

        it("should list the expected number of open documents", function () {
            return documentController.openUrl("fileA").then(function (document) {
                expect(documentController.documents.length).toBe(1);
            });
        });

        it("should resolve to a promised document instance for documents that are already open", function () {
            return documentController.openUrl("fileA").then(function (documentA) {
                return documentController.openUrl("fileA").then(function (documentB) {
                    expect(documentA).toBe(documentB);
                    expect(documentController.documents.length).toBe(1);
                });
            });
        });

        it("should resolve to a unique promised document for each unique url", function () {
            return documentController.openUrl("fileA").then(function (documentA) {
                return documentController.openUrl("fileB").then(function (documentB) {
                    expect(documentA).not.toBe(documentB);
                    expect(documentController.documents.length).toBe(2);
                });
            });
        });

        it("should have no currentDocument while waiting for a document to open", function () {
            var openPromise = documentController.openUrl("fileA").then(function (document) {
                expect(documentController.currentDocument).toBe(document);
            });

            expect(documentController.currentDocument).toBeNull();

            return openPromise;
        });

        it("should consider the most recent document requested to be opened the currentDocument", function () {

            var deferredA = Promise.defer(),
                deferredB = Promise.defer(),
                deferredC = Promise.defer(),
                documentC;

            // Inject our own document loading to resolve documents in the order B, C,  A
            documentController.loadDocument = function (doc) {
                var url = doc.url;

                if ("fileA" === url) {
                    return deferredC.promise.then(function () {
                        return doc.load(url).then(function (doc) {
                            deferredA.resolve(doc);
                            return doc;
                        });
                    });
                } else if ("fileB" === url) {
                    return doc.load(url).then(function (doc) {
                        deferredB.resolve(doc);
                        return doc;
                    });
                } else {
                    return deferredB.promise.then(function () {
                        return doc.load(url).then(function (doc) {
                            documentC = doc;
                            deferredC.resolve(doc);
                            return doc;
                        });
                    });
                }
            };

            // Open A, then B, then C, expecting C to be the document we consider current when done
            var openA = documentController.openUrl("fileA"),
                openB = documentController.openUrl("fileB"),
                openC = documentController.openUrl("fileC");

            return Promise.all([openA, openB, openC]).then(function () {
                expect(documentController.currentDocument).toBe(documentC);
            });
        });

    });

    describe("adding documents", function () {

        var documentA;

        beforeEach(function () {
            documentA = Montage.create();
            documentA.url = "fileA";

            documentController.addDocument(documentA);
        });

        it("should list the added document in the collection of document", function () {
            expect(documentController.documents.length).toBe(1);
        });

        it ("should be able to find the document given its url", function () {
            expect(documentController.documentForUrl(documentA.url)).toBe(documentA);
        });

    });

    describe("removing documents", function () {

        var documentA,
            documentB;

        beforeEach(function () {
            documentA = Montage.create();
            documentA.url = "fileA";
            documentController.addDocument(documentA);

            documentB = Montage.create();
            documentB.url = "fileB";
            documentController.addDocument(documentB);
        });

        it("must clear the currentDocument if the currentDocument is removed", function () {
            return documentController.openUrl("fileA").then(function () {
                documentController.removeDocument(documentA);
                expect(documentController.currentDocument).toBeNull();
            });
        });

        it("must not affect the currentDocument if the document removed is not the currentDocument", function () {
            return documentController.openUrl("fileA").then(function () {
                documentController.removeDocument(documentB);
                expect(documentController.currentDocument).toBe(documentA);
            });
        });

        it("must remove the document from the collection of open documents", function () {
            documentController.removeDocument(documentA);
            expect(documentController.documents.length).toBe(1);
        });

        it("must no longer find the removed document by url", function () {
            documentController.removeDocument(documentA);
            expect(documentController.documentForUrl(documentA.url)).toBeFalsy();
        });

    });

});
