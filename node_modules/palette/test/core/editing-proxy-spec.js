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

    describe("didChangeObjectProperties", function() {
        beforeEach(function () {
            serialization = {
                prototype: exportId,
                properties: {
                    foo: "a string",
                    bar: 42
                }
            };

            proxy = new EditingProxy().init(label, serialization, exportId, editingDocument);
        });

        it("should dispatch when a property is changed", function() {
            var listener = {
                handleEvent: function(){}
            };
            spyOn(listener, "handleEvent");

            proxy.addEventListener("didChangeObjectProperties", listener);
            proxy.setObjectProperty("foo", "another string");

            expect(listener.handleEvent.callCount).toBe(1);
        });

        it("should dispatch a single time when multiple properties are changed", function() {
            var listener = {
                handleEvent: function(){}
            };
            spyOn(listener, "handleEvent");

            proxy.addEventListener("didChangeObjectProperties", listener);
            proxy.setObjectProperties({
                foo: "another string",
                bar: 1
            });

            expect(listener.handleEvent.callCount).toBe(1);
        })
    });

    describe("propertiesChangeDispatchingEnabled", function() {
        beforeEach(function () {
            serialization = {
                prototype: exportId,
                properties: {
                    foo: "a string",
                    bar: 42
                }
            };

            proxy = new EditingProxy().init(label, serialization, exportId, editingDocument);
        });

        it("should not dispatch didChangeObjectProperties when propertiesChangeDispatchingEnabled is enabled on setObjectProperty", function() {
            var listener = {
                handleEvent: function(){}
            };
            spyOn(listener, "handleEvent");

            proxy.addEventListener("didChangeObjectProperties", listener);
            proxy.propertiesChangeDispatchingEnabled = false;
            proxy.setObjectProperty("foo", "another string");

            expect(listener.handleEvent.callCount).toBe(0);
        });

        it("should not dispatch didChangeObjectProperties when propertiesChangeDispatchingEnabled is enabled on setObjectProperties", function() {
            var listener = {
                handleEvent: function(){}
            };
            spyOn(listener, "handleEvent");

            proxy.addEventListener("didChangeObjectProperties", listener);
            proxy.propertiesChangeDispatchingEnabled = false;
            proxy.setObjectProperties({
                foo: "another string",
                bar: 1
            });

            expect(listener.handleEvent.callCount).toBe(0);
        });
    });
});
