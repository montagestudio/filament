var Document = require("core/document").Document,
    Promise = require("montage/core/promise").Promise;

describe("core/document-spec", function () {

    describe("asynchronously loading a document", function () {

        it("should return a promise for the expected document", function () {
            var promisedDocument = Document.load("myUrl");
            expect(Promise.isPromiseAlike(promisedDocument)).toBeTruthy();
            promisedDocument.done();
        });

        it("should resolve as a document instance with the expected url", function () {
            return Document.load("myUrl").then(function (doc) {
                expect(doc.url).toBe("myUrl");
            });
        });

    });

    describe("a document", function () {

        var document;

        beforeEach(function () {
            document = Document.create().init("http://example.com/foo/bar/baz.jpg");
        });

        it("should choose the last component of the url as the title", function () {
            expect(document.title).toBe("baz.jpg");
        });

        it("should provide an undoManager", function () {
            expect(document.undoManager).toBeTruthy();
        });

    });

    describe("undoManager", function () {
        var document;

        beforeEach(function () {
            document = Document.create().init("http://example.com/foo/bar/baz.jpg");
            document.a = 1;
        });

        it("is created in init", function () {
            expect(document.undoManager).toBeDefined();
        });
    });

    describe("isDirty", function () {
        var document, promise;

        beforeEach(function () {
            document = Document.create().init("http://example.com/foo/bar/baz.jpg");
            document.a = 1;

            expect(document.isDirty).toBe(false);

            document.add = function (n) {
                document.a += n;
                return document.undoManager.register("Add 1", Promise.resolve([
                    document.sub,
                    document,
                    n
                ]));
            };
            document.sub = function (n) {
                document.a -= n;
                return document.undoManager.register("Subtract 1", Promise.resolve([
                    document.add,
                    document,
                    n
                ]));
            };

            promise = document.add(1);
        });

        it("is true after change", function () {
            return promise.then(function () {
                expect(document.isDirty).toBe(true);
            });
        });

        it("is false after undo", function () {
            return promise.then(function () {
                expect(document.isDirty).toBe(true);
                return document.undo();
            }).then(function () {
                expect(document.a).toBe(1);
                expect(document.isDirty).toBe(false);
            });
        });

        it("is true after redo", function () {
            return promise.then(function () {
                expect(document.isDirty).toBe(true);
                return document.undo();
            }).then(function () {
                expect(document.a).toBe(1);
                expect(document.isDirty).toBe(false);
                return document.redo();
            }).then(function () {
                expect(document.a).toBe(2);
                expect(document.isDirty).toBe(true);
            });
        });

        it("is false after save", function () {
            return promise.then(function () {
                expect(document.isDirty).toBe(true);
                return document.save("", function () {});
            }).then(function () {
                expect(document.isDirty).toBe(false);
            });
        });

        it("is true after save and undo", function () {
            return promise.then(function () {
                expect(document.isDirty).toBe(true);
                return document.save("", function () {});
            }).then(function () {
                expect(document.isDirty).toBe(false);
                return document.undo();
            }).then(function () {
                expect(document.isDirty).toBe(true);
            });
        });

        it("is true after save, undo and another operation", function () {
            return promise.then(function () {
                expect(document.isDirty).toBe(true);
                return document.save("", function () {});
            }).then(function () {
                expect(document.isDirty).toBe(false);
                return document.undo();
            }).then(function () {
                expect(document.isDirty).toBe(true);
                return document.add(2);
            }).then(function () {
                expect(document.a).toBe(3);
                expect(document.isDirty).toBe(true);
            });
        });

    });

});
