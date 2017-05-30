var Template = require("montage/core/template").Template,
    mockReelDocument = require("mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

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
                    },
                    {
                        "type": "barEvent",
                        "listener": {"@": "actionEventListener"}
                    }
                ]
            },
            "actionEventListener": {
                "prototype": "core/actionEventListener",
                "properties": {
                    "handler": {"@": "owner"},
                    "action": "doSomething"
                }
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

    describe("involving an actionEventListener", function () {

        var type, useCapture, methodName;

        beforeEach(function () {
            type = "someEvent";
            useCapture = false;
            methodName = "doThatThing";
        });

        describe("creating a listener that needs an actionEventListener", function () {

            it ("should add an implicit actionEventListener to call the specified method on the intended listener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;

                    return reelDocument.addOwnedObjectEventListener(targetProxy, type, intendedHandler, useCapture, methodName).then(function (listener) {
                        expect(listener.listener).not.toBe(intendedHandler);
                        expect(listener.listener.properties.get("handler")).toBe(intendedHandler);
                        expect(listener.listener.properties.get("action")).toBe(methodName);
                        expect(listener.listener.editorMetadata.get("isHidden")).toBeTruthy();
                        expect(listener.useCapture).toBe(useCapture);
                        expect(listener.type).toBe(type);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should register a single undoable operation for the adding an a listener with an implicit actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;

                    return reelDocument.addOwnedObjectEventListener(targetProxy, type, intendedHandler, useCapture, methodName).then(function () {
                        expect(reelDocument.undoManager.undoCount).toBe(1);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should undo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;

                    return reelDocument.addOwnedObjectEventListener(targetProxy, type, intendedHandler, useCapture, methodName).then(function (listenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            expect(reelDocument.undoManager.undoCount).toBe(0);
                            expect(reelDocument.undoManager.redoCount).toBe(1);
                            expect(reelDocument.editingProxies.indexOf(listenerEntry.listener)).toBe(-1);
                        });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should redo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;

                    return reelDocument.addOwnedObjectEventListener(targetProxy, type, intendedHandler, useCapture, methodName).then(function (listenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            return reelDocument.undoManager.redo();
                        }).then(function () {
                                expect(reelDocument.undoManager.undoCount).toBe(1);
                                expect(reelDocument.undoManager.redoCount).toBe(0);
                                expect(targetProxy.listeners.indexOf(listenerEntry)).not.toBe(-1);
                                expect(reelDocument.editingProxies.indexOf(listenerEntry.listener)).not.toBe(-1);
                            });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

        describe("updating a listener that uses an actionEventListener", function () {

            it ("should update the actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = listenerEntry.listener.properties.get("action") + "FOO";

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        expect(updatedListenerEntry).toBe(listenerEntry);
                        expect(updatedListenerEntry.listener).not.toBe(newHandler);
                        expect(updatedListenerEntry.listener.properties.get("handler")).toBe(newHandler);
                        expect(updatedListenerEntry.listener.properties.get("action")).toBe(newMethodName);
                        expect(updatedListenerEntry.useCapture).toBe(newUseCapture);
                        expect(updatedListenerEntry.type).toBe(newType);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should register a single undoable operation for updating the listenerEntry and the associated actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = listenerEntry.listener.properties.get("action") + "FOO";

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        expect(reelDocument.undoManager.undoCount).toBe(1);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should undo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    var originalHandler = listenerEntry.listener.properties.get("handler");
                    var originalType = listenerEntry.type;
                    var originalUseCapture = listenerEntry.useCapture;
                    var originalMethodName = listenerEntry.listener.properties.get("action");

                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = listenerEntry.listener.properties.get("action") + "FOO";

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            expect(reelDocument.undoManager.undoCount).toBe(0);
                            expect(reelDocument.undoManager.redoCount).toBe(1);
                            expect(updatedListenerEntry).toBe(listenerEntry);
                            expect(updatedListenerEntry.listener.properties.get("handler")).toBe(originalHandler);
                            expect(updatedListenerEntry.listener.properties.get("action")).toBe(originalMethodName);
                            expect(updatedListenerEntry.type).toBe(originalType);
                            expect(updatedListenerEntry.useCapture).toBe(originalUseCapture);
                        });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should redo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = listenerEntry.listener.properties.get("action") + "FOO";

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            return reelDocument.undoManager.redo();
                        }).then(function () {
                                expect(reelDocument.undoManager.undoCount).toBe(1);
                                expect(reelDocument.undoManager.redoCount).toBe(0);
                                expect(updatedListenerEntry).toBe(listenerEntry);
                                expect(updatedListenerEntry.listener.properties.get("handler")).toBe(newHandler);
                                expect(updatedListenerEntry.listener.properties.get("action")).toBe(newMethodName);
                                expect(updatedListenerEntry.type).toBe(newType);
                                expect(updatedListenerEntry.useCapture).toBe(newUseCapture);
                            });
                    });

                }).timeout(WAITSFOR_TIMEOUT);

            });
        });

        describe("removing a listener that uses an actionEventListener", function () {

            it ("should remove listener entry and the associated actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    return reelDocument.removeOwnedObjectEventListener(targetProxy, listenerEntry).then(function (removedListenerEntry) {
                        expect(removedListenerEntry).toBe(listenerEntry);
                        expect(targetProxy.listeners.indexOf(removedListenerEntry)).toBe(-1);
                        expect(reelDocument.editingProxyMap.actionEventListener).toBeFalsy();
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should register a single undoable operation for the removal the listenerEntry and the associated actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    return reelDocument.removeOwnedObjectEventListener(targetProxy, listenerEntry).then(function (removedListenerEntry) {
                        expect(reelDocument.undoManager.undoCount).toBe(1);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should undo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    return reelDocument.removeOwnedObjectEventListener(targetProxy, listenerEntry).then(function (removedListenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            expect(reelDocument.undoManager.undoCount).toBe(0);
                            expect(reelDocument.undoManager.redoCount).toBe(1);
                            expect(targetProxy.listeners[1]).toBe(listenerEntry);
                            expect(reelDocument.editingProxies.indexOf(listenerEntry.listener)).not.toBe(-1);
                        });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should redo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    return reelDocument.removeOwnedObjectEventListener(targetProxy, listenerEntry).then(function (removedListenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            return reelDocument.undoManager.redo();
                        }).then(function () {
                            expect(reelDocument.undoManager.undoCount).toBe(1);
                            expect(reelDocument.undoManager.redoCount).toBe(0);
                            expect(targetProxy.listeners.indexOf(listenerEntry)).toBe(-1);
                            expect(reelDocument.editingProxies.indexOf(listenerEntry.listener)).toBe(-1);
                        });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

        describe("promoting a listener to use an actionEventListener", function () {

            it ("should add an implicit actionEventListener to call the specified method on the intended listener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;
                    var listenerEntry = targetProxy.listeners[0];

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, type, intendedHandler, useCapture, methodName).then(function (updatedListenerEntry) {
                        expect(updatedListenerEntry).toBe(listenerEntry);
                        expect(updatedListenerEntry.listener).not.toBe(intendedHandler);
                        expect(updatedListenerEntry.listener.properties.get("handler")).toBe(intendedHandler);
                        expect(updatedListenerEntry.listener.properties.get("action")).toBe(methodName);
                        expect(updatedListenerEntry.listener.editorMetadata.get("isHidden")).toBeTruthy();
                        expect(updatedListenerEntry.useCapture).toBe(useCapture);
                        expect(updatedListenerEntry.type).toBe(type);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should register a single undoable operation for the updating of the listenerEntry and creation of the associated actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;
                    var listenerEntry = targetProxy.listeners[0];

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, type, intendedHandler, useCapture, methodName).then(function (updatedListenerEntry) {
                        expect(reelDocument.undoManager.undoCount).toBe(1);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should undo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;
                    var listenerEntry = targetProxy.listeners[0];

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, type, intendedHandler, useCapture, methodName).then(function (updatedListenerEntry) {
                        var implicitListener = updatedListenerEntry.listener;
                        return reelDocument.undoManager.undo().then(function () {
                            expect(reelDocument.undoManager.undoCount).toBe(0);
                            expect(reelDocument.undoManager.redoCount).toBe(1);
                            expect(updatedListenerEntry).toBe(listenerEntry);
                            expect(updatedListenerEntry.listener).toBe(intendedHandler);
                            expect(reelDocument.editingProxies.indexOf(implicitListener)).toBe(-1);
                        });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should redo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var intendedHandler = reelDocument.editingProxyMap.owner;
                    var listenerEntry = targetProxy.listeners[0];

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, type, intendedHandler, useCapture, methodName).then(function (updatedListenerEntry) {
                        var implicitListener = updatedListenerEntry.listener;
                        return reelDocument.undoManager.undo().then(function () {
                            return reelDocument.undoManager.redo();
                        }).then(function () {
                                expect(reelDocument.undoManager.undoCount).toBe(1);
                                expect(reelDocument.undoManager.redoCount).toBe(0);
                                expect(updatedListenerEntry).toBe(listenerEntry);
                                expect(updatedListenerEntry.listener).toBe(implicitListener);
                                expect(targetProxy.listeners.indexOf(listenerEntry)).not.toBe(-1);
                                expect(reelDocument.editingProxies.indexOf(listenerEntry.listener)).not.toBe(-1);
                            });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

        describe("demoting a listener to no longer use an actionEventListener", function () {

            it ("should remove the associated actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = void 0;

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        expect(updatedListenerEntry).toBe(listenerEntry);
                        expect(updatedListenerEntry.listener).toBe(newHandler);
                        expect(updatedListenerEntry.useCapture).toBe(newUseCapture);
                        expect(updatedListenerEntry.type).toBe(newType);
                        expect(reelDocument.editingProxyMap.actionEventListener).toBeFalsy();
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should register a single undoable operation for the updating of the listenerEntry and the removal of the associated actionEventListener", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];

                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = void 0;

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        expect(reelDocument.undoManager.undoCount).toBe(1);
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should undo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];
                    var implicitListener = listenerEntry.listener;

                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = void 0;

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            expect(reelDocument.undoManager.undoCount).toBe(0);
                            expect(reelDocument.undoManager.redoCount).toBe(1);
                            expect(updatedListenerEntry).toBe(listenerEntry);
                            expect(updatedListenerEntry.listener).toBe(implicitListener);
                            expect(reelDocument.editingProxies.indexOf(implicitListener)).not.toBe(-1);
                        });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

            it ("should redo properly", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    var targetProxy = reelDocument.editingProxyMap.foo;
                    var listenerEntry = targetProxy.listeners[1];
                    var implicitListener = listenerEntry.listener;


                    var newHandler = reelDocument.editingProxyMap.foo;
                    var newType = listenerEntry.type + "FOO";
                    var newUseCapture = !listenerEntry.useCapture;
                    var newMethodName = void 0;

                    return reelDocument.updateOwnedObjectEventListener(targetProxy, listenerEntry, newType, newHandler, newUseCapture, newMethodName).then(function (updatedListenerEntry) {
                        return reelDocument.undoManager.undo().then(function () {
                            return reelDocument.undoManager.redo();
                        }).then(function () {
                                expect(reelDocument.undoManager.undoCount).toBe(1);
                                expect(reelDocument.undoManager.redoCount).toBe(0);
                                expect(updatedListenerEntry).toBe(listenerEntry);
                                expect(updatedListenerEntry.listener).toBe(newHandler);
                                expect(reelDocument.editingProxies.indexOf(implicitListener)).toBe(-1);
                            });
                    });

                }).timeout(WAITSFOR_TIMEOUT);
            });

        });

    });

});
