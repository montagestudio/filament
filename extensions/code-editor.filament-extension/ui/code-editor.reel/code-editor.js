/**
 @module "./editor.reel"
 @requires montage
 @requires palette/ui/editor.reel
 */
var CodeEditorDocument = require("core/code-editor-document").CodeEditorDocument;
var Editor = require("palette/ui/editor.reel").Editor;
var Promise = require("montage/core/promise").Promise;
require("./codemirror/lib/codemirror");
var CodeMirror = window.CodeMirror;
require("./codemirror/mode/javascript/javascript");
require("./codemirror/mode/css/css");
require("./codemirror/mode/xml/xml");
require("./codemirror/mode/htmlmixed/htmlmixed");
require("./codemirror/mode/montage/serialization");
require("./codemirror/mode/montage/template");

/**
 Description TODO
 @class module:"./Editor.reel".Editor
 @extends module:palette/ui/editor.reel.Editor
 */
exports.CodeEditor = Editor.specialize ({

    constructor: {
        value: function CodeEditor() {
            this.super();
            this._openDocuments = Object.create(null);
        }
    },

    acceptsActiveTarget: {
        value: true
    },

    tabSize: {value: 4},
    indentUnit: {value: 4},
    matchBrackets: {value: false},
    lineNumbers: {value: true},
    readOnly: {value: false},
    theme: {value: "solarized light"},

    _codeMirror: {
        value: null
    },

    _mode: {
        value: null
    },

    mode: {
        get: function() {
            if (!this._mode) {
                if (this.currentDocument && this.currentDocument.mimeType) {
                    this._mode = this.currentDocument.mimeType;
                } else {
                    return {};
                }
            }
            return this._mode;
        }
    },

    /**
     * A dictionary of document uuid -> codemirror document.
     */
    _openDocuments: {
        value: null
    },

    getContent: {
        value: function() {
            if (this._codeMirror) {
                return this._codeMirror.getValue();
            }
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {

                //Remove Key handling that we'll handle ourselves
                var defaultKeyMap = CodeMirror.keyMap.default;
                delete defaultKeyMap["Shift-Cmd-Z"];
                delete defaultKeyMap["Cmd-Z"];
                delete defaultKeyMap["Cmd-Y"];
                delete defaultKeyMap["Cmd-S"];

                var macKeyMap = CodeMirror.keyMap.macDefault;
                delete macKeyMap["Cmd-Z"];
                delete macKeyMap["Shift-Cmd-Z"];
                delete macKeyMap["Cmd-Y"];

                var pcKeyMap = CodeMirror.keyMap.pcDefault;
                delete pcKeyMap["Ctrl-Z"];
                delete pcKeyMap["Shift-Ctrl-Z"];
                delete pcKeyMap["Ctrl-Y"];
                delete pcKeyMap["Ctrl-S"];

                var codemirror = this._codeMirror = CodeMirror(this.element, {
                    mode: this.mode,
                    tabSize: this.tabSize,
                    indentUnit: this.indentUnit,
                    matchBrackets: this.matchBracket,
                    lineNumbers: this.lineNumbers,
                    readOnly: this.readOnly,
                    theme: this.theme,
                    value: ""
                });

                if (this.currentDocument) {
                    var codeMirrorDocument = this._openDocuments[this.currentDocument.uuid];
                    codemirror.swapDoc(codeMirrorDocument);
                }
            }
        }
    },

    didDraw: {
        value: function() {
            this._codeMirror.refresh();
        }
    },

    hasModeErrors: {
        value: function() {
            return !!this.element.querySelector("*[class~='cm-error']");
        }
    },

    _isDocumentOpen: {
        value: function(document) {
            return document.uuid in this._openDocuments;
        }
    },

    openDocument: {
        value: function (editingDocument) {
            var codeMirrorDocument;
            this.super(editingDocument);
            // This function can be called with null.
            if (!editingDocument) {
                return;
            }

            this._mode = null;
            if (!this._isDocumentOpen(editingDocument)) {
                codeMirrorDocument = CodeMirror.Doc(this.currentDocument.content, this.mode, 0);
                editingDocument.codeMirrorDocument = codeMirrorDocument;
                editingDocument.editor = this;
                //TODO why put the code mirror document into the openDocument list and not the code-editor-doc?
                this._openDocuments[editingDocument.uuid] = codeMirrorDocument;
                editingDocument.addEventListener("didSave", this, false);
                editingDocument.addEventListener("willSave", this, false);
            }

            if (this._codeMirror) {
                this._codeMirror.swapDoc(this._openDocuments[editingDocument.uuid]);
                this.needsDraw = true;
            }
        }
    },

    closeDocument: {
        value: function (editingDocument) {
            var codeMirrorDocument;
            this.super(editingDocument);
            // Not sure if this can be called with null just like openDocument
            // so guard against it anyway.
            if (!editingDocument) {
                return;
            }

            codeMirrorDocument = this._openDocuments[editingDocument.uuid];
            editingDocument.removeEventListener("didSave", this, false);
            editingDocument.removeEventListener("willSave", this, false);

            //TODO need to remove the editor from the codeEditorDocument instance that was associated with this codeMirrorDocument

            delete this._openDocuments[editingDocument.uuid];
        }
    },

    handleWillSave: {
        value: function(event) {
            var document = event.target;

            if (this._codeMirror && document === this.currentDocument) {
                document.content = this.getContent();
            }
        }
    },

    handleDidSave: {
        value: function() {
            if (this._codeMirror) {
                this._codeMirror.changeGeneration();
            }
        }
    }

},{
    /*
      * Create and load the document.<br/>
      * <b>Note:</> This must be overwritten by sub classes
      * @returns By default a rejected promise.
      */
    loadDocument:{
        value:function (fileUrl, packageUrl) {
            return CodeEditorDocument.load(fileUrl, packageUrl).then(function (document) {
                return Promise.resolve(document);
            });
        }
    }

});
