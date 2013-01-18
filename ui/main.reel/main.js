var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    ProjectController = require("core/project-controller.js").ProjectController,
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor,
    List = require("montage/collections/list");

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    projectController: {
        value: null
    },

    componentEditorArea: {
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

            this.reelLoadQueue = new List();
            this.componentEditorMap = {};
            this.editorsToInsert = [];

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

    handleAddComponent: {
        value: function (evt) {
            var editor;

            if (this.currentReelUrl && (editor = this.componentEditorMap[this.currentReelUrl])) {
                editor.addComponent(evt.detail.prototypeObject);
            }
        }
    },

    reelLoadQueue: {
        enumerable: false,
        value: null
    },

    componentEditorMap: {
        enumerable: false,
        value: null
    },

    editorsToInsert: {
        enumerable: false,
        value: null
    },

    _currentReelUrl: {
        value: null
    },

    currentReelUrl: {
        enumerable: false,
        get: function () {
            return this._currentReelUrl;
        },
        set: function (value) {
            if (value === this._currentReelUrl) {
                return;
            }

            this._currentReelUrl = value;
            this.needsDraw = true;
        }
    },

    handleOpenComponent: {
        enumerable: false,
        value: function (evt) {
            var reelUrl = "fs:/" + evt.detail.componentUrl,
                editor,
                self;

            this.currentReelUrl = reelUrl;

            if (this.currentEditor && reelUrl === this.currentEditor.reelUrl) {
                return;
            }

            editor = this.componentEditorMap[reelUrl];

            if (editor) {
                self = this;
                this.projectController.openComponent(reelUrl, editor).done();
            } else if (!this.reelLoadQueue.has(reelUrl)) {
                this.reelLoadQueue.push(reelUrl);

                editor = ComponentEditor.create();
                this.editorsToInsert.push(editor);
                editor.addEventListener("firstDraw", this, false);
                this.needsDraw = true;
            }

        }
    },

    handleFirstDraw: {
        enumerable: false,
        value: function (evt) {
            var editor = evt.target,
                reelUrl = this.reelLoadQueue.pop();

            editor.removeEventListener("firstDraw", this, false);
            this.componentEditorMap[reelUrl] = editor;
            this.projectController.openComponent(reelUrl, editor).done();
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

            var editorArea,
                element,
                self,
                reelUrls,
                editor;

            if (this.editorsToInsert.length) {
                editorArea = this.componentEditorArea;

                //TODO do this in a fragment if possible
                this.editorsToInsert.forEach(function (editor) {
                    element = document.createElement("div");
                    element.classList.add("standby");
                    editor.element = element;
                    editorArea.appendChild(element);
                    editor.attachToParentComponent();
                    editor.needsDraw = true;
                });
                this.editorsToInsert = [];
            }

            //TODO optimize this entire draw method
            self = this;
            reelUrls = Object.keys(this.componentEditorMap);

            reelUrls.forEach(function (reelUrl) {
                editor = self.componentEditorMap[reelUrl];

                if (editor.element && reelUrl === self.currentReelUrl) {
                    editor.element.classList.remove("standby");
                } else if (editor.element) {
                    editor.element.classList.add("standby");
                }
            });
        }
    }
});
