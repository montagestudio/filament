var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    WeakMap = require("montage/collections/weak-map"),
    application = require("montage/core/application").application;

exports.Main = Montage.create(Component, {

    projectController: {
        value: null
    },

    editorSlot: {
        value: null
    },

    _currentFileUrl: {
        value: null
    },

    didCreate: {
        value: function () {
            this._editorsToInsert = [];
            this._fileUrlEditorMap = {};
            this._openEditors = [];

            this.addPathChangeListener("projectController.currentDocument.title", this, "handleTitleWillChange", true);
            this.addPathChangeListener("projectController.currentDocument.title", this, "handleTitleChange");
        }
    },

    prepareForDraw: {
        value: function () {
            application.addEventListener("asyncActivity", this, false);
            application.addEventListener("enterModalEditor", this);
            application.addEventListener("openFile", this);
            application.addEventListener("addFile", this);
            application.addEventListener("closeDocument", this);

            document.addEventListener("save", this, false);
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
                if (editor) {
                    if (-1 === self._openEditors.indexOf(editor)) {
                        self._editorsToInsert.push(editor);
                        self._openEditors.push(editor);
                    }
                    self._currentDocEditor = editor;
                    self.needsDraw = true;
                }
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
            if (this.projectController.validateMenu(evt.detail)) {
                evt.preventDefault();
            }
        }
    },

    handleTitleWillChange: {
        value: function () {
            this.dispatchBeforeOwnPropertyChange("windowTitle", this.windowTitle);
        }
    },

    handleTitleChange: {
        value: function () {
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

    _extensionsVisible: {
        value: false
    },

    handleToggleExtensionsKeyPress: {
        value: function () {
            this._extensionsVisible = !this._extensionsVisible;
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
