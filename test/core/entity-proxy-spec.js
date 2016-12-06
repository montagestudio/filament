var EntityProxy = require("core/entity-proxy").EntityProxy,
    Map = require("montage/collections/map"),
    documentControllerMock = require("test/mocks/document-controller-mocks").documentControllerMock,
    reelDocumentMock = require("test/mocks/reel-document-mocks").reelDocumentMock;

function nodeProxyMock(options) {
    var mock = {
        proxyType: "NodeProxy",
        tagName: "DIV",
        children: []
    };
    options && Object.keys(options).forEach(function (key) {
        mock[key] = options[key];
    });
    return mock;
}

function reelProxyMock(options) {
    var mock = {
        proxyType: "ProxyObject",
        properties: new Map
    };
    options && Object.keys(options).forEach(function (key) {
        mock[key] = options[key];
    });
    return mock;
}

describe("core/entity-proxy", function () {
    var node;

    beforeEach(function () {
        node = new EntityProxy;
    });

    describe("proxyType", function () {
        it("is EntityProxy", function () {
            expect(node.proxyType).toBe("EntityProxy");
        });
    });

    describe("hasComponent", function () {
        it("is true when EntityProxy is given a ReelProxy", function () {
            node.init(reelProxyMock(), reelDocumentMock());
            expect(node.hasComponent).toBe(true);
        });

        it("is true when EntityProxy is given a NodeProxy with a component", function () {
            node.init(nodeProxyMock({
                component: reelProxyMock()
            }), reelDocumentMock());
            expect(node.hasComponent).toBe(true);
        });

        it("is false when EntityProxy is given a NodeProxy without a component", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect(node.hasComponent).toBe(false);
        });
    });

    describe("hasTemplate", function () {
        it("is true when EntityProxy is given a NodeProxy", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect(node.hasTemplate).toBe(true);
        });

        it("is true when EntityProxy is given a ReelProxy with an element property", function () {
            node.init(reelProxyMock({
                properties: Map.from({
                    element: nodeProxyMock()
                })
            }), reelDocumentMock());
            expect(node.hasTemplate).toBe(true);
        });

        it("is false when EntityProxy is given a ReelProxy without an element property", function () {
            node.init(reelProxyMock(), reelDocumentMock());
            expect(node.hasTemplate).toBe(false);
        });
    });

    describe("isOwner", function () {
        it("is false by default", function () {
            node.init(reelProxyMock(), reelDocumentMock());
            expect(node.isOwner).toBe(false);
        });

        it("is true when specified in init", function () {
            node.init(reelProxyMock(), reelDocumentMock(), true);
            expect(node.isOwner).toBe(true);
        });
    });

    describe("label", function () {
        it("uses the component name when the node is the owner of a component", function () {
            node.init(nodeProxyMock({
                montageId: "owner",
                component: reelProxyMock({
                    label: "owner"
                })
            }), reelDocumentMock({
                _exportName: "MyComponent"
            }), true);
            expect([node.label, node.labelType]).toEqual(["MyComponent", "component"]);
        });

        it("uses the element's data-montage-id when the node has both a component and an element", function () {
            node.init(nodeProxyMock({
                montageId: "some-id",
                component: reelProxyMock({
                    label: "some-label"
                })
            }), reelDocumentMock());
            expect([node.label, node.labelType]).toEqual(["some-id", "data-montage-id"]);
        });

        it("uses the data-montage-id when the node has no component and an element with a data-montage-id", function () {
            node.init(nodeProxyMock({
                montageId: "some-id"
            }), reelDocumentMock());
            expect([node.label, node.labelType]).toEqual(["some-id", "data-montage-id"]);
        });

        it("uses the serialization label when the node has a component with no element", function () {
            node.init(reelProxyMock({
                label: "some-label"
            }), reelDocumentMock());
            expect([node.label, node.labelType]).toEqual(["some-label", "label"]);
        });

        it("uses the class name when the node has no component and an element with a class", function () {
            node.init(nodeProxyMock({
                className: "myClass"
            }), reelDocumentMock());
            expect([node.label, node.labelType]).toEqual(["myClass", "class"]);
        });

        it("is the tagName when the node has no component and an element with no data-montage-id or class", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect([node.label, node.labelType]).toEqual(["div", "tagName"]);
        });
    });

    describe("moduleId", function () {
        it("returns the module id of the component when the node is an owner", function () {
            node.init(reelProxyMock({
                label: "owner",
                moduleId: "ui/my-module-id"
            }), reelDocumentMock(), true);
            expect(node.moduleId).toBe("ui/my-module-id");
        });

        it("returns the prototype module id when the node has a prototype", function () {
            node.init(reelProxyMock({
                moduleId: "ui/my-module-id"
            }), reelDocumentMock());
            expect(node.moduleId).toBe("ui/my-module-id");
        });

        it("returns null when the node does not have a component", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect(node.moduleId).toBe(null);
        });
    });

    describe("properties", function () {
        it("returns null when the node has no component", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect(node.properties).toBe(null);
        });

        it("includes the ReelProxy's properties when the node has a component", function () {
            node.init(reelProxyMock({
                properties: Map.from({
                    element: nodeProxyMock(),
                    foo: "bar",
                    baz: "ban"
                })
            }), reelDocumentMock());
            expect(node.properties.size).toBe(3);
            expect(node.properties.get("foo").value).toBe("bar");
            expect(node.properties.get("foo").source).toBe("serialization");
        });

        it("includes the properties defined in the component's JS if it is an owner", function () {
            node.init(reelProxyMock(), reelDocumentMock({
                javascriptProperties: Promise.resolve({
                    foo: "bar"
                })
            }), true);
            // Need to sleep one cycle so the javascript promises resolve
            return Promise.delay(0).then(function () {
                expect(node.properties.get("foo").value).toBe("bar");
                expect(node.properties.get("foo").source).toBe("javascript");
            });
        });
    });

    describe("listeners", function () {
        it("returns null when the node has no component", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect(node.listeners).toBe(null);
        });

        it("points to the ReelProxy's listeners when the node has a component", function () {
            node.init(reelProxyMock({
                listeners: [
                    { type: "action", listener: reelProxyMock() },
                    { type: "longpress", listener: reelProxyMock() }
                ] 
            }), reelDocumentMock());
            expect(node.listeners.length).toBe(2);
        });
    });

    describe("functions", function () {
        it("is null if the proxy is not an owner", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect(node.functions).toBe(null);
        });

        it("is an empty array if the component has no functions", function () {
            node.init(nodeProxyMock(), reelDocumentMock({
                functions: Promise.resolve({})
            }), true);
            // Need to sleep one cycle so the javascript promises resolve
            return Promise.delay(0).then(function () {
                expect(Object.keys(node.functions).length).toBe(0);
            });
        });

        it("includes all of the component's functions", function () {
            node.init(nodeProxyMock(), reelDocumentMock({
                functions: Promise.resolve({
                    foo: {
                        arguments: ["bar", "baz"],
                        body: "lorem ipsum"
                    }
                })
            }), true);
            // Need to sleep one cycle so the javascript promises resolve
            return Promise.delay(0).then(function () {
                expect(node.functions["foo"]);
            });
        });
    });

    describe("children", function () {
        it("is an empty array when the given proxy has no children and isn't an owner", function () {
            node.init(nodeProxyMock(), reelDocumentMock());
            expect(node.children.length).toBe(0);
        });

        it("has an entity proxy for all of its DOM children", function () {
            node.init(nodeProxyMock({
                children: [nodeProxyMock(), nodeProxyMock()]
            }), reelDocumentMock());
            expect(node.children.length).toBe(2);
        });

        it("has an entity proxy for all of its document's top-level components if it is the owner", function () {
            node.init(nodeProxyMock(), reelDocumentMock({
                editingProxyMap: {
                    foo: reelProxyMock(),
                    bar: reelProxyMock()
                }
            }), true);
            expect(node.children.length).toBe(2);
        });

        it("has an entity proxy for all of its DOM children and top-level components if it is the owner", function () {
            node.init(nodeProxyMock({
                children: [nodeProxyMock(), nodeProxyMock()]
            }), reelDocumentMock({
                editingProxyMap: {
                    foo: reelProxyMock(),
                    bar: reelProxyMock()
                }
            }), true);
            expect(node.children.length).toBe(4);
        });
    });

});

