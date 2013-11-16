var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application;

exports.Main = Montage.create(Component, {

    _menuContentComponent: {
        value: null
    },

    projectController: {
        value: null
    },

    editorSlot: {
        value: null
    },

    constructor: {
        value: function Main() {
            this.super();
            this._editorsToInsert = [];
            this._openEditors = [];

            this.addPathChangeListener("projectController.currentDocument.title", this, "handleTitleWillChange", true);
            this.addPathChangeListener("projectController.currentDocument.title", this, "handleTitleChange");
        }
    },

    slotDidSwitchContent: {
        value: function (slot, newContent, oldContent) {
            if (this.templateObjects.menuBarSlot === slot) {
                // Wait for the menuContentComponent to be expanded and put in place
                // this is detected by the element that is used as content being
                // TODO improve this
                if (oldContent && oldContent.component) {
                    oldContent.component.cancelBinding("menuModel");
                }

                if (newContent && newContent.component) {
                    newContent.component.defineBinding("menuModel", {"<-": "mainMenu", source: application});
                }
            }
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                application.addEventListener("asyncActivity", this, false);
                application.addEventListener("enterModalEditor", this);
                application.addEventListener("exitModalEditor", this);
                application.addEventListener("addFile", this);
                application.addEventListener("addModule", this);
                application.addEventListener("expandTree", this);

                document.addEventListener("save", this, false);
            }
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

    // Expand a tree according to a given path, will fail if the tree has not been pre-loaded
    handleExpandTree: {
        value: function (evt) {
            var path = evt.detail.replace(this.projectController.projectUrl + "/", ""),
                dir = null,
                node = null,
                directories = path.replace(/\/$/, "").replace(/^\//, "").split("/"),
                nodes = this.templateObjects.packageExplorer.fileTreeController.nodes,
                currentPath = this.projectController.projectUrl + "/";

            while (dir = directories.shift()) {
                var directoryPath = currentPath + dir + "/";
                for (var i = 0; (node = nodes[i]) && node.content.fileUrl !== directoryPath; ++i) {
                    continue;
                }
                if (!node || (node.content.name !== dir)) {
                    // Directory not found, either not loaded or wrong path
                    return;
                }
                node.expanded = true;
                currentPath += dir + "/";
            }
        }
    },

    _frontEditor: {
        value: null
    },

    bringEditorToFront: {
        value: function (editor) {
            if (!editor.element) {
                this._editorsToInsert.push(editor);
                this._openEditors.push(editor);
            }

            this._frontEditor = editor;
            this.needsDraw = true;
        }
    },

    hideEditors: {
        value: function () {
            this._frontEditor = null;
            this.needsDraw = true;
        }
    },

    _openEditors: {
        value: null
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

    handleAddModule: {
        value: function (evt) {
            if (this.projectController.canCreateModule) {
                this.projectController.createModule().done();
            }
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

    injectMainMenu: {
        value: function (menuConstructor) {
            var menuComponent = new menuConstructor();
            this._menuContentComponent = menuComponent;
        }
    },

    retractMainMenu: {
        value: function () {
            this._menuContentComponent = null;
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

    handleCloseDocumentKeyPress: {
        value: function (event) {
            var document = this.projectController.currentDocument;
            if (document) {
                event.preventDefault();
                this.dispatchEventNamed("closeDocument", true, true, document);
            } else {
                window.close();
            }
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
            this.exitModalEditor();
        }
    },

    handleExitModalEditor: {
        enumerable: false,
        value: function (event) {
            this.exitModalEditor();
        }
    },

    exitModalEditor: {
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
                frontEditor = this._frontEditor;

            if (this._editorsToInsert.length) {
                editorArea = this.editorSlot;

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
                if (editor === frontEditor) {
                    editorElement.classList.remove("standby");
                } else {
                    editorElement.classList.add("standby");
                }
            });
        }
    }
});
