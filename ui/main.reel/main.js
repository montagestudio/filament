var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    ProjectController = require("core/project-controller.js").ProjectController,
    ViewController = require("core/view-controller.js").ViewController,
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor,
    List = require("montage/collections/list"),
    WeakMap = require("montage/collections/weak-map");

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    projectController: {
        value: null
    },

    viewController: {
        value: null
    },

    editorSlot: {
        value: null
    },

    _projectControllerPromise: {
        value: null
    },

    _currentFileUrl: {
        value: null
    },

    didCreate: {
        value: function () {
            var bridgePromise,
                self = this;

            this._editorsToInsert = [];
            this._fileUrlEditorMap = {};
            this._openEditors = [];

            if (IS_IN_LUMIERES) {
                bridgePromise = require.async("core/lumieres-bridge").then(function (exported) {
                    return Promise.resolve(exported.LumiereBridge.create());
                });
            } else {
                bridgePromise = require.async("core/browser-bridge").then(function (exported) {
                    return Promise.resolve(exported.BrowserBridge.create());
                });
            }

            this.addOwnPropertyChangeListener("projectController.packageUrl", this, false);
            this.addOwnPropertyChangeListener("projectController.currentDocument", this, false);

            this._projectControllerPromise = bridgePromise.then(function (environmentBridge) {
                var projectUrl = environmentBridge.projectUrl;

                self.viewController = ViewController.create();

                // Add ComponentEditor for handling .reel files
                self.viewController.registerEditorTypeForFileTypeMatcher(ComponentEditor, function (fileUrl) {
                    return (/\.reel\/?$/).test(fileUrl);
                });

                return ProjectController.load(environmentBridge, self.viewController).then(function (projectController) {

                    self.projectController = projectController;
                    projectController.addEventListener("didOpenPackage", self, false);

                    self.defineBinding("_currentFileUrl", {
                        "<-": "currentDocument.fileUrl",
                        source: projectController
                    });
                    self.addOwnPropertyChangeListener("_currentFileUrl", self, false);

                    if (projectUrl) {
                        projectController.loadProject(projectUrl).done();
                    } else {
                        projectController.createApplication();
                    }

                    return projectController;
                });
            });

            return this._projectControllerPromise;
        }
    },

    prepareForDraw: {
        value: function () {

            var self = this;

            this.application.addEventListener("asyncActivity", this, false);

            this._projectControllerPromise.then(function (projectController) {

                var app = self.application;

                window.addEventListener("didBecomeKey", function () {
                    self.projectController.didBecomeKey();
                });

                window.addEventListener("didResignKey", function () {
                    self.projectController.didResignKey();
                });

                window.addEventListener("openRelatedFile", function (evt) {
                    var url = evt.detail;
                    self.openFileUrl(url.replace("file://localhost/", "fs://localhost/").replace(/\/$/, "")).done();
                });

                window.addEventListener("beforeunload", function () {
                    self.projectController.willCloseProject();
                }, true);

                window.addEventListener("undo", function (evt) {
                    //TODO stop the event here?
                    evt.stopPropagation();
                    evt.preventDefault();
                    self.projectController.undo();
                }, true);

                window.addEventListener("redo", function (evt) {
                    //TODO stop the event here?
                    evt.stopPropagation();
                    evt.preventDefault();
                    self.projectController.redo();
                }, true);

                app.addEventListener("menuAction", self, false);
                app.addEventListener("menuValidate", self, false);
                app.addEventListener("activateExtension", this);
                app.addEventListener("deactivateExtension", this);

            }).done();
        }
    },

    handleDidOpenPackage: {
        enumerable: false,
        value: function () {
            document.addEventListener("save", this, false);

            var app = document.application;
            app.addEventListener("enterModalEditor", this);
            app.addEventListener("openFile", this);
            app.addEventListener("addFile", this);
            app.addEventListener("closeDocument", this);

            //TODO double check that this works
            var files = this.projectController.files;
            var projectUrl = this.projectController.projectUrl;
            for (var i = 0, len = files.length; i < len; i++) {
                var fileUrl = files[i].fileUrl;
                if (fileUrl.replace(projectUrl, "") === "/ui/main.reel") {
                    this.openFileUrl(fileUrl).done();
                    break;
                }
            }
        }
    },

    handle_currentFileUrlChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleActivateExtension: {
        value: function (evt) {
            this.projectController.activateExtension(evt.detail).done();
        }
    },

    handleDeactivateExtension: {
        value: function (evt) {
            this.projectController.deactivateExtension(evt.detail).done();
        }
    },

    handleAddComponent: {
        value: function (evt) {
            var editor,
                currentFileUrl = this.projectController.getPath("currentDocument.fileUrl");

            if (currentFileUrl && (editor = this.componentEditorMap[currentFileUrl])) {
                editor.addComponent(evt.detail.prototypeObject);
            }
        }
    },

    handleOpenFile: {
        value: function (evt) {
            this.openFileUrl(evt.detail.fileUrl).done();
        }
    },

    openFileUrl: {
        value: function (fileUrl) {
            var self = this,
                editor;

            return this.projectController.openFileUrl(fileUrl).then(function (loadInfo) {
                editor = loadInfo.editor;
                if (-1 === self._openEditors.indexOf(editor)) {
                    self._editorsToInsert.push(editor);
                    self._openEditors.push(editor);
                }
                self._currentDocEditor = editor;
                self.needsDraw = true;
            });
        }
    },

    _currentDocEditor: {
        value: null
    },

    handleCloseDocument: {
        value: function (evt) {
            this.closeFileUrl(evt.detail.fileUrl).done();
        }
    },

    _editorTypeInstanceMap: {
        value: null
    },

    _fileUrlEditorMap: {
        enumerable: false,
        value: null
    },

    _openEditors: {
        value: null
    },


    closeFileUrl: {
        value: function (fileUrl) {
            var self = this;

            return this.projectController.closeFileUrl(fileUrl).then(function () {
                delete self._fileUrlEditorMap[fileUrl];
                //TODO close the editor entirely if it has no documents open?
            });
        }
    },

    handleAsyncActivity: {
        value: function(event) {
            this.templateObjects.tasksInfobar.addActivity(
                event.detail.promise,
                event.detail.title,
                event.detail.status
            );
        }
    },

    handleAddFile: {
        enumerable: false,
        value: function () {
            //TODO don't call addComponent until we know it's a component we want
            this.projectController.createComponent().done();
        }
    },

    handleSave: {
        enumerable: false,
        value: function (evt) {
            evt.preventDefault();
            this.projectController.save(evt.detail.url).then(function () {
                evt.detail.operationCallback();
            }).done();
        }
    },

    handleMenuAction: {
        enumerable: false,
        value: function (evt) {
            switch (evt.detail.identifier) {
                case "newComponent":
                    this.projectController.createComponent().done();
                    break;
                case "newModule":
                    this.projectController.createModule().done();
                    break;
            }
        }
    },

    handleMenuValidate: {
        value: function (evt) {
            this.projectController.validateMenu(evt.detail);
        }
    },

    handlePackageUrlChange: {
        value: function (value) {
            this.dispatchOwnPropertyChange("windowTitle", this.windowTitle);
            this.needsDraw = true;
        }
    },
    handleCurrentDocumentChange: {
        value: function (value) {
            this.dispatchOwnPropertyChange("windowTitle", this.windowTitle);
            this.needsDraw = true;
        }
    },

    windowTitle: {
        get: function () {

            var projectTitle = [],
                packageUrl = this.projectController ? this.projectController.packageUrl : null,
                currentDocument = this.projectController ? this.projectController.currentDocument : null;


            if (currentDocument) {
                projectTitle.push(currentDocument.title);
            }

            if (packageUrl) {
                projectTitle.push(packageUrl.substring(packageUrl.lastIndexOf("/") + 1));
            }

            return projectTitle.join(" - ");
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

    handleExitModalEditorKeyPress: {
        enumerable: false,
        value: function () {
            this.modalEditorComponent = null;
            this.palettesVisible = true;
            this._isUsingModalEditor = false;
        }
    },

    _isUsingModalEditor: {
        value: false
    },

    isUsingModalEditor: {
        get: function () {
            return this._isUsingModalEditor;
        }
    },

    /**
     The component to show in the slot that will edit the selected component
     */
    modalEditorComponent: {
        value: null
    },

    handleEnterModalEditor: {
        enumerable: false,
        value: function (event) {
            this.modalEditorComponent = event.detail.modalEditor;
            this.palettesVisible = false;
            this._isUsingModalEditor = true;
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
                editorElement,
                currentEditor = this._currentDocEditor;

            if (this._editorsToInsert.length) {
                editorArea = this.editorSlot;

                //TODO do this in a fragment if possible
                this._editorsToInsert.forEach(function (editor) {
                    element = document.createElement("div");
                    editor.element = element;
                    editorArea.appendChild(element);
                    editor.attachToParentComponent();
                    editor.needsDraw = true;
                });
                this._editorsToInsert = [];
            }

            this._openEditors.forEach(function (editor) {
                editorElement = editor.element;
                if (editorElement && editor === currentEditor) {
                    editorElement.classList.remove("standby");
                } else if (editor.element) {
                    editorElement.classList.add("standby");
                }
            });
        }
    }
});
