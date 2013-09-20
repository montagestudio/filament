var Montage = require("montage").Montage,
    Template = require("montage/core/template").Template,
    Promise = require("montage/core/promise").Promise,
    mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

var templateWithSerializationAndBodyContent = function (serializationObject, htmlString) {
    var doc = document.implementation.createHTMLDocument();
    var serializationElement = doc.createElement("script");
    serializationElement.setAttribute("type", "text/montage-serialization");
    serializationElement.appendChild(document.createTextNode(JSON.stringify(serializationObject)));
    doc.head.appendChild(serializationElement);
    doc.body.innerHTML = htmlString;


    return Template.create().initWithDocument(doc);
};

describe("core/reel-document-template-editing-spec", function () {

    var reelDocumentPromise;

    beforeEach(function () {

        Template._templateCache = {
            moduleId: Object.create(null)
        };

        reelDocumentPromise = mockReelDocument("foo/bar/mock.reel", {
            "owner": {
                "properties": {
                    "element": {"#": "ownerElement"}
                }
            },
            "foo": {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": {"#": "foo"}
                },
                "bindings": {
                    "targetValue": {"<-": "@bar.sourceValue"}
                },
                "listeners": [
                    {
                        "type": "fooEvent",
                        "listener": {"@": "owner"}
                    }
                ]
            },
            "testDomAttribute": {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": {"#": "testDomAttribute"}
                }
            },
            "bar": {
                "prototype": "bar-exportId",
                "properties": {
                    "elReference": {"#": "removeLastNode"}
                }
            }
        },
        '<div id="ownerElement" data-montage-id="ownerElement">'+
        '   <section id="removeSubTree">'+
        '       <p id="removeMe"></p>'+
        '       <div id="foo" data-montage-id="foo">'+
        '           <p id="removeLastNode" data-montage-id="removeLastNode"></p>'+
        '       </div>'+
        '       <div data-arg="readOnly" id="testDomAttribute" data-montage-id="testDomAttribute"></div>'+
        '   </section>'+
        '</div>');
    });

    describe("finding a node proxy for a node", function () {

        it("should find the expected proxy given a node", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);
                expect(nodeProxy).toBeTruthy();
                expect(nodeProxy._templateNode).toBe(element);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not find a proxy for an element not in the template DOM", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.createElement("div");
                var nodeProxy = reelDocument.nodeProxyForNode(element);
                expect(nodeProxy).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("creating a node proxy for a new element", function () {

        it("should create the node proxy with the expected element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<div>");
                expect(nodeProxy).toBeTruthy();
                expect(nodeProxy.tagName.toLowerCase()).toBe("div");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not consider the nodeProxy part of the template", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<div>");
                expect(nodeProxy.isInTemplate).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("removing a non-component leaf node", function () {

        it("should remove the node from the template's DOM", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(reelDocument.htmlDocument.getElementById("removeMe")).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the nodeProxy from the editing model", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(removedNodeProxy).toBe(nodeProxy);
                expect(reelDocument.templateNodes.indexOf(nodeProxy)).toBe(-1);
                expect(removedNodeProxy.isInTemplate).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the node from the parent nodeProxy", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);
                var parentProxy = reelDocument.nodeProxyForNode(element.parentElement);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(parentProxy.children.indexOf(removedNodeProxy)).toBe(-1);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for removing a node with a next sibling", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe"),
                    nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.removeTemplateNode(nodeProxy);

                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo the removal of a template node with a next sibling by adding it back", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.removeTemplateNode(nodeProxy);

                return reelDocument.undoManager.undo().then(function() {
                    expect(reelDocument.htmlDocument.getElementById("removeMe")).toBeTruthy();
                    expect(reelDocument.templateNodes.indexOf(nodeProxy)).toBeGreaterThan(-1);
                    expect(nodeProxy.isInTemplate).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo the removal of a template node with a next sibling by adding it back on the position", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var parentNode = nodeProxy.parentNode;
                var nextSibling = nodeProxy.nextSibling;
                var previousSibling = nodeProxy.previousSibling;

                reelDocument.removeTemplateNode(nodeProxy);

                return reelDocument.undoManager.undo().then(function() {
                    expect(nodeProxy.parentNode).toBe(parentNode);
                    expect(nodeProxy.nextSibling).toBe(nextSibling);
                    expect(nodeProxy.previousSibling).toBe(previousSibling);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for removing a node without a next sibling", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeLastNode"),
                    nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.removeTemplateNode(nodeProxy);

                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo the removal of a template node without a next sibling by adding it back", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeLastNode");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.removeTemplateNode(nodeProxy);

                return reelDocument.undoManager.undo().then(function() {
                    expect(reelDocument.htmlDocument.getElementById("removeLastNode")).toBeTruthy();
                    expect(reelDocument.templateNodes.indexOf(nodeProxy)).toBeGreaterThan(-1);
                    expect(nodeProxy.isInTemplate).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not appear where it used to be referenced in the serialization", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeLastNode");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                expect(reelDocument.editingProxyMap.bar.properties.get("elReference")).toBe(nodeProxy);

                reelDocument.removeTemplateNode(nodeProxy);

                expect(reelDocument.editingProxyMap.bar.properties.get("elReference")).toBeUndefined();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("removing a component-associated leaf node", function () {

        it("should remove the node from the template's DOM", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(reelDocument.htmlDocument.getElementById("foo")).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the nodeProxy from the editing model", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(removedNodeProxy).toBe(nodeProxy);
                expect(reelDocument.templateNodes.indexOf(nodeProxy)).toBe(-1);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should consider the node proxy no longer part of the template", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(removedNodeProxy.isInTemplate).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the component reference to the node", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);
                var component = nodeProxy.component;

                reelDocument.removeTemplateNode(nodeProxy);

                expect(component.properties.get("element")).toBeUndefined();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("removing a subtree", function () {

        it("must not allow removing the body element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementsByTagName("body")[0];
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(reelDocument.htmlDocument.getElementsByTagName("body")[0]).toBe(element);
                expect(reelDocument.htmlDocument.getElementById("removeSubTree")).toBeTruthy();
                expect(reelDocument.htmlDocument.getElementById("removeMe")).toBeTruthy();
                expect(reelDocument.htmlDocument.getElementById("foo")).toBeTruthy();
                expect(reelDocument.htmlDocument.getElementById("removeLastNode")).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not allow removing the owner's element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("ownerElement");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(reelDocument.htmlDocument.getElementById("ownerElement")).toBe(element);
                expect(reelDocument.htmlDocument.getElementById("removeSubTree")).toBeTruthy();
                expect(reelDocument.htmlDocument.getElementById("removeMe")).toBeTruthy();
                expect(reelDocument.htmlDocument.getElementById("foo")).toBeTruthy();
                expect(reelDocument.htmlDocument.getElementById("removeLastNode")).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the subtree root and all children from the template's DOM", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeSubTree");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(reelDocument.htmlDocument.getElementById("removeSubTree")).toBeFalsy();
                expect(reelDocument.htmlDocument.getElementById("removeMe")).toBeFalsy();
                expect(reelDocument.htmlDocument.getElementById("foo")).toBeFalsy();
                expect(reelDocument.htmlDocument.getElementById("removeLastNode")).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the nodeProxy from the editing model", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeSubTree");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var removedNodeProxy = reelDocument.removeTemplateNode(nodeProxy);
                expect(removedNodeProxy).toBe(nodeProxy);
                expect(reelDocument.templateNodes.indexOf(nodeProxy)).toBe(-1);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove all children from the editing model", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var root = reelDocument.htmlDocument.getElementById("removeSubTree");
                var rootProxy = reelDocument.nodeProxyForNode(root);

                var removeMe = reelDocument.htmlDocument.getElementById("removeMe");
                var removeMeProxy = reelDocument.nodeProxyForNode(root);

                var foo = reelDocument.htmlDocument.getElementById("foo");
                var fooProxy = reelDocument.nodeProxyForNode(foo);

                reelDocument.removeTemplateNode(rootProxy);

                expect(reelDocument.templateNodes.indexOf(rootProxy)).toBe(-1);
                expect(rootProxy.isInTemplate).toBeFalsy();

                expect(reelDocument.templateNodes.indexOf(removeMeProxy)).toBe(-1);
                expect(removeMeProxy.isInTemplate).toBeFalsy();

                expect(reelDocument.templateNodes.indexOf(fooProxy)).toBe(-1);
                expect(fooProxy.isInTemplate).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("appending a non-component leaf node", function () {

        it("should consider the nodeProxy as part of the template", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                reelDocument.appendChildToTemplateNode(nodeProxy);
                expect(nodeProxy.isInTemplate).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not allow appending to the body element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");

                var bodyElement = reelDocument.htmlDocument.getElementsByTagName("body")[0];
                var bodyProxy = reelDocument.nodeProxyForNode(bodyElement);

                reelDocument.appendChildToTemplateNode(nodeProxy, bodyProxy);
                expect(nodeProxy.isInTemplate).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for appending a non-component leaf node", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                reelDocument.appendChildToTemplateNode(nodeProxy);

                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo appending a non-component leaf node by removing it", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                reelDocument.appendChildToTemplateNode(nodeProxy);

                return reelDocument.undoManager.undo().then(function() {
                    expect(nodeProxy.isInTemplate).toBeFalsy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("inserting a non-component leaf node before another node", function () {

        it("must not allow inserting before the body element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");

                var bodyElement = reelDocument.htmlDocument.getElementsByTagName("body")[0];
                var bodyProxy = reelDocument.nodeProxyForNode(bodyElement);

                reelDocument.insertNodeBeforeTemplateNode(nodeProxy, bodyProxy);
                expect(nodeProxy.isInTemplate).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not allow inserting before the owner element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");

                var ownerElement = reelDocument.htmlDocument.getElementById("ownerElement");
                var ownerNodeProxy = reelDocument.nodeProxyForNode(ownerElement);

                reelDocument.insertNodeBeforeTemplateNode(nodeProxy, ownerNodeProxy);
                expect(nodeProxy.isInTemplate).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should consider the nodeProxy as part of the template", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');

                reelDocument.insertNodeBeforeTemplateNode(nodeProxy, fooNode);
                expect(nodeProxy.isInTemplate).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should insert the nodeProxy before the specified sibling", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');
                var fooParent = fooNode.parentNode;

                var fooIndex = fooParent.children.indexOf(fooNode);

                reelDocument.insertNodeBeforeTemplateNode(nodeProxy, fooNode);
                expect(fooParent.children.indexOf(nodeProxy)).toBe(fooIndex);
                expect(fooParent.children.indexOf(fooNode)).toBe(fooIndex + 1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for inserting a non-component leaf node before another node", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');

                reelDocument.insertNodeBeforeTemplateNode(nodeProxy, fooNode);

                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo inserting a non-component leaf node before another node by removing it", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');

                reelDocument.insertNodeBeforeTemplateNode(nodeProxy, fooNode);
                return reelDocument.undoManager.undo().then(function() {
                    expect(nodeProxy.isInTemplate).toBeFalsy();
                    expect(fooNode.parentNode.children.indexOf(nodeProxy)).toBe(-1);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("inserting a non-component leaf node after another node", function () {

        it("must not allow inserting after the body element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");

                var bodyElement = reelDocument.htmlDocument.getElementsByTagName("body")[0];
                var bodyProxy = reelDocument.nodeProxyForNode(bodyElement);

                reelDocument.insertNodeAfterTemplateNode(nodeProxy, bodyProxy);
                expect(nodeProxy.isInTemplate).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not allow inserting after the owner element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");

                var ownerElement = reelDocument.htmlDocument.getElementById("ownerElement");
                var ownerNodeProxy = reelDocument.nodeProxyForNode(ownerElement);

                reelDocument.insertNodeAfterTemplateNode(nodeProxy, ownerNodeProxy);
                expect(nodeProxy.isInTemplate).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should consider the nodeProxy as part of the template", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');

                reelDocument.insertNodeAfterTemplateNode(nodeProxy, fooNode);
                expect(nodeProxy.isInTemplate).toBeTruthy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should insert the nodeProxy before the specified sibling", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');
                var fooParent = fooNode.parentNode;

                var fooIndex = fooParent.children.indexOf(fooNode);

                reelDocument.insertNodeAfterTemplateNode(nodeProxy, fooNode);
                expect(fooParent.children.indexOf(fooNode)).toBe(fooIndex);
                expect(fooParent.children.indexOf(nodeProxy)).toBe(fooIndex + 1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for inserting a non-component leaf node after another node", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');

                reelDocument.insertNodeAfterTemplateNode(nodeProxy, fooNode);

                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo inserting a non-component leaf node after another node", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var nodeProxy = reelDocument.createTemplateNode("<p>");
                var fooNode = reelDocument.editingProxyMap.foo.properties.get('element');

                reelDocument.insertNodeAfterTemplateNode(nodeProxy, fooNode);
                return reelDocument.undoManager.undo().then(function() {
                    expect(nodeProxy.isInTemplate).toBeFalsy();
                    expect(fooNode.parentNode.children.indexOf(nodeProxy)).toBe(-1);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("adding library item with an element property", function () {
        it("doesn't use an existing element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                // setup
                var nodeProxy = reelDocument.createTemplateNode('<p data-montage-id="test">');
                reelDocument.appendChildToTemplateNode(nodeProxy);
                expect(nodeProxy.isInTemplate).toBeTruthy();

                // test
                return reelDocument.addLibraryItemFragments({
                    "prototype": "ui/foo.reel",
                    "properties": {
                        "element": {"#": "test"}
                    }
                }).then(function (objects) {
                    expect(objects[0].properties.get("element")).not.toBe(nodeProxy);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("uses an existing element with a data-montage-id", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                // setup
                var nodeProxy = reelDocument.createTemplateNode('<p data-montage-id="test">');
                reelDocument.appendChildToTemplateNode(nodeProxy);
                expect(nodeProxy.isInTemplate).toBeTruthy();

                // test
                return reelDocument.addAndAssignLibraryItemFragment({
                    "prototype": "ui/foo.reel",
                    "properties": {
                        "element": {"#": "unexistingId"}
                    }
                }, nodeProxy).then(function (objects) {
                    expect(objects[0].properties.get("element")).toBe(nodeProxy);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("uses an existing element without a data-montage-id", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                // setup
                var nodeProxy = reelDocument.createTemplateNode('<p>');
                reelDocument.appendChildToTemplateNode(nodeProxy);
                expect(nodeProxy.isInTemplate).toBeTruthy();

                // test
                return reelDocument.addAndAssignLibraryItemFragment({
                    "prototype": "ui/foo.reel",
                    "properties": {
                        "element": {"#": "unexistingId"}
                    }
                }, nodeProxy).then(function (objects) {
                    expect(objects[0].properties.get("element")).toBe(nodeProxy);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("uses the label from the element's data-montage-id", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                // setup
                var nodeProxy = reelDocument.createTemplateNode('<p data-montage-id="pass">');
                reelDocument.appendChildToTemplateNode(nodeProxy);
                expect(nodeProxy.isInTemplate).toBeTruthy();

                // test
                return reelDocument.addAndAssignLibraryItemFragment({
                    "prototype": "ui/foo.reel",
                    "properties": {
                        "element": {"#": "unexistingId"}
                    }
                }, nodeProxy).then(function (objects) {
                    expect(objects[0].label).toBe("pass");
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("generates a label if the element's data-montage-id is already a label", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                // setup
                var nodeProxy = reelDocument.createTemplateNode('<p data-montage-id="bar">');
                reelDocument.appendChildToTemplateNode(nodeProxy);
                expect(nodeProxy.isInTemplate).toBeTruthy();

                // test
                return reelDocument.addAndAssignLibraryItemFragment({
                    "prototype": "ui/pass.reel",
                    "properties": {
                        "element": {"#": "unexistingId"}
                    }
                }, nodeProxy).then(function (objects) {
                    expect(objects[0].label).toBe("pass1");
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("setting an object's label", function () {
        it("returns false if the new label already exists", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.foo;

                var ok = reelDocument.setOwnedObjectLabel(proxy, "bar");
                expect(ok).toBe(false);
                expect(proxy.label).toBe("foo");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("changes the montage id of an associated element", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.foo;
                var element = reelDocument.htmlDocument.getElementById("foo");

                var ok = reelDocument.setOwnedObjectLabel(proxy, "newFoo");
                expect(ok).toBe(true);
                expect(proxy.label).toBe("newFoo");
                expect(element.getAttribute("data-montage-id")).toBe("newFoo");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("does not change the montage id if it not the same as the label", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxy = reelDocument.editingProxyMap.foo;
                var element = reelDocument.htmlDocument.getElementById("foo");
                element.setAttribute("data-montage-id", "other");

                var ok = reelDocument.setOwnedObjectLabel(proxy, "newFoo");
                expect(ok).toBe(true);
                expect(proxy.label).toBe("newFoo");
                expect(element.getAttribute("data-montage-id")).toBe("other");
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("setting a node's data-montage-id", function() {

        it("should change the data-montage-id attribute", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var ok = reelDocument.setNodeProxyAttribute(nodeProxy, "data-montage-id", "newFoo");
                expect(ok).toBe(true);
                expect(element.getAttribute("data-montage-id")).toBe("newFoo");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not change the data-montage-id attribute if it's a duplicate", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var ok = reelDocument.setNodeProxyAttribute(nodeProxy, "data-montage-id", "foo");
                expect(ok).toBe(false);
                expect(element.getAttribute("data-montage-id")).not.toBe("foo");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove it when it is set to a falsy value", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyAttribute(nodeProxy, "data-montage-id", null);
                expect(element.hasAttribute("data-montage-id")).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for changing it", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyAttribute(nodeProxy, "data-montage-id", "newFoo");
                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo the setting by reverting to the previous value", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyAttribute(nodeProxy, "data-montage-id", "newFoo");

                return reelDocument.undoManager.undo().then(function() {
                    expect(element.getAttribute("data-montage-id")).toBe("foo");
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("setting a node's dom attributes", function() {

        it("should add a dom attribute", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var ok = reelDocument.setNodeProxyAttribute(nodeProxy, "data-arg", "integer");
                expect(ok).toBe(true);
                expect(element.getAttribute("data-arg")).toBe("integer");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should change the dom attribute", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                var ok = reelDocument.setNodeProxyAttribute(nodeProxy, "data-arg", "readWrite");
                expect(ok).toBe(true);
                expect(element.getAttribute("data-arg")).toBe("readWrite");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should reflect changes to the dom attribute", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy = reelDocument.nodeProxyForNode(element);
                var userVisibleValue = nodeProxy.montageArg;

                expect(userVisibleValue).toBe("readOnly");
                reelDocument.setNodeProxyAttribute(nodeProxy, "data-arg", "readWrite");
                userVisibleValue = nodeProxy.montageArg;
                expect(userVisibleValue).toBe("readWrite");
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove dom when it is set to a falsy value", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyAttribute(nodeProxy, "data-arg", null);
                expect(element.hasAttribute("data-arg")).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for changing it", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyAttribute(nodeProxy, "data-arg", "readWrite");
                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo the setting by reverting to the previous value", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyAttribute(nodeProxy, "data-arg", "readWrite");

                return reelDocument.undoManager.undo().then(function() {
                    expect(element.getAttribute("data-arg")).toBe("readOnly");
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("changing a node's tag name", function () {
        it("should add an undo operation", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyTagName(nodeProxy, "span");
                expect(reelDocument.undoManager.undoCount).toBe(1);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo the tag name by reverting to the previous value", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy = reelDocument.nodeProxyForNode(element);

                reelDocument.setNodeProxyTagName(nodeProxy, "span");

                return reelDocument.undoManager.undo().then(function() {
                    expect(element.tagName).toBe("DIV");
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });
});
