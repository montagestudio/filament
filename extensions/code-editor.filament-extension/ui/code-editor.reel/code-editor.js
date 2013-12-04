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
            this.handleCodeMirrorDocumentChange = this.handleCodeMirrorDocumentChange.bind(this);
        }
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
        value: function (document) {
            var codeMirrorDocument;
            this.super(document);
            // This function can be called with null.
            if (!document) {
                return;
            }

            this._mode = null;
            if (!this._isDocumentOpen(document)) {
                codeMirrorDocument = CodeMirror.Doc(this.currentDocument.content, this.mode, 0);
                this._openDocuments[document.uuid] = codeMirrorDocument;
                document.addEventListener("didSave", this, false);
                document.addEventListener("willSave", this, false);
                codeMirrorDocument.on("change", this.handleCodeMirrorDocumentChange);
            }

            if (this._codeMirror) {
                this._codeMirror.swapDoc(this._openDocuments[document.uuid]);
                this.needsDraw = true;
            }
        }
    },

    closeDocument: {
        value: function (document) {
            var codeMirrorDocument;
            this.super(document);
            // Not sure if this can be called with null just like openDocument
            // so guard against it anyway.
            if (!document) {
                return;
            }

            codeMirrorDocument = this._openDocuments[document.uuid];
            codeMirrorDocument.off("change", this.handleCodeMirrorDocumentChange);
            document.removeEventListener("didSave", this, false);
            document.removeEventListener("willSave", this, false);

            delete this._openDocuments[document.uuid];
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
    },

    handleCodeMirrorDocumentChange: {
        value: function(document) {
            var codeMirrorDocument = this._openDocuments[this.currentDocument.uuid];

            if (codeMirrorDocument === document) {
                this.currentDocument.isDirty = true;
            } else {
                console.log(codeMirrorDocument, document);
                console.log("Warning: Change in CodeMirror document that is not the current document!");
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
