var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    ProjectController = require("core/project-controller.js").ProjectController,
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor;
    WeakMap = require("montage/collections/weak-map");

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    projectController: {
        value: null
    },

    _bridgePromise: {
        value: null
    },

    didCreate: {
        value: function () {
            if (IS_IN_LUMIERES) {
                this._bridgePromise = require.async("core/lumieres-bridge").then(function (exported) {
                    return Promise.resolve(exported.LumiereBridge.create());
                });
            } else {
                this._bridgePromise = require.async("core/browser-bridge").then(function (exported) {
                    return Promise.resolve(exported.BrowserBridge.create());
                });
            }
        }
    },

    prepareForDraw: {
        value: function () {

            var self = this;

            this.componentEditorMap = new WeakMap();

            this._bridgePromise.then(function (environmentBridge) {
                self.projectController = ProjectController.create().initWithEnvironmentBridge(environmentBridge);
                self.projectController.addEventListener("canLoadProject", self, false);
                self.projectController.addEventListener("didOpenPackage", self, false);

                window.addEventListener("didBecomeKey", function () {
                    self.projectController.didBecomeKey();
                });

                window.addEventListener("didResignKey", function () {
                    self.projectController.didResignKey();
                });

                window.addEventListener("openRelatedFile", function (evt) {
                    self.projectController.openRelatedFile(evt.detail);
                });

                window.addEventListener("beforeunload", function () {
                    self.projectController.willCloseProject();
                }, true);

                self.application.addEventListener("menuAction", self, false);

            }).done();
        }
    },

    handleCanLoadProject: {
        enumerable: false,
        value: function () {
            var projectUrl = this.projectController.projectUrl;

            if (projectUrl) {
                this.projectController.loadProject(projectUrl);
            } else {
                this.projectController.createApplication();
            }
        }
    },

    handleDidOpenPackage: {
        enumerable: false,
        value: function () {
            this.addPropertyChangeListener("windowTitle", this, false);

            document.addEventListener("save", this, false);

            var app = document.application;
            app.addEventListener("openComponent", this);
            app.addEventListener("addFile", this);
            app.addEventListener("installDependencies", this);

            // Update title
            // TODO this should be unnecessary as the packageUrl has been changed...
            this.needsDraw = true;
        }
    },

    componentEditorReelUrl: {
        value: null
    },

    componentEditorMap: {
        enumerable: false,
        value: null
    },

    handleOpenComponent: {
        enumerable: false,
        value: function (evt) {

            var substitution = this.templateObjects.componentEditorSubstitution,
                switchComponents = substitution.switchComponents,
                reelUrl = "fs:/" + evt.detail.componentUrl,
                editor = switchComponents[reelUrl];

            if (!editor) {
                editor = ComponentEditor.create();
                switchComponents[reelUrl] = editor;
                this.componentEditorMap.set(editor, {reelUrl: reelUrl, hasDrawn: false});
            }

            //Trigger switching to the editor to the substitution
            //TODO do this elsewhere offscreen and then have the substitution adopt the realized editor
            this.componentEditorReelUrl = reelUrl;
        }
    },

    slotDidSwitchContent: {
        enumerable: false,
        value: function (slot, newContent) {

            if (!newContent) {
                return;
            }

            newContent.controller.addEventListener("firstDraw", this, false);
        }
    },

    handleFirstDraw: {
        enumerable: false,
        value: function (evt) {
            var editor = evt.target,
                editorEntry = this.componentEditorMap.get(editor),
                reelUrl,
                hasDrawn;

            if (editorEntry) {
                reelUrl = editorEntry.reelUrl;
                hasDrawn = editorEntry.hasDrawn;

                if (!hasDrawn) {
                    this.projectController.openComponent(reelUrl, editor).then(function () {
                        //TODO guard against using the same editor to open multiple times?
                        editorEntry.hasDrawn = true;
                    }).done();
                }

                evt.target.removeEventListener("firstDraw", this);
            }

        }
    },

    handleAddFile: {
        enumerable: false,
        value: function () {
            //TODO don't call addComponent until we know it's a component we want
            this.projectController.createComponent();
        }
    },

    handleInstallDependencies: {
        enumerable: false,
        value: function () {
            this.projectController.installDependencies();
        }
    },

    handleSave: {
        enumerable: false,
        value: function (evt) {
            this.projectController.save(evt.detail.url);
        }
    },

    handleChange: {
        enumerable: false,
        value: function (notification) {
            if ("windowTitle" === notification.currentPropertyPath) {
                this.needsDraw = true;
            }
        }
    },

    handleMenuAction: {
        enumerable: false,
        value: function (evt) {
            if ("newComponent" === evt.detail.identifier) {
                this.projectController.createComponent();
            }
        }
    },

    windowTitle: {
        dependencies: ["packageUrl", "projectController.currentDocument.title"],
        get: function () {

            var projectTitle,
                packageUrl = this.projectController ? this.projectController.packageUrl : null,
                currentDocument = this.projectController ? this.projectController.currentDocument : null;

            if (packageUrl) {
                projectTitle = packageUrl.substring(packageUrl.lastIndexOf("/") + 1);
            }

            if (currentDocument) {
                projectTitle = currentDocument.title + " — " + projectTitle;
            }

            return projectTitle;
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

    handleTogglePaletteKeyPress: {
        enumerable: false,
        value: function () {
            this.palettesVisible = !this.palettesVisible;
        }
    },

    handleExitEditorKeyPress: {
        enumerable: false,
        value: function () {
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
        enumerable: false,
        value: function (event) {
            this.extendedEditorComponent = event.detail.component;
            this.palettesVisible = false;
            this._isUsingEditor = true;
        }
    },

    draw: {
        value: function () {
            if (this.windowTitle) {
                document.title = this.windowTitle;
            }

            if (this.palettesVisible) {
                this.element.classList.remove("palettes-hidden");
            } else {
                this.element.classList.add("palettes-hidden");
            }
        }
    }
});
