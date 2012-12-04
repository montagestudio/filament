var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    workbench: {
        value: null
    },

    editingDocument: {
        value: null
    },

    prototypes: {
        value: require("core/components.js").components
    },

    _environmentBridge: {
        value: null
    },

    environmentBridge: {
        get: function () {
            return this._environmentBridge;
        },
        set: function (value) {
            if (value === this._environmentBridge) {
                return;
            }

            if (this._environmentBridge) {
                this._environmentBridge.mainComponentDidExitEnvironment(this);
            }

            this._environmentBridge = value;

            if (this._environmentBridge) {
                this._environmentBridge.mainComponentDidEnterEnvironment(this);
            }
        }
    },

    didCreate: {
        value: function () {
            var self = this;
            if (IS_IN_LUMIERES) {
                require.async("core/lumieres-bridge").then(function (exported) {
                    self.environmentBridge = exported.LumiereBridge.create();
                    self.awaitEditor();
                });
            } else {
                require.async("core/browser-bridge").then(function (exported) {
                    self.environmentBridge = exported.BrowserBridge.create();
                    self.awaitEditor();
                });
            }
        }
    },

    awaitEditor: {
        value: function () {
            this.addEventListener("canLoadReel", this);
        }
    },

    handleCanLoadReel: {
        value: function () {
            this.load();
        }
    },

    load: {
        value: function () {
            var reelInfo = this.environmentBridge.reelUrlInfo,
                reelUrl = reelInfo.reelUrl,
                packageUrl = reelInfo.packageUrl,
                self = this;

            this.workbench.load(reelUrl, packageUrl).then(function (editingDocument) {
                self.editingDocument = editingDocument;
            });
        }
    },

    handleSave: {
        value: function (evt) {
            this.save(evt.detail.url);
        }
    },

    save: {
        value: function (url) {

            if (!this.environmentBridge) {
                throw "Cannot save '" + url + "' without an environment bridge";
            }

            this.environmentBridge.save(this.editingDocument, url);
        }
    },



    prepareForDraw: {
        value: function () {
            this.addEventListener("addComponent", this, false);
            document.addEventListener("save", this, false);

            this.addPropertyChangeListener("documentTitle", this, false);
        }
    },

    handleChange: {
        value: function (notification) {
            console.log("notification", notification);
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            document.title = this.documentTitle;

            if (this.palettesVisible) {
                this.element.classList.remove("palettes-hidden");
            } else {
                this.element.classList.add("palettes-hidden");
            }
            //TODO indicate whether or not we have a currentProject open
        }
    },

    documentTitle: {
        dependencies: ["editingDocument.title"],
        get: function () {

            if (!this.editingDocument) {
                return "Lumiere";
            }

            return this.editingDocument.title;
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
                prototypeEntry.serialization.prototype,
                prototypeEntry.name,
                prototypeEntry.html,
                prototypeEntry.serialization.properties,
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
