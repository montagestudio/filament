/**
 * @module ui/text-editor.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class TextEditor
 * @extends Component
 */
exports.TextEditor = Component.specialize(/** @lends TextEditor# */ {

    projectController: {
        value: null
    },

    editorSlot: {
        value: null
    },

    preloadEditorSlot: {
        value: null
    },

    _frontEditor: {
        value: null
    },

    _openEditors: {
        value: null
    },

    constructor: {
        value: function TextEditor() {
            this._editorsToInsert = [];
            this._openEditors = [];
        }
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

    preloadEditor: {
        value: function(editor) {
            this.preloadEditorSlot.content = editor;
        }
    },

    // Event listeners

    handleWillOpenDocument: {
        value: function (event) {
            this.bringEditorToFront(event.detail.editor);
        }
    },

    handleWillCloseDocument: {
        value: function () {
            if (this.projectController.documents.length === 1) {
                this.hideEditors();
            }
        }
    },

    handlePreloadEditor: {
        value: function (event) {
            this.preloadEditor(event.detail.editor);
        }
    },

    // Lifecycle methods

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.projectController.addEventListener("willOpenDocument", this);
                this.projectController.addEventListener("willCloseDocument", this);
                this.projectController.addEventListener("preloadEditor", this);
            }
        }
    },

    draw: {
        value: function () {
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
    }
});
