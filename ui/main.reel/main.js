var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Connection = require("q-connection");

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    prototypes: {
        value: require("core/components.js").components
    },

    currentProject: {
        value: null
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
                this._environmentBridge.didExitEnvironment(this);
            }

            this._environmentBridge = value;

            if (this._environmentBridge) {
                this._environmentBridge.didEnterEnvironment(this);
                this.currentProject = this._environmentBridge.project;
            }
        }
    },

    didCreate: {
        value: function () {
            var self = this;
            if (IS_IN_LUMIERES) {
                require.async("core/lumieres-bridge").then(function (exported) {
                    self.environmentBridge = exported.LumiereBridge.create();
                });
            } else {
                require.async("core/browser-bridge").then(function (exported) {
                    self.environmentBridge = exported.BrowserBridge.create();
                });
            }
        }
    },

    handleSave: {
        value: function (evt) {
            this.save(evt.detail.url);
        }
    },

    save: {
        value: function (location) {
            var template = this.workbench.template;
            this.currentProject.template = template;
            this.environmentBridge.save(template, location);
        }
    },

    workbench: {
        value: null
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
        dependencies: ["currentProject.title", "currentProject.reelUrl", "currentProject.packageLocation"],
        get: function () {

            if (!this.currentProject) {
                return "Lumiere";
            }

            var proj = this.currentProject;
            return proj.title + " - " + proj.reelUrl.replace(proj.packageLocation, "").replace(/[^\/]+\//, "");
        }
    },

    handleAddComponent: {
        value: function (evt) {

            if (!this.currentProject) {
                return;
            }

            var prototypeEntry = evt.detail.prototypeObject;

            if (!prototypeEntry) {
                throw "cannot add component without more information";
            }

            this.workbench.addComponent(
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
    editorComponent: {
        value: null
    },

    handleEnterEditor: {
        value: function (event) {
            this.editorComponent = event.detail.component;
            this.palettesVisible = false;
            this._isUsingEditor = true;
        }
    }

});
