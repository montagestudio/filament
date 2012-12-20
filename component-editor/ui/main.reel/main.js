var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

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
            var self = this;
            return this.workbench.load(reelUrl, packageUrl).then(function (editingDocument) {
                self.editingDocument = editingDocument;
                return editingDocument;
            });
        }
    },

    prepareForDraw: {
        value: function () {
            this.addEventListener("addComponent", this, false);
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

    handleAddComponent: {
        value: function (evt) {

            if (!this.editingDocument) {
                return;
            }

            var prototypeEntry = evt.detail.prototypeObject;

            if (!prototypeEntry) {
                throw "cannot add component without more information";
            }

            this.editingDocument.addComponent(
                prototypeEntry.moduleId,
                prototypeEntry.name,
                prototypeEntry.html,
                prototypeEntry.properties,
                prototypeEntry.postProcess
            );
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
