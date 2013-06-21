var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    DocumentEditor = require("./document-editor.reel").DocumentEditor,
    Promise = require("montage/core/promise").Promise,
    WeakMap = require("montage/collections/weak-map"),
    Editor = require("palette/ui/editor.reel").Editor;

exports.ComponentEditor = Editor.specialize({

    projectController: {
        value: null
    },

    viewController: {
        value: null
    },

    templateObjectsController: {
        value: null
    },

    _editorsToInsert: {
        value: null
    },

    _editorsToRemove: {
        value: null
    },

    _documentEditorSlot: {
        value: null
    },

    _openEditors: {
        value: null
    },

    _frontEditor: {
        value: null
    },

    nextTarget: {
        get: function () {
            // Consider whichever documentEditor is upfront to be the nextTarget
            return this._frontEditor;
        }
    },

    constructor: {
        value: function ComponentEditor() {
            this.super();
            this._editorsToInsert = [];
            this._editorsToRemove = [];
            this._openEditors = [];
            this._documentEditorMap = new WeakMap();
        }
    },

    openDocument: {
        value: function (document) {
            var editor;

            if (document) {
                editor = this._documentEditorMap.get(document);

                if (!editor) {
                    editor = DocumentEditor.create();
                    editor.projectController = this.projectController;
                    editor.viewController = this.viewController;
                    editor.load(document).done();
                    this._documentEditorMap.set(document, editor);
                }

                if (!editor.element) {
                    this._editorsToInsert.push(editor);
                    this._openEditors.push(editor);
                }

                this._frontEditor = editor;
                this.needsDraw = true;
            }
        }
    },

    closeDocument: {
        value: function (document) {
            var editor,
                editorIndex;

            if (document) {
                editor = this._documentEditorMap.get(document);

                if (editor) {
                    this._editorsToRemove.push(editor);
                    editorIndex = this._openEditors.indexOf(editor);
                    if (-1 !== editorIndex) {
                        this._openEditors.splice(editorIndex, 1);
                    }
                }
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {

            var self = this,
                editorArea,
                element,
                editorElement,
                frontEditor = this._frontEditor;

            if (this._editorsToInsert.length) {
                editorArea = this._documentEditorSlot;

                this._editorsToInsert.forEach(function (editor) {
                    element = document.createElement("div");
                    editor.element = element;
                    editorArea.appendChild(element);
                    editor.attachToParentComponent();
                    editor.needsDraw = true;
                });
                this._editorsToInsert = [];
            }

            if (this._editorsToRemove.length) {
                editorArea = this._documentEditorSlot;

                this._editorsToRemove.forEach(function (editor) {
                    editorArea.removeChild(editor.element);
                });
                this._editorsToRemove = [];
            }

            this._openEditors.forEach(function (editor) {
                editorElement = editor.element;

                if (editorElement && editor === frontEditor) {
                    editorElement.classList.remove("standby");
                } else if (editorElement) {
                    editor.element.classList.add("standby");
                }
            });

        }
    }
});
