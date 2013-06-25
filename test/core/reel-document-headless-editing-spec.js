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
        }, '<div data-montage-id="ownerElement"><div data-montage-id="foo"><span data-montage-id="a"></span><span data-montage-id="b"></span></div></div>');
    });

    describe("adding a single component", function () {
        var readyPromise;

        beforeEach(function () {
            var serialization = {
                "myComponent": {
                    "prototype": "test/my-component.reel",
                    "properties": {
                        "element": {"#": "myComponent"}
                    }
                }
            };

            var markup = '<div data-montage-id="myComponent"></div>';

            readyPromise = Promise.all([reelDocumentPromise, templateWithSerializationAndBodyContent(serialization, markup)]);
        });

        it("should return a promise for a proxy of the added component", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                var addedObjects = reelDocument.addObjectsFromTemplate(insertionTemplate);
                expect(Promise.isPromiseAlike(addedObjects)).toBeTruthy();
                addedObjects.done();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add the proxy to the editing document", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                return reelDocument.addObjectsFromTemplate(insertionTemplate).then(function (proxies) {
                    expect(proxies).toBeTruthy();
                    expect(proxies.length).toBe(1);
                    expect(reelDocument.editingProxyMap.myComponent).toBe(proxies[0]);
                    expect(reelDocument.editingProxies.indexOf(proxies[0]) >= 0).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add the component to the serialization of the editing document", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                return reelDocument.addObjectsFromTemplate(insertionTemplate).then(function (proxies) {
                    var templateSerialization = reelDocument._buildSerializationObjects();
                    expect(templateSerialization.myComponent).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add the component's element to the htmlDocument of the editing document", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                return reelDocument.addObjectsFromTemplate(insertionTemplate).then(function (proxies) {
                    var addedElement = reelDocument.htmlDocument.querySelector("[data-montage-id=myComponent]");
                    expect(addedElement).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add the component's element as the last child of the specified object when no next sibling is specified", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                var parentElement = reelDocument.editingProxyMap.foo.properties.get('element');

                return reelDocument.addObjectsFromTemplate(insertionTemplate, parentElement).then(function (proxies) {
                    var addedElement = reelDocument.htmlDocument.querySelector("[data-montage-id=myComponent]");
                    var addedElementParent = reelDocument.nodeProxyForNode(addedElement.parentNode);
                    expect(addedElementParent).toBe(parentElement);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add the component's element as a child of the specified object before the specified next sibling", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                var parentElement = reelDocument.editingProxyMap.foo.properties.get('element');
                var nextSibling = reelDocument.nodeProxyForMontageId("b");
                return reelDocument.addObjectsFromTemplate(insertionTemplate, parentElement, nextSibling).then(function (proxies) {
                    //should be inserted as a child of foo, between a and b
                    var addedElement = reelDocument.nodeProxyForMontageId("myComponent");
                    expect(addedElement.parentNode).toBe(parentElement);
                    expect(addedElement.nextSibling).toBe(nextSibling);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for this adition", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                return reelDocument.addObjectsFromTemplate(insertionTemplate).then(function (proxies) {
                    expect(reelDocument.undoManager.undoCount).toBe(1);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo this adding operation by removing the added component and element", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                return reelDocument.addObjectsFromTemplate(insertionTemplate).then(function (proxies) {
                    reelDocument.undoManager.undo().then(function() {
                        var templateSerialization = reelDocument._buildSerializationObjects(),
                            addedElement;

                        expect(reelDocument.editingProxyMap.myComponent).toBeUndefined();
                        expect(reelDocument.editingProxies.indexOf(proxies[0])).toBe(-1);
                        expect(templateSerialization.myComponent).toBeUndefined();

                        addedElement = reelDocument.htmlDocument.querySelector("[data-montage-id=myComponent]");
                        expect(addedElement).toBeFalsy();
                        expect(reelDocument.templateNodes.indexOf(addedElement)).toBe(-1);
                    });
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("removing a component", function () {

        var labelInOwner = "foo";

        it("should return a promise for a removed proxy", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove);

                expect(Promise.isPromiseAlike(removalPromise)).toBeTruthy();
                removalPromise.done();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the proxy from the editing document", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner];

                return reelDocument.removeObject(proxyToRemove).then(function (removedProxy) {
                    expect(removedProxy).toBeTruthy();
                    expect(reelDocument.editingProxyMap[labelInOwner]).toBeUndefined();
                    expect(reelDocument.editingProxies.indexOf(removedProxy) === -1).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the component from the serialization of the editing document", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove),
                    templateSerialization;

                return removalPromise.then(function () {
                    templateSerialization = reelDocument._buildSerializationObjects();
                    expect(templateSerialization[labelInOwner]).toBeUndefined();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not remove the component's element from the htmlDocument of the editing document", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove);

                return removalPromise.then(function () {
                    var disconnectedElement = reelDocument.htmlDocument.querySelector("[data-montage-id=foo]");
                    expect(disconnectedElement).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not remove any other components from the serialization of the editing document", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove),
                    templateSerialization;

                return removalPromise.then(function () {
                    expect(reelDocument.editingProxies.length).toBe(2);
                    templateSerialization = reelDocument._buildSerializationObjects();
                    expect(templateSerialization.owner).toBeTruthy();
                    expect(templateSerialization.bar).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add an undo operation for this removal", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove),
                    templateSerialization;

                return removalPromise.then(function () {
                    expect(reelDocument.undoManager.undoCount).toBe(1);
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should undo removal operation by adding the removed component", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner];
                var removalPromise = reelDocument.removeObject(proxyToRemove);

                return removalPromise.then(function () {
                    return reelDocument.undo();
                }).then(function (undoResult) {
                    var addedProxy = reelDocument._editingProxyMap[labelInOwner];
                    expect(addedProxy).toBeTruthy();

                    expect(addedProxy).toBe(proxyToRemove);
                    expect(addedProxy.properties.get("element")._templateNode.getAttribute("data-montage-id")).toBe("foo");
                    expect(addedProxy.exportId).toBe("ui/foo.reel");
                    expect(addedProxy.exportName).toBe("Foo");
                    expect(addedProxy.identifier).toBe(labelInOwner);

                    var addedElement = reelDocument.htmlDocument.querySelector("[data-montage-id=foo]");
                    expect(addedElement).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("adding a single object", function () {
        var readyPromise;

        beforeEach(function () {
            var serialization = {
                "myController": {
                    "prototype": "test/my-controller"
                }
            };

            var markup = '';

            readyPromise = Promise.all([reelDocumentPromise, templateWithSerializationAndBodyContent(serialization, markup)]);
        });

        it("should return a promise for a proxy of the added object", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                var addedObjects = reelDocument.addObjectsFromTemplate(insertionTemplate);
                expect(Promise.isPromiseAlike(addedObjects)).toBeTruthy();
                addedObjects.done();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add the proxy to the editing document", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                return reelDocument.addObjectsFromTemplate(insertionTemplate).then(function (addedObjects) {
                    expect(addedObjects).toBeTruthy();
                    expect(addedObjects.length).toBe(1);
                    expect(reelDocument.editingProxyMap.myController).toBe(addedObjects[0]);
                    expect(reelDocument.editingProxies.indexOf(addedObjects[0]) >= 0).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should add the component to the serialization of the editing document", function () {
            return readyPromise.spread(function (reelDocument, insertionTemplate) {
                return reelDocument.addObjectsFromTemplate(insertionTemplate).then(function (addedObjects) {
                    var templateSerialization = reelDocument._buildSerializationObjects();
                    expect(templateSerialization.myController).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("removing an object", function () {

        var labelInOwner = "bar",
            proxyToRemove;

        it("should return a promise for a removed proxy", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove);

                expect(Promise.isPromiseAlike(removalPromise)).toBeTruthy();
                removalPromise.done();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the proxy from the editing document", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove);

                return removalPromise.then(function (removedProxy) {
                    expect(removedProxy).toBeTruthy();
                    expect(reelDocument.editingProxyMap[labelInOwner]).toBeUndefined();
                    expect(reelDocument.editingProxies.indexOf(removedProxy) === -1).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should remove the object from the serialization of the editing document", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove),
                    templateSerialization;

                return removalPromise.then(function () {
                    templateSerialization = reelDocument._buildSerializationObjects();
                    expect(templateSerialization[labelInOwner]).toBeUndefined();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("must not remove any other objects from the serialization of the editing document", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToRemove = reelDocument.editingProxyMap[labelInOwner],
                    removalPromise = reelDocument.removeObject(proxyToRemove),
                    templateSerialization;

                return removalPromise.then(function () {
                    expect(reelDocument.editingProxies.length).toBe(2);
                    templateSerialization = reelDocument._buildSerializationObjects();
                    expect(templateSerialization.owner).toBeTruthy();
                    expect(templateSerialization.foo).toBeTruthy();
                });
            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("setting a property on an object", function () {

        var labelInOwner = "bar",
            proxyToEdit;

        it("should set the property on the proxy to be the expected value", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToEdit = reelDocument.editingProxyMap[labelInOwner];
                reelDocument.setOwnedObjectProperty(proxyToEdit, "prop", "myValue");

                expect(proxyToEdit.properties.get("prop")).toBe("myValue");
            });
        });

        it("should set the property in the serialization to be the expected value", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var proxyToEdit = reelDocument.editingProxyMap[labelInOwner],
                    templateSerialization;

                reelDocument.setOwnedObjectProperty(proxyToEdit, "prop", "myValue");
                templateSerialization = reelDocument._buildSerializationObjects();

                expect(templateSerialization[labelInOwner].properties.prop).toBe("myValue");
            });
        });

    });

    describe("removing bindings", function () {

        it ("should remove the binding from the specified object", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var binding = targetProxy.bindings[0];

                reelDocument.cancelOwnedObjectBinding(targetProxy, binding);

                expect(targetProxy.bindings.indexOf(binding) === -1).toBeTruthy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should register an undoable operation for the removal of a binding", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var binding = targetProxy.bindings[0];

                reelDocument.cancelOwnedObjectBinding(targetProxy, binding);
                expect(reelDocument.undoManager.undoCount).toBe(1);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should undo the removal of a binding by defining a similar binding", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var binding = targetProxy.bindings[0];

                reelDocument.cancelOwnedObjectBinding(targetProxy, binding);
                return reelDocument.undo().then(function (definedBinding) {
                    expect(definedBinding).not.toBe(binding);
                    expect(definedBinding.targetPath).toBe(binding.targetPath);
                    expect(definedBinding.oneway).toBe(binding.oneway);
                    expect(definedBinding.sourcePath).toBe(binding.sourcePath);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("defining bindings", function () {

        var targetPath, oneway, sourcePath;

        beforeEach(function () {
            targetPath = "a.Target.Path";
            oneway = true;
            sourcePath = "a.Source.Path";
        });

        it ("should define the binding with the expected properties", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;

                var binding = reelDocument.defineOwnedObjectBinding(targetProxy, targetPath, oneway, sourcePath);

                expect(binding.targetPath).toBe(targetPath);
                expect(binding.oneway).toBe(oneway);
                expect(binding.targetPath).toBe(targetPath);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should define the binding on the specified  object", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var binding = reelDocument.defineOwnedObjectBinding(targetProxy, targetPath, oneway, sourcePath);

                expect(targetProxy.bindings.indexOf(binding) === -1).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });


        it ("should register an undoable operation for the defining of a binding", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var binding = reelDocument.defineOwnedObjectBinding(targetProxy, targetPath, oneway, sourcePath);

                expect(reelDocument.undoManager.undoCount).toBe(1);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should undo the defining of a binding by removing that binding", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var binding = reelDocument.defineOwnedObjectBinding(targetProxy, targetPath, oneway, sourcePath);

                return reelDocument.undo().then(function (deletedBinding) {
                    expect(deletedBinding).toBe(binding);
                    expect(targetProxy.bindings.indexOf(binding) === -1).toBeTruthy();
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("removing listeners", function () {

        it ("should remove the listener from the specified object", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var listener = targetProxy.listeners[0];

                reelDocument.removeOwnedObjectEventListener(targetProxy, listener);

                expect(targetProxy.listeners.indexOf(listener) === -1).toBeTruthy();

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should register an undoable operation for the removal of a listener", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var listener = targetProxy.listeners[0];

                reelDocument.removeOwnedObjectEventListener(targetProxy, listener);
                expect(reelDocument.undoManager.undoCount).toBe(1);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should undo the removal of a listener by defining a similar listener", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var listener = targetProxy.listeners[0];

                reelDocument.removeOwnedObjectEventListener(targetProxy, listener);
                return reelDocument.undo().then(function (addedListener) {
                    expect(addedListener.type).toBe(listener.type);
                    expect(addedListener.listener).toBe(listener.listener);
                    expect(addedListener.useCapture).toBe(listener.useCapture);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

    });

    describe("defining bindings", function () {

        var type, useCapture;

        beforeEach(function () {
            type = "someEvent";
            useCapture = false;
        });

        it ("should add a listener with the expected properties", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;

                var listener = reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture);

                expect(listener.type).toBe(type);
                expect(listener.listener).toBe(eventHandler);
                expect(listener.useCapture).toBe(useCapture);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should add an event listener on the specified object", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;
                var listener = reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture);

                expect(targetProxy.listeners.indexOf(listener) === -1).toBeFalsy();

            }).timeout(WAITSFOR_TIMEOUT);
        });


        it ("should register an undoable operation for the adding an event listener", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;
                var listener = reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture);

                expect(reelDocument.undoManager.undoCount).toBe(1);

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should undo the adding of a listener by removing that listener", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;
                var listener = reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture);

                return reelDocument.undo().then(function (removedListener) {
                    expect(removedListener).toBe(listener);
                    expect(targetProxy.listeners.indexOf(removedListener) === -1).toBeTruthy();
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });
    });


});
