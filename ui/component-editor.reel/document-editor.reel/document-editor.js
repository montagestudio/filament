var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Deserializer = require("montage/core/serialization").Deserializer,
    ReelDocument = require("palette/core/reel-document").ReelDocument,
    MimeTypes = require("core/mime-types"),
    Promise = require("montage/core/promise").Promise;

exports.DocumentEditor = Montage.create(Component, {

    workbench: {
        enumerable: false,
        value: null
    },

    editingDocument: {
        value: null
    },

    fileUrl: {
        value: null
    },

    //TODO centralize selection into the editing document
    selectedObjects: {
        value: null
    },

    _deferredWorkbench: {
        value: null
    },

    didCreate: {
        value: function () {
            this.defineBinding("fileUrl", {"<-": "editingDocument.fileUrl"});
            this._deferredWorkbench = Promise.defer();
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this,
                liveStageInfoPromise,
                editingDocumentPromise,
                moduleId,
                exportName;

            liveStageInfoPromise = this._deferredWorkbench.promise.then(function(workbench) {
                return workbench.load(fileUrl, packageUrl);
            });

            editingDocumentPromise = ReelDocument.load(fileUrl, packageUrl)
                .then(function (reelDocument) {

                    // pre-load blueprints for everything already in the template
                    // but don't complain if we can't find one
                    reelDocument.editingProxies.forEach(function (proxy) {
                        moduleId = proxy.moduleId;
                        exportName = proxy.exportName;
                        if (moduleId && exportName) {
                            reelDocument.packageRequire.async(moduleId).get(exportName).get("blueprint").fail(Function.noop);
                        }
                    });

                    self.editingDocument = reelDocument;
                    return reelDocument;
                });

            // When the stage has loaded, associate it with the editing model
            Promise.all([liveStageInfoPromise, editingDocumentPromise]).spread(function (liveStageInfo, editingDocument) {
                editingDocument.associateWithLiveRepresentations(liveStageInfo.owner, liveStageInfo.template, liveStageInfo.frame);
            }, function (error) {
                //Don't bother associating the two representations if either fails to load
            }).done();

            return editingDocumentPromise;
        }
    },

    prepareForDraw: {
        value: function () {
            this._deferredWorkbench.resolve(this.workbench);

            this.workbench.addEventListener("dragover", this, false);
            this.workbench.addEventListener("drop", this, false);
            this.workbench.addEventListener("select", this, false);
        }
    },

    addLibraryItem: {
        value: function (libraryItem) {

            if (!this.editingDocument) {
                throw new Error("Cannot add component: no editing document");
            }
            if (!libraryItem) {
                throw new Error("Cannot add component: no prototypeEntry");
            }

            if (libraryItem.html) {
                this.addComponent(libraryItem);
            } else {
                this.addObject(libraryItem);
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
        value: function (prototypeEntry) {

            var editingDocument = this.editingDocument;

            return editingDocument.addComponent(
                null,
                prototypeEntry.serialization,
                prototypeEntry.html
            ).then(function (proxy) {

                // pre-fetch the description of this object
                proxy.stageObject.blueprint.fail(Function.noop);

                if (typeof prototypeEntry.postProcess === "function") {
                    prototypeEntry.postProcess(proxy, editingDocument);
                }
            }).done();
        }
    },

    handleSelect: {
        value: function (evt) {
            var detail = evt.detail,
                selectionCandidate = detail.candidate.controller,
                isAddingToSelection = detail.addingToSelection,
                isRemovingFromSelection = detail.removingFromSelection,
                editingDocument = this.editingDocument;

            if (
                selectionCandidate &&
                (selectionCandidate = editingDocument.editingProxyForObject(selectionCandidate))
            ) {
                //TODO make the element associated with the current selection invisible to point events to drill through a tree

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

    handleWorkbenchDragover: {
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
    handleWorkbenchDrop: {
        enumerable: false,
        value: function (event) {
            var self = this,
                // TODO: security issues?
                data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                deserializer = Deserializer.create().initWithSerializationStringAndRequire(data, require);

            deserializer.deserialize().then(function (prototypeEntry) {
                self.addLibraryItem(prototypeEntry);
            }).done();
        }
    }

});
