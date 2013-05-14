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

describe("core/reel-document-headless-editing-spec", function () {

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
            "bar": {
                "prototype": "bar-exportId"
            }
        }, '<div id="ownerElement" data-montage-id="ownerElement"><section id="removeSubTree"><p id="removeMe"></p><div id="foo" data-montage-id="foo"></div></section></div>');
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

    });

});
