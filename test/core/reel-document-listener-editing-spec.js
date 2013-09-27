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

describe("core/reel-document-listener-editing-spec", function () {

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

                return reelDocument.removeOwnedObjectEventListener(targetProxy, listener).then(function () {
                    expect(reelDocument.undoManager.undoCount).toBe(1);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should undo the removal of a listener by restoring the same listener", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var listener = targetProxy.listeners[0];

                return reelDocument.removeOwnedObjectEventListener(targetProxy, listener).then(function () {
                    return reelDocument.undo().then(function (addedListener) {
                        expect(addedListener).toBe(listener);
                        expect(addedListener.type).toBe(listener.type);
                        expect(addedListener.listener).toBe(listener.listener);
                        expect(addedListener.useCapture).toBe(listener.useCapture);
                    });
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should undo the removal of a listener by restoring the same listener at the same index", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var listener = targetProxy.listeners[0];

                //Pad the listeners collection
                targetProxy.listeners.push("foo");
                targetProxy.listeners.push("bar");

                return reelDocument.removeOwnedObjectEventListener(targetProxy, listener).then(function () {
                    return reelDocument.undo().then(function (addedListener) {
                        expect(targetProxy.listeners.indexOf(addedListener)).toBe(0);
                    });
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        describe("when considering a series of undoable operations", function () {

            it ("should successfully perform an editing undo after undoing the removal of a listener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listener = targetProxy.listeners[0];
                    var eventHandler = reelDocument.editingProxyMap.owner;

                    //Perform some edits that will be undoable
                    reelDocument.updateOwnedObjectEventListener(targetProxy, listener, "press", eventHandler, undefined).then(function () {
                        //Remove the listener that's been edited, this will be undone shortly
                        return reelDocument.removeOwnedObjectEventListener(targetProxy, listener);
                    }).then(function () {
                            return reelDocument.undo().then(function (addedListener) {
                                //Listener should look as it did before the removal
                                expect(addedListener.type).toBe("press");
                                expect(addedListener.listener).toBe(eventHandler);
                                expect(addedListener.useCapture).toBe(undefined);

                                return reelDocument.undo().then(function (addedListener) {
                                    //Listener should look as it did after undoing both removal and the edit
                                    expect(addedListener.type).toBe("fooEvent");
                                    expect(addedListener.listener).toBe(eventHandler);
                                    expect(addedListener.useCapture).toBe(undefined);
                                });
                            });
                        });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it("should not create a new listener to as a result of undoing edits to a undoing the removal of a listener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listener = targetProxy.listeners[0];
                    var expectedListenerCount = targetProxy.listeners.length;
                    var eventHandler = reelDocument.editingProxyMap.owner;

                    //Perform some edits that will be undoable
                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listener, "press", eventHandler, undefined).then(function () {
                        //Remove the listener that's been edited, this will be undone shortly
                        return reelDocument.removeOwnedObjectEventListener(targetProxy, listener);
                    }).then(function () {
                            return reelDocument.undo().then(function (addedListener) {
                                expect(targetProxy.listeners.length).toBe(expectedListenerCount);
                                return reelDocument.undo().then(function (addedListener) {
                                    expect(targetProxy.listeners.length).toBe(expectedListenerCount);
                                });
                            });
                        });

                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

    });

    describe("defining listeners", function () {

        var type, useCapture;

        beforeEach(function () {
            type = "someEvent";
            useCapture = false;
        });

        it ("should add a listener with the expected properties", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;

                return reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture).then(function (listener) {
                    expect(listener.type).toBe(type);
                    expect(listener.listener).toBe(eventHandler);
                    expect(listener.useCapture).toBe(useCapture);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should add an event listener on the specified object", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;

                return reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture).then(function (listener) {
                    expect(targetProxy.listeners.indexOf(listener) === -1).toBeFalsy();
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });


        it ("should register an undoable operation for the adding an event listener", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;

                return reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture).then(function (listener) {
                    expect(reelDocument.undoManager.undoCount).toBe(1);
                });

            }).timeout(WAITSFOR_TIMEOUT);
        });

        it ("should undo the adding of a listener by removing that listener", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var targetProxy = reelDocument.editingProxyMap.foo;
                var eventHandler = reelDocument.editingProxyMap.owner;

                return reelDocument.addOwnedObjectEventListener(targetProxy, type, eventHandler, useCapture).then(function (listener) {
                    return reelDocument.undo().then(function (removedListener) {
                        expect(removedListener).toBe(listener);
                        expect(targetProxy.listeners.indexOf(removedListener) === -1).toBeTruthy();
                    });
                });



            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

});
