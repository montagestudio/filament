var EditingDocument = require("core/editing-document").EditingDocument,
    EditingProxy = require("core/editing-proxy").EditingProxy;

describe("core/editing-document-spec", function () {

    var editingDocument,
        originalLabel,
        aProxy,
        anotherProxy;

    beforeEach(function () {
        var packageRequire = {};
        editingDocument = new EditingDocument().init("fileUrl", packageRequire);

        originalLabel = "foo";
        var exportId = "foo/bar/baz";
        var serialization = {
            prototype: exportId,
            properties: {}
        };

        aProxy = new EditingProxy().init(originalLabel, serialization, exportId, editingDocument);
        editingDocument.__addProxy(aProxy);

        anotherProxy = new EditingProxy().init("baz", serialization, exportId, editingDocument);
        editingDocument.__addProxy(anotherProxy);
    });

    describe("initialization", function () {

        it ("should have a proxy with the expected label within the proxy map", function () {
            expect(editingDocument.editingProxyMap[originalLabel]).toBe(aProxy);
        });

    });

    describe("changing proxy labels", function () {

        var newLabel;

        beforeEach(function () {
            newLabel = "bar";
        });

        it("should find the same proxy at the new label within the proxy map", function () {
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);
            expect(editingDocument.editingProxyMap[newLabel]).toBe(aProxy);
        });

        it("must not have an entry for the old label within the proxy map", function () {
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);
            expect(editingDocument.editingProxyMap[originalLabel]).toBeUndefined();
        });

        it("should change the label of the proxy itself", function () {
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);
            expect(aProxy.label).toBe(newLabel);
        });

        it("must not perform the change if there is a existing proxy with the specified label", function () {
            var anotherLabel = anotherProxy.label;
            editingDocument.setOwnedObjectLabel(aProxy, anotherLabel);

            expect(editingDocument.editingProxyMap[originalLabel]).toBe(aProxy);
            expect(editingDocument.editingProxyMap[anotherLabel]).toBe(anotherProxy);
        });

        it("must not perform the change if no new label was specified", function () {
            newLabel = "";
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);

            expect(editingDocument.editingProxyMap[originalLabel]).toBe(aProxy);
            expect(editingDocument.editingProxyMap[newLabel]).toBeUndefined();
        });

        it("should register an undo operation for the label change", function () {
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);
            expect(editingDocument.undoManager.undoCount).toBe(1);
            expect(editingDocument.undoManager.redoCount).toBe(0);
        });

        it("should revert back to the previous label upon undoing the label change", function () {
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);
            return editingDocument.undoManager.undo().then(function () {
                expect(editingDocument.editingProxyMap[originalLabel]).toBe(aProxy);
                expect(editingDocument.editingProxyMap[newLabel]).toBeUndefined();
            });
        });

        it("should register a redo operation upon undoing the label change", function () {
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);
            return editingDocument.undoManager.undo().then(function () {
                expect(editingDocument.undoManager.undoCount).toBe(0);
                expect(editingDocument.undoManager.redoCount).toBe(1);
            });
        });

        it("should have the new label upon redoing the label change", function () {
            editingDocument.setOwnedObjectLabel(aProxy, newLabel);
            return editingDocument.undoManager.undo().then(function () {
                return editingDocument.undoManager.redo();
            }).then(function () {
                expect(editingDocument.editingProxyMap[newLabel]).toBe(aProxy);
                expect(editingDocument.editingProxyMap[originalLabel]).toBeUndefined();
            });
        });

    });

});
