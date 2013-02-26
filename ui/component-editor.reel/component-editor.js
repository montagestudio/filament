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

    _fileUrlEditorMap: {
        value: null
    },

    _fileUrlDocumentMap: {
        value: null
    },

    _openEditors: {
        value: null
    },

    _currentEditor: {
        value: null
    },

    _editorDeferredCloseMap: {
        value: null
    },

    didCreate: {
        value: function () {
            this._editorsToInsert = [];
            this._editorsToRemove = [];
            this._openEditors = [];
            this._editorDeferredCloseMap = new WeakMap();
            this._fileUrlEditorMap = {};
            this._fileUrlDocumentMap = {};
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var docEditor = this._fileUrlEditorMap[fileUrl],
                editingDocument = this._fileUrlDocumentMap[fileUrl],
                loadedDocumentPromise,
                self = this;

            if (!docEditor) {
                docEditor = DocumentEditor.create();
                this._fileUrlEditorMap[fileUrl] = docEditor;

                this._editorsToInsert.push(docEditor);
                this._openEditors.push(docEditor);
            }

            if (!editingDocument) {
                // TODO still should track the loading promise in a map somewhere in case we try to close it
                // before it's fully loaded; this is probably true at all levels where we do this dance
                loadedDocumentPromise = docEditor.load(fileUrl, packageUrl).then(function (editingDoc) {
                    self._fileUrlDocumentMap[fileUrl] = editingDoc;
                    self.needsDraw = true;
                    return editingDoc;
                });
            } else {
                loadedDocumentPromise = Promise.resolve(editingDocument);
            }

            this._currentEditor = docEditor;
            this.needsDraw = true;

            return loadedDocumentPromise;
        }
    },

    close: {
        value: function (fileUrl) {
            var editor = this._fileUrlEditorMap[fileUrl],
                deferredClose = Promise.defer();

            if (!editor) {
                //TODO sort this situation out
                throw new Error("Closing a document that is in the process of being opened, TODO");
            }

            delete this._fileUrlDocumentMap[fileUrl];
            delete this._fileUrlEditorMap[fileUrl];

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
                currentEditor = this._currentEditor;

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

            this._openEditors.forEach(function (editor) {
                editorElement = editor.element;

                if (editorElement && editor === currentEditor) {
                    editorElement.classList.remove("standby");
                } else if (editorElement) {
                    editor.element.classList.add("standby");
                }
            });

        }
    }
});
