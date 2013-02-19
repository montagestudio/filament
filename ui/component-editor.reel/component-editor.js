var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    DocumentEditor = require("./document-editor.reel").DocumentEditor,
    Promise = require("montage/core/promise").Promise,
    WeakMap = require("montage/collections/weak-map");

exports.ComponentEditor = Montage.create(Component, {

    projectController: {
        value: null
    },

    viewController: {
        vaule: null
    },

    _editorsToInsert: {
        enumerable: false,
        value: null
    },

    _editorsToRemove: {
        value: null
    },

    _documentEditorSlot: {
        enumerable: false,
        value: null
    },

    _fileUrlEditorPromiseMap: {
        value: null
    },

    _fileUrlEditorMap: {
        value: null
    },

    _fileUrlDocumentMap: {
        value: null
    },

    didCreate: {
        value: function () {
            this._editorsToInsert = [];
            this._editorsToRemove = [];
            this._editorDeferredCloseMap = new WeakMap();
            this._fileUrlEditorPromiseMap = {};
            this._fileUrlEditorMap = {};
            this._fileUrlDocumentMap = {};
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var documentEditorPromise = this._fileUrlEditorPromiseMap[fileUrl],
                deferredEditor,
                newEditor,
                editorFirstDrawHandler,
                editingDocument,
                editingDocumentPromise,
                self = this;

            if (!documentEditorPromise) {
                deferredEditor = Promise.defer();
                documentEditorPromise = deferredEditor.promise;
                this._fileUrlEditorPromiseMap[fileUrl] = documentEditorPromise;

                newEditor = DocumentEditor.create();
                this._editorsToInsert.push(newEditor);

                editorFirstDrawHandler = function (evt) {
                    var editor = evt.target;
                    editor.removeEventListener("firstDraw", editorFirstDrawHandler, false);

                    self._fileUrlEditorMap[fileUrl] = editor;
                    deferredEditor.resolve(editor);
                };

                newEditor.addEventListener("firstDraw", editorFirstDrawHandler, false);
                this.needsDraw = true;
            }

            return documentEditorPromise.then(function (editor) {

                editingDocument = self._fileUrlDocumentMap[fileUrl];

                if (editingDocument) {
                    editingDocumentPromise = Promise.resolve(editingDocument);
                } else {
                    editingDocumentPromise = editor.load(fileUrl, packageUrl).then(function (editingDoc) {
                        self._fileUrlDocumentMap[fileUrl] = editingDoc;
                        return editingDoc;
                    });
                }

                //Update the stadby classes
                editingDocumentPromise.then(function () {
                    self.needsDraw = true;
                });

                return editingDocumentPromise;
            });
        }
    },

    _editorDeferredCloseMap: {
        value: null
    },

    close: {
        value: function (fileUrl) {
            var editor = this._fileUrlEditorMap[fileUrl],
                deferredClose = Promise.defer(),
                loadingPromise = this._fileUrlEditorPromiseMap[fileUrl];

            delete this._fileUrlDocumentMap[fileUrl];
            delete this._fileUrlEditorMap[fileUrl];

            if (!loadingPromise.isFulfilled()) {
                //TODO sort this situation out
                throw new Error("Closing a document that is in the process of being opened, TODO");
            } else {
                delete this._fileUrlEditorPromiseMap[fileUrl];
            }


            this._editorsToRemove.push(editor);
            this._editorDeferredCloseMap.set(editor, deferredClose);
            this.needsDraw = true;

            return deferredClose.promise;
        }
    },

    draw: {
        value: function () {

            var self = this,
                editorArea,
                element,
                editorElement,
                fileUrls,
                currentFileUrl,
                editor;

            if (this._editorsToInsert.length) {
                editorArea = this._documentEditorSlot;

                //TODO do this in a fragment if possible
                this._editorsToInsert.forEach(function (editor) {
                    element = document.createElement("div");
                    element.classList.add("standby");
                    editor.element = element;
                    editorArea.appendChild(element);
                    editor.attachToParentComponent();
                    editor.needsDraw = true;
                });
                this._editorsToInsert = [];
            }

            if (this._editorsToRemove.length) {
                editorArea = this._documentEditorSlot;

                //TODO do this in a fragment if possible
                this._editorsToRemove.forEach(function (editor) {
                    editorArea.removeChild(editor.element);
                    self._editorDeferredCloseMap.get(editor).resolve(editor.editingDocument);
                });
                this._editorsToRemove = [];
            }

            //TODO optimize this entire draw method
            fileUrls = Object.keys(this._fileUrlEditorMap);
            currentFileUrl = this.getPath("projectController.currentDocument.fileUrl");

            fileUrls.forEach(function (fileUrl) {
                editor = self._fileUrlEditorMap[fileUrl];
                editorElement = editor.element;

                if (editorElement && fileUrl === currentFileUrl) {
                    editorElement.classList.remove("standby");
                } else if (editorElement) {
                    editor.element.classList.add("standby");
                }
            });

        }
    }
});
