var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    application = require("montage/core/application").application;

// Browser Compatibility
require("core/compatibility");

exports.Main = Montage.create(Component, {

    projectController: {
        value: null
    },

    editorSlot: {
        value: null
    },

    preloadSlot: {
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
                application.addEventListener("addDirectory", this);
                application.addEventListener("removeTree", this);
                application.addEventListener("expandTree", this);

                //TODO make this less environment specific
                if (typeof lumieres === "undefined") {
                    application.addEventListener("menuAction", this);
                    window.onbeforeunload = this.handleBeforeunload.bind(this);
                    window.addEventListener("beforeunload", this, false);
                } else {
                    document.addEventListener("save", this, false);
                }

                document.addEventListener("contextmenu", this, false);
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

            // tab re-arranging
            this.templateObjects.openDocumentList.element.addEventListener("dragover", this, false);
            this.templateObjects.openDocumentList.element.addEventListener("dragleave", this, false);
            this.templateObjects.openDocumentList.element.addEventListener("drop", this, false);

            //prevent navigating backwards with backspace
            window.addEventListener("keydown", function (event) {
                if(event.keyCode === 8 && (document.activeElement !== event.target || event.target === document.body)) {
                    event.preventDefault();
                }
            });
        }
    },

    handleDragover: {
        value: function (evt) {
            // TODO: move tabs arround
            evt.preventDefault();
            evt.stopPropagation();
            evt.dataTransfer.dropEffect = "move";
        }
    },

    handleDragleave: {
        value: function (evt) {
            // TODO: if we do not come back on dragover the dropover should reset the tab
        }
    },

    tabIndexForElement: {
        value: function (element) {
            var tab;

            // Make sure we are on a documentTab and not the children of one
            while (element.dataset.montageId !== "documentTab" && element.parentElement) {
                element = element.parentElement;
            }
            if (element.dataset.montageId) {
                tab = element;
            }
            else {
                throw "Can not move re-arrange this tab because this tab can not be found";
            }

            var iterations = this.templateObjects.openDocumentList.iterations.filter(function(i) {
                return i.firstElement === tab;
            });

            if (!iterations.length) {
                throw "Can not find iteration document for tab element";
            }

            return iterations[0].index;
        }
    },

    tabIndexForUrl: {
        value: function (url) {
            // Find documents associated with this url
            var documents = this.projectController.documents.filter(function (doc) {
                return doc.url === url;
            });

            if (documents.length === 1) {
                var doc = documents[0],
                    iterations = this.templateObjects.openDocumentList.iterations.filter(function(i) {
                        return i.object === doc;
                    });
                if (iterations.length) {
                    return iterations[0].index;
                } else {
                    throw "Can not find iteration for unique document for url:" + url;
                }
            } else {
                // Unopened file
                return -1;
            }
        }
    },

    handleDrop: {
        value: function (evt) {
            var availableTypes = evt.dataTransfer.types,
                element = document.elementFromPoint(evt.pageX, evt.pageY),
                documents = this.projectController.documents,
                currentDocument = this.projectController.currentDocument,
                url,
                doc,
                index,
                newIndex;

            if(availableTypes && availableTypes.has(MimeTypes.URL)) {
                url = evt.dataTransfer.getData(MimeTypes.URL);
                index = this.tabIndexForUrl(url);

                if (index && index === -1) {
                    // Open file
                    this.dispatchEventNamed("openUrl", true, true, url);
                    return;
                } else if ( index === undefined || !documents[index]) {
                    throw "Can not re-arrange this tab because this tab index is incorrect";
                }

                // move to last if not droped on a tab but in the empty space of the tab bar
                if (element === this.templateObjects.openDocumentList.element) {
                    newIndex = documents.length;
                }
                else {
                    newIndex = this.tabIndexForElement(element);
                }
                doc = documents[index];
                documents.splice(newIndex, 0, doc);
                index = (newIndex < index)? index + 1: index;
                documents.splice(index, 1);
                if (currentDocument !== doc) {
                    this.dispatchEventNamed("openUrl", true, true, doc.url);
                } else {
                    this.projectController.openDocumentsController.select(doc);
                }
            }
        }
    },

    handleBeforeunload: {
        value: function(evt) {
            if (!this.projectController || this.projectController.canCloseAllDocuments()) {
                return;
            }
            // From https://developer.mozilla.org/en-US/docs/Web/Reference/Events/beforeunload
            var confirmationMessage = "You have unsaved changes, leaving now will lose these changes."; // TODO localisation
            evt.preventDefault();
            (evt || window.event).returnValue = confirmationMessage;    //Gecko + IE
            return confirmationMessage;                                 //Webkit, Safari, Chrome etc.
        }
    },

    // Display a contextual menu on right click anywhere in the app if the active target has a contextual menu
    handleContextmenu: {
        value: function (evt) {
            evt.stopImmediatePropagation();
            evt.stop();

            this.templateObjects.contextualMenu.show({top: evt.clientY, left: evt.clientX});
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
                nodes = this.templateObjects.packageExplorer.fileTreeController.iterations,
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
            if (!editor.element || editor.element.parentElement !== this.editorSlot) {
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
        value: function (evt) {
            var path = (evt.detail && evt.detail.path)? evt.detail.path : undefined;
            //TODO don't call addComponent until we know it's a component we want
            this.projectController.createComponent(path).done();
        }
    },

    handleAddModule: {
        value: function (evt) {
            var path = (evt.detail && evt.detail.path)? evt.detail.path : undefined;
            if (this.projectController.canCreateModule) {
                this.projectController.createModule(path).done();
            }
        }
    },

    handleAddDirectory: {
        value: function (evt) {
            var path = (evt.detail && evt.detail.path)? evt.detail.path : undefined;
            this.projectController.addDirectory(path).done();
        }
    },

    handleRemoveTree: {
        value: function (evt) {
            var path = evt.detail.path;
            this.projectController.removeTree(path).done();
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
                evt.stop();

                this.projectController.save(evt.detail.url).done();
                break;

            case "preview":
                evt.stop();

                //TODO not simply toggle this
                this.isShowingPreviewPanel = !this.isShowingPreviewPanel;
                break;

            case "goto":
                evt.stop();

                this._showGotoFileDialog(false);
                break;

            case "gotoAgain":
                evt.stop();

                this._showGotoFileDialog(true);
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
                currentDocument = this.projectController ? this.projectController.currentDocument : null;

            if (currentDocument) {
                projectTitle.push(currentDocument.title);
            }

            if (this.projectController && this.projectController.packageDescription && this.projectController.packageDescription.name) {
                projectTitle.push(this.projectController.packageDescription.name);
            }

            projectTitle.push("Montage Studio");

            return projectTitle.join(" – ");
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

    isShowingPreviewPanel: {
        value: false
    },

    draw: {
        value: function () {
            if (this.windowTitle) {
                document.title = this.windowTitle;
            }

            var editorArea,
                editorElement,
                frontEditor = this._frontEditor;

            if (this._editorsToInsert.length) {
                editorArea = this.editorSlot;

                this._editorsToInsert.forEach(function (editor) {
                    if (!editor.element) {
                        editor.element = document.createElement("div");
                    }
                    editorArea.appendChild(editor.element);
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
    },

    preloadEditor: {
        value: function(editor) {
            this.templateObjects.preloadEditorSlot.content = editor;
        }
    }
});
