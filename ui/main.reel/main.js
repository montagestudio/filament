var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application;

exports.Main = Montage.create(Component, {

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

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                application.addEventListener("asyncActivity", this, false);
                application.addEventListener("addFile", this);
                application.addEventListener("addModule", this);
                application.addEventListener("expandTree", this);

                //TODO make this less environment specific
                if (typeof lumieres === "undefined") {
                    application.addEventListener("menuAction", this);
                } else {
                    document.addEventListener("save", this, false);
                }
            }

            document.body.addEventListener("dragover", stop, false);
            document.body.addEventListener("drop", stop, false);
            function stop(evt) {
                // Prevent "loading" dropped files as a browser is wont to do
                if (evt.dataTransfer.types.indexOf("Files") > -1) {
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            }

            //prevent navigating backwards with backspace
            window.addEventListener("keydown", function (event) {
                if(event.keyCode === 8 && (document.activeElement !== event.target || event.target === document.body)) {
                    event.preventDefault();
                }
            });
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
            var path = evt.detail.replace(this.projectController.packageUrl, ""),
                dir = null,
                node = null,
                directories = path.replace(/\/$/, "").replace(/^\//, "").split("/"),
                nodes = this.templateObjects.packageExplorer.fileTreeController.nodes,
                currentPath = this.projectController.packageUrl;

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

    handleMenuAction: {
        enumerable: false,
        value: function (evt) {
            switch (evt.detail.identifier) {
            case "save":
                evt.preventDefault();
                evt.stopPropagation();

                this.projectController.save(evt.detail.url).done();

                break;
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

    handleGoToFileKeyPress: {
        value: function (event) {
            if (event.eventPhase !== event.AT_TARGET) {
                // This component is also listening directly to the application
                // for keyPress, this function is called twice because of it.
                // On target (the desired by this function) and on bubble when
                // it reaches the component.
                return;
            }

            this._showGotoFileDialog(false);
        }
    },


    handleGoToFilePreservedKeyPress: {
        value: function (event) {
            if (event.eventPhase !== event.AT_TARGET) {
                // This component is also listening directly to the application
                // for keyPress, this function is called twice because of it.
                // On target (the desired by this function) and on bubble when
                // it reaches the component.
                return;
            }

            this._showGotoFileDialog(true);
        }
    },

    _showGotoFileDialog: {
        value: function (preserveText) {
            var self = this;

            this.templateObjects.goToFile.show(preserveText);
            if (!this.templateObjects.goToFile.filesMap) {
                this.projectController.getFilesMap()
                    .then(function(filesMap) {
                        self.templateObjects.goToFile.filesMap = filesMap;
                    }).done();
            }
        }
    },

    draw: {
        value: function () {
            if (this.windowTitle) {
                document.title = this.windowTitle;
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
