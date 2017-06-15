var reelDocumentMock = require("mocks/reel-document-mocks").reelDocumentMock,
    ReelProxy = require("filament/core/reel-proxy").ReelProxy;

describe("core/reel-proxy-spec", function () {

    var proxy, label, serialization, exportId, editingDocument;

    beforeEach(function () {
        exportId = "foo/bar/baz";
        label = "myObject";
        serialization = {
            prototype: exportId,
            properties: {}
        };
        editingDocument = reelDocumentMock();

        proxy = new ReelProxy().init(label, serialization, exportId, editingDocument);
    });

    describe("initialization", function () {

        it("must reject conflicting serialization prototype and exportId arguments", function () {
            expect(function () {
                new ReelProxy().init(label, serialization, "different/export-id");
            }).toThrow();
        });

        it("should have the specified exportId if the serialization did not specify one", function () {
            proxy = new ReelProxy().init(label, {properties: {label: "owner"}}, "specified/export-id");
            expect(proxy.exportId).toBe("specified/export-id");
        });

        it("should have the specified exportId if the serialization did specifed one", function () {
            proxy = new ReelProxy().init(label, {prototype: "specified/export-id", properties: {label: "foo"}});
            expect(proxy.exportId).toBe("specified/export-id");
        });

        it("should have the expected label", function () {
            expect(proxy.label).toBe(label);
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

    describe("reporting the identifier", function () {

        it("should report its label as the identifier in lieu of an explicit identifier", function () {
            expect(proxy.identifier).toBe(label);
        });

        it("should report its explicit identifier as its identifier", function () {
            serialization.properties.identifier = "fooIdentifier";
            proxy = new ReelProxy().init(label, serialization, exportId);

            expect(proxy.identifier).toBe("fooIdentifier");
        });

    });

    describe("bindings", function () {

        it("should correctly represent a one-way binding", function () {
            var element = {};
            var serialization = {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": element
                },
                "bindings": {
                    "propertyOfFoo": {"<-": "@foo.anotherPropertyOfFoo"}
                }
            };

            proxy = new ReelProxy().init(label, serialization);
            var bindingEntry = proxy.bindings[0];

            expect(bindingEntry).toBeTruthy();
            expect(bindingEntry.targetPath).toBe("propertyOfFoo");
            expect(bindingEntry.twoWay).toBeFalsy();
            expect(bindingEntry.sourcePath).toBe("@foo.anotherPropertyOfFoo");
        });

        it("should correctly represent a two-way binding", function () {
            var element = {};
            var serialization = {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": element
                },
                "bindings": {
                    "propertyOfFoo": {"<->": "@foo.anotherPropertyOfFoo"}
                }
            };

            proxy = new ReelProxy().init(label, serialization);
            var bindingEntry = proxy.bindings[0];

            expect(bindingEntry).toBeTruthy();
            expect(bindingEntry.targetPath).toBe("propertyOfFoo");
            expect(bindingEntry.oneway).toBeFalsy();
            expect(bindingEntry.sourcePath).toBe("@foo.anotherPropertyOfFoo");
        });

    });

    describe("listeners", function () {

        it("should correctly represent a listener", function () {
            var element = {};
            var listenerObject = {};
            var serialization = {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": element
                },
                "listeners": [
                    {
                        "type": "fooEvent",
                        "listener": listenerObject
                    }
                ]
            };

            proxy = new ReelProxy().init(label, serialization);
            var listenerEntry = proxy.listeners[0];

            expect(listenerEntry).toBeTruthy();
            expect(listenerEntry.type).toBe("fooEvent");
            expect(listenerEntry.listener).toBe(listenerObject);
        });
    });

    describe("setting properties", function () {

        it("should read properties that were part of the original serialization", function () {
            serialization = {};
            proxy = new ReelProxy().init(label, serialization, "different/export-id");
            proxy.setObjectProperty("foo", 42);

            expect(proxy.getObjectProperty("foo")).toBe(42);
        });

        it("should read properties that were not part of the original serialization", function () {
            proxy.setObjectProperty("foo", 42);
            expect(proxy.getObjectProperty("foo")).toBe(42);
        });

        it("should remove the specified property when deleting that property", function () {
            serialization = {
                properties: {
                    foo: 42
                }
            };
            proxy = new ReelProxy().init(label, serialization, "different/export-id");
            proxy.deleteObjectProperty("foo", 42);

            expect(proxy.getObjectProperty("foo")).toBeFalsy();
        });

        it("should set the identifier as expected", function () {
            proxy.identifier = "aNewIdentifier";
            expect(proxy.identifier).toBe("aNewIdentifier");
            expect(proxy.getObjectProperty("identifier")).toBe("aNewIdentifier");
        });
    });


});
