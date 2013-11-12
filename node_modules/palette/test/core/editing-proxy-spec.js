var Montage = require("montage").Montage,
    EditingProxy = require("core/editing-proxy").EditingProxy;

describe("core/editing-proxy-spec", function () {

    var proxy, label, serialization, exportId, editingDocument;

    beforeEach(function () {
        exportId = "foo/bar/baz";
        label = "myObject";
        serialization = {
            prototype: exportId,
            properties: {}
        };
        editingDocument = Montage.create();
        proxy = EditingProxy.create().init(label, serialization, exportId, editingDocument);
    });

    describe("initialization", function () {

        it("should have the expected label", function () {
            expect(proxy.label).toBe(label);
        });

        it("should have the expected editingDocument", function () {
            expect(proxy.editingDocument).toBe(editingDocument);
        });

    });

});
