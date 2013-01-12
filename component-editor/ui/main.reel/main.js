var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Deserializer = require("montage/core/deserializer").Deserializer,
    MimeTypes = require("core/mime-types");

exports.Main = Montage.create(Component, {

    workbench: {
        value: null
    },

    editingDocument: {
        value: null
    },

    libraryItems: {
        value: null
    },

    load: {
        value: function (reelUrl, packageUrl) {
            var self = this,
                stageObject,
                descriptionPromise;

            return this.workbench.load(reelUrl, packageUrl).then(function (editingDocument) {
                self.editingDocument = editingDocument;

                editingDocument.editingProxies.forEach(function (proxy) {
                    stageObject = proxy.stageObject;
                    descriptionPromise = stageObject.description;
                    if (descriptionPromise) {
                        descriptionPromise.fail(Function.noop);
                    }
                });

                return editingDocument;
            });
        }
    },

    prepareForDraw: {
        value: function () {
            this.addEventListener("addComponent", this, false);

            this.workbench.addEventListener("dragover", this, false);
            this.workbench.addEventListener("drop", this, false);
        }
    },

    draw: {
        value: function () {
            if (this.palettesVisible) {
                this.element.classList.remove("palettes-hidden");
            } else {
                this.element.classList.add("palettes-hidden");
            }
            //TODO indicate whether or not we have a currentProject open
        }
    },

    addComponent: {
        value: function(prototypeEntry) {
            if (!this.editingDocument) {
                throw new Error("Cannot add component: no editing document");
            }
            if (!prototypeEntry) {
                throw new Error("Cannot add component: no prototypeEntry");
            }

            var editingDocument = this.editingDocument;

            return editingDocument.addComponent(
                null,
                prototypeEntry.serialization,
                prototypeEntry.html
            ).then(function (proxy) {

                // pre-fetch the description of this object
                proxy.stageObject.description.fail(Function.noop);

                if (typeof prototypeEntry.postProcess === "function") {
                    prototypeEntry.postProcess(proxy, editingDocument);
                }
            }).done();
        }
    },

    handleAddComponent: {
        value: function (evt) {
            if (!this.editingDocument) {
                return;
            }

            this.addComponent(evt.detail.prototypeObject);
        }
    },

    handleWorkbenchDragover: {
        value: function(event) {
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
        value: function(event) {
            var self = this;

            // TODO: security issues?
            var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                deserializer = Deserializer.create().initWithString(data, "dropped prototype object");

            deserializer.deserialize(function(prototypeEntry) {
                self.addComponent(prototypeEntry);
            });
        }
    },

    handleTogglePaletteKeyPress: {
        value: function (evt) {
            this.palettesVisible = !this.palettesVisible;
        }
    },

    _palettesVisible: {
        value: true
    },

    palettesVisible: {
        get: function () {
            return this._palettesVisible;
        },
        set: function (value) {
            if (value === this._palettesVisible) {
                return;
            }

            this._palettesVisible = value;
            this.needsDraw = true;
        }
    },

    handleExitEditorKeyPress: {
        value: function (evt) {
            this.editorComponent = null;
            this.palettesVisible = true;
            this._isUsingEditor = true;
        }
    },

    _isUsingEditor: {
        value: false
    },

    isUsingEditor: {
        get: function () {
            return this._isUsingEditor;
        }
    },

    /**
        The component to show in the slot that will edit the selected component
     */
    extendedEditorComponent: {
        value: null
    },

    handleEnterEditor: {
        value: function (event) {
            this.extendedEditorComponent = event.detail.component;
            this.palettesVisible = false;
            this._isUsingEditor = true;
        }
    }

});
