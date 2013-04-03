var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Deserializer = require("montage/core/serialization").Deserializer,
    ReelDocument = require("core/reel-document").ReelDocument,
    MimeTypes = require("core/mime-types"),
    Promise = require("montage/core/promise").Promise;

exports.DocumentEditor = Montage.create(Component, {

    workbench: {
        enumerable: false,
        value: null
    },

    viewController: {
        value: null
    },

    acceptsActiveTarget: {
        value: true
    },

    editingDocument: {
        value: null
    },

    fileUrl: {
        value: null
    },

    _deferredWorkbench: {
        value: null
    },

    didCreate: {
        value: function () {
            this.defineBinding("fileUrl", {"<-": "editingDocument.fileUrl"});
            this._deferredWorkbench = Promise.defer();

            this.addRangeAtPathChangeListener("editingDocument.selectedObjects", this, "handleSelectedObjectsRangeChange");
        }
    },

    load: {
        value: function (document) {
            var self = this,
                liveStageInfoPromise,
                editingDocumentPromise,
                moduleId,
                exportName;

            // pre-load blueprints for everything already in the template
            // but don't complain if we can't find one
            document.editingProxies.forEach(function (proxy) {
                moduleId = proxy.moduleId;
                exportName = proxy.exportName;
                if (moduleId && exportName) {
                    document.packageRequire.async(moduleId).get(exportName).get("blueprint").fail(Function.noop);
                }
            });

            self.editingDocument = document;
            document.editor = self;

            return this._deferredWorkbench.promise.then(function(workbench) {
                return workbench.load(document.fileUrl, document.packageRequire.location);
            }).then(function (liveStageInfo) {
                document.associateWithLiveRepresentations(liveStageInfo.owner, liveStageInfo.template, liveStageInfo.frame);
            });
        }
    },

    prepareForDraw: {
        value: function () {
            this._deferredWorkbench.resolve(this.workbench);

            //TODO it was weird that the workbench component emitted DOM events
            this.workbench.addEventListener("dragover", this, false);
            this.workbench.addEventListener("drop", this, false);
            this.workbench.addEventListener("select", this, false);
        }
    },

    addLibraryItem: {
        value: function (libraryItem, parentProxy) {

            if (!this.editingDocument) {
                throw new Error("Cannot add component: no editing document");
            }
            if (!libraryItem) {
                throw new Error("Cannot add component: no prototypeEntry");
            }

            if (libraryItem.html) {
                return this.addComponent(libraryItem, parentProxy);
            } else {
                return this.addObject(libraryItem);
            }
        }
    },

    addObject: {
        enumerable: false,
        value: function (prototypeEntry) {
            return this.editingDocument.addObject(null, prototypeEntry.serialization);
        }
    },

    //TODO Can we get get rid of the editing API being here, on a component and instead always rely on the editingDocument
    addComponent: {
        enumerable: false,
        value: function (prototypeEntry, parentProxy) {

            var editingDocument = this.editingDocument;

            return editingDocument.addComponent(
                null,
                prototypeEntry.serialization,
                prototypeEntry.html,
                undefined, // elementMontageId
                undefined, // identifier
                parentProxy
            ).then(function (proxy) {

                // try to pre-fetch the description of this object
                if (proxy.stageObject) {
                    proxy.stageObject.blueprint.fail(Function.noop);
                }

                if (typeof prototypeEntry.postProcess === "function") {
                    prototypeEntry.postProcess(proxy, editingDocument);
                }

                return proxy;
            });
        }
    },

    handleSelectedObjectsRangeChange: {
        value: function (plus, minus, index) {
            var self = this;
            var selectedObjects = this.getPath("editingDocument.selectedObjects");
            if (selectedObjects && selectedObjects.length === 1) {
                var selectedObject = selectedObjects[0];
                var inspectors = this.viewController.contextualInspectorsForObject(selectedObject);

                Promise.all(inspectors.map(function (component) {
                    var inspector = component.create();
                    inspector.object = selectedObject;
                    inspector.documentEditor = self;
                    return inspector;
                })).then(function (inspectors) {
                    self.contextualInspectors = inspectors;
                }).done();

                if (!selectedObject.parentProxy) {
                    return;
                }

                // TODO make a loop
                var parentObject = selectedObject.parentProxy;
                var parentInspectors = this.viewController.contextualInspectorsForObject(parentObject).filter(function (inspector) {
                    return inspector.showForChildComponents;
                });
                Promise.all(parentInspectors.map(function (component) {
                    var inspector = component.create();
                    inspector.object = parentObject;
                    inspector.documentEditor = self;
                    inspector.selectedObject = selectedObject;
                    return inspector;
                })).then(function (inspectors) {
                    self.contextualInspectors.push.apply(self.contextualInspectors, inspectors);
                }).done();

            } else {
                if (this.contextualInspectors) {
                    this.contextualInspectors.clear();
                }
            }
        }
    },

    handleSelect: {
        value: function (evt) {
            var detail = evt.detail,
                selectionCandidate = detail.candidate,
                isAddingToSelection = detail.addingToSelection,
                isRemovingFromSelection = detail.removingFromSelection,
                editingDocument = this.editingDocument;

            selectionCandidate = editingDocument.updateSelectionCandidate(selectionCandidate);

            if (selectionCandidate) {
                if (isAddingToSelection) {
                    editingDocument.selectObject(selectionCandidate);
                } else if (isRemovingFromSelection) {
                    editingDocument.deselectObject(selectionCandidate);
                } else {
                    editingDocument.clearSelectedObjects();
                    editingDocument.selectObject(selectionCandidate);
                }
            } else {
                editingDocument.clearSelectedObjects();
            }
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },
    handleDrop: {
        enumerable: false,
        value: function (event) {
            var self = this,
                // TODO: security issues?
                data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                deserializer = Deserializer.create().init(data, require);

            deserializer.deserialize().then(function (prototypeEntry) {
                self.addLibraryItem(prototypeEntry).done();
            }).done();
        }
    }

});
