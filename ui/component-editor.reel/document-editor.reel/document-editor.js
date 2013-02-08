var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Deserializer = require("montage/core/deserializer").Deserializer,
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

    didCreate: {
        value: function () {
            Object.defineBinding(this, "fileUrl", {
                boundObject: this,
                boundObjectPropertyPath: "editingDocument.fileUrl",
                oneway: true
            });
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this,
                liveStageInfoPromise = this.workbench.load(fileUrl, packageUrl),
                editingDocumentPromise,
                moduleId,
                exportName;


            editingDocumentPromise = require.loadPackage(packageUrl)
                .then(function (packageRequire) {
                    return ReelDocument.load(fileUrl, packageRequire)
                        .then(function (reelDocument) {

                            // pre-load blueprints for everything already on the stage
                            // but don't complain if we can't find one
                            reelDocument.editingProxies.forEach(function (proxy) {
                                moduleId = proxy.moduleId;
                                exportName = proxy.exportName;
                                if (moduleId && exportName) {
                                    packageRequire.async(moduleId).get(exportName).get("blueprint").fail(Function.noop);
                                }
                            });

                            return reelDocument;
                        });
                });

            //Wait for the stage and the editingDocument: only return the editingDocument
            return Promise.all([liveStageInfoPromise, editingDocumentPromise]).spread(function (liveStageInfo, editingDocument) {
                editingDocument.associateWithLiveRepresentations(liveStageInfo.owner, liveStageInfo.template, liveStageInfo.frame);
                self.editingDocument = editingDocument;
                return editingDocument;
            }).timeout(10000);
        }
    },

    prepareForDraw: {
        value: function () {
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

            if (selectionCandidate) {

                selectionCandidate = editingDocument.editingProxyForObject(selectionCandidate);

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
                deserializer = Deserializer.create().initWithString(data, "dropped prototype object");

            deserializer.deserialize(function (prototypeEntry) {
                self.addLibraryItem(prototypeEntry);
            });
        }
    }

});
