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

    describe("preserving the original serialization as a map", function () {

        beforeEach(function () {
            serialization = {
                prototype: exportId,
                properties: {},
                foo: "something",
                bar: {
                    baz: "more",
                    qux: ["a", "b", "c"]
                }
            };

            proxy = EditingProxy.create().init(label, serialization, exportId, editingDocument);
        });

        it("must preserve top level properties", function () {
            expect(proxy.originalSerializationMap.get('foo')).toBe("something");
        });

        it("must preserve the entire tree of properties", function () {
            var barUnit = proxy.originalSerializationMap.get('bar');

            expect(barUnit.baz).toBe("more");
            expect(JSON.stringify(barUnit.qux)).toBe(JSON.stringify(["a", "b", "c"]));
        });
    });
});
