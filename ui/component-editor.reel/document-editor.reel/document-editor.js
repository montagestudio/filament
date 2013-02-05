var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Deserializer = require("montage/core/deserializer").Deserializer,
    MimeTypes = require("core/mime-types");

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

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this,
                blueprintPromise,
                stageObject;

            Object.defineBinding(self, "fileUrl", {
                boundObject: self,
                boundObjectPropertyPath: "editingDocument.fileUrl",
                oneway: true
            });

            return this.workbench.load(fileUrl, packageUrl).then(function (editingDocument) {
                self.editingDocument = editingDocument;

                editingDocument.editingProxies.forEach(function (proxy) {
                    stageObject = proxy.stageObject;
                    blueprintPromise = stageObject.blueprint;
                    if (blueprintPromise) {
                        blueprintPromise.fail(Function.noop);
                    }
                });

                return editingDocument;
            });
        }
    },

    prepareForDraw: {
        value: function () {
            this.workbench.addEventListener("dragover", this, false);
            this.workbench.addEventListener("drop", this, false);
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
