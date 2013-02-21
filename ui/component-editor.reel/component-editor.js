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
                self = this;

            if (!docEditor) {
                docEditor = DocumentEditor.create();
                this._fileUrlEditorMap[fileUrl] = docEditor;

                this._editorsToInsert.push(docEditor);
                this._openEditors.push(docEditor);
            }

            this._currentEditor = docEditor;
            this.needsDraw = true;

            return docEditor.load(fileUrl, packageUrl).then(function (editingDoc) {
                self._fileUrlDocumentMap[fileUrl] = editingDoc;
                self.needsDraw = true;
                return editingDoc;
            });
        }
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
