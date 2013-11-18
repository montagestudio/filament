/**
 @module "./editor.reel"
 @requires montage
 @requires palette/ui/editor.reel
 */
var CodeEditorDocument = require("core/code-editor-document").CodeEditorDocument;
var Editor = require("palette/ui/editor.reel").Editor;
var Promise = require("montage/core/promise").Promise;
require("./lib/codemirror");
var CodeMirror = window.CodeMirror;
require("./mode/javascript/javascript");
require("./mode/css/css");
require("./mode/xml/xml");
require("./mode/htmlmixed/htmlmixed");

/**
 Description TODO
 @class module:"./Editor.reel".Editor
 @extends module:palette/ui/editor.reel.Editor
 */
exports.CodeEditor = Editor.specialize ({

    constructor: {
        value: function CodeEditor() {
            this.super();
        }
    },

    tabSize: {value: 4},
    indentUnit: {value: 4},
    matchBrackets: {value: false},
    lineNumbers: {value: false},
    readOnly: {value: false},

    _codeMirror: {
        value: null
    },

    _mode: {
        value: null
    },

    mode: {
        get: function() {
            if (!this._mode) {
                if (this.currentDocument && this.currentDocument.fileType) {
                    switch (this.currentDocument.fileType) {
                    case "javascript":
                        this._mode = {name: "javascript", json: true};
                        break;
                    case "css":
                        this._mode = {name: "css", json: true};
                        break;
                    case "html":
                        this._mode = {name: "htmlmixed", json: true};
                        break;
                    case "json":
                        this._mode = {name: "javascript", json: true};
                        break;
                    case "meta":
                        this._mode = {name: "javascript", json: true};
                        break;
                    default:
                        this._mode = {name: "javascript", json: true};
                    }
                } else {
                    return {name: "javascript", json: true};
                }
            }
            return this._mode;
        }
    },

    draw: {
        value: function() {

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
                    value: ""
                });

                if (this.currentDocument && this.currentDocument.codeEditorEmbeddedDocument) {
                    this._codeMirror.swapDoc(this.currentDocument.codeEditorEmbeddedDocument);
                }

                // HACK need to wait until the styling affects the element in
                // order to ask codemirror to recalculate its size correctly.
                var element = this.element;
                var parentElement = (this.ownerComponent ? this.ownerComponent.element.parentElement : this.element.parentElement);

                setTimeout(function styleChecker() {
                    if (getComputedStyle(element).width === getComputedStyle(parentElement).width) {
                        setTimeout(styleChecker, 50);
                    } else {
                        codemirror.refresh();
                    }
                }, 0);
            }
        }
    },

    hasModeErrors: {
        value: function() {
            return !!this.element.querySelector("*[class~='cm-error']");
        }
    },


    openDocument: {
        value: function (document) {
            this.super(document);
            this._mode = null;
            if (this.currentDocument) {
                if (this.currentDocument.codeEditorEmbeddedDocument === null) {
                    this.currentDocument.codeEditorEmbeddedDocument = CodeMirror.Doc(this.currentDocument.content, this.mode, 0);
                }
                if (this._codeMirror) {
                    this._codeMirror.swapDoc(this.currentDocument.codeEditorEmbeddedDocument);
                }
            }
        }
    },

    closeDocument: {
        value: function (document) {
            this.super(document);
            if (document) {
                if (document.codeEditorEmbeddedDocument) {
                    document.content = document.codeEditorEmbeddedDocument.getValue();
                }
                document.codeEditorInstance = null;
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
