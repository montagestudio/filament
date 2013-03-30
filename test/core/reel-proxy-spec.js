var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument,
    ReelProxy = require("core/reel-proxy").ReelProxy,
    WAITSFOR_TIMEOUT = 2500;

describe("core/editing-proxy-spec", function () {

    var proxy, label, doc, serialization, exportId;

    beforeEach(function () {
        exportId = "foo/bar/baz";
        label = "myObject";
        doc = Montage.create();
        serialization = {
            prototype: exportId,
            properties: {}
        };
        proxy = ReelProxy.create().init(label, serialization, doc, exportId);
    });

    describe("initialization", function () {

        it("must reject conflicting serialization prototype and exportId arguments", function () {
            expect(function () {
                ReelProxy.create().init(label, serialization, doc, "different/export-id");
            }).toThrow();
        });

        it("should have the specified exportId if the serialization did not specify one", function () {
            proxy = ReelProxy.create().init(label, {properties: {label: "owner"}}, doc, "specified/export-id");
            expect(proxy.exportId).toBe("specified/export-id");
        });

        it("should have the specified exportId if the serialization did specifed one", function () {
            proxy = ReelProxy.create().init(label, {prototype: "specified/export-id", properties: {label: "foo"}}, doc);
            expect(proxy.exportId).toBe("specified/export-id");
        });

        it("should have the expected label", function () {
            expect(proxy.label).toBe(label);
        });

        it("should have the expected editingDocument", function () {
            expect(proxy.editingDocument).toBe(doc);
        });

        it("should have the expected exportId", function () {
            expect(proxy.exportId).toBe("foo/bar/baz");
        });

        it("should have the expected moduleId", function () {
            expect(proxy.moduleId).toBe("foo/bar/baz");
        });

        it("should have the expected exportName", function () {
            expect(proxy.exportName).toBe("Baz");
        });

    });

    describe("setting properties", function () {

        it("should create a properties unit if none exists when setting a property", function () {
            serialization = {};
            proxy = ReelProxy.create().init(label, serialization, doc, "different/export-id");
            proxy.setObjectProperty("foo", 42);

            expect(serialization.properties.foo).toBe(42);
        });

        it("should delete the properties unit when the last property is deleted", function () {
            serialization = {
                properties: {
                    foo: 42
                }
            };
            proxy = ReelProxy.create().init(label, serialization, doc, "different/export-id");
            proxy.deleteObjectProperty("foo", 42);

            expect(serialization.properties).toBeUndefined();
        });

        it("should set the specified value on the specified key", function () {
            proxy.setObjectProperty("foo", 42);
            expect(proxy.properties.foo).toBe(42);
        });

        it("should get the specified value at the specified key", function () {
            proxy.properties.foo = 22;
            expect(proxy.getObjectProperty("foo")).toBe(22);
        });

    });


});
