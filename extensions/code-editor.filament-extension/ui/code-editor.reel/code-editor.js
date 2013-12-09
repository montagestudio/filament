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
require("./codemirror/mode/montage/html");
require("./codemirror/mode/montage/serialization");
require("./codemirror/mode/montage/template");

require("./codemirror/addon/hint/show-hint");
require("./codemirror/addon/hint/montage-serialization-hint");

/**
 Description TODO
 @class module:"./Editor.reel".Editor
 @extends module:palette/ui/editor.reel.Editor
 */
var CodeEditor = exports.CodeEditor = Editor.specialize ({

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

    indentWithSpaces: {
        value: true
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

    _createCodeMirror: {
        value: function() {
            var self = this,
                extraKeys = {};

            extraKeys.Tab = function(cm) {
                if (cm.somethingSelected() || !self.indentWithSpaces) {
                    return CodeMirror.Pass;
                }

                var spaces = new Array(cm.getOption("indentUnit") + 1).join(" ");
                cm.replaceSelection(spaces, "end", "+input");
            };

            extraKeys["Ctrl-Space"] = function(cm) {
                CodeMirror.showHint(cm, null, CodeEditor.autocompleteOptions);
            };

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

            return CodeMirror(this.element, {
                mode: this.mode,
                extraKeys: extraKeys,
                tabSize: this.tabSize,
                indentUnit: this.indentUnit,
                matchBrackets: this.matchBracket,
                lineNumbers: this.lineNumbers,
                readOnly: this.readOnly,
                theme: this.theme,
                value: ""
            });
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                var codemirror = this._codeMirror = this._createCodeMirror();

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

CodeEditor.autocompleteOptions = {
    closeCharacters: /["]/,
    alignWithWord: true,
    // TODO: there must be a way in filament to get a hold of this.
    serializationModules: createAutocompleteModuleOptions({"montage": {
        "composer": {"key-composer": 1, "press-composer": 1, "swipe-composer": 1, "translate-composer": 1},
        "core": {
            "converter": {"bytes-converter": 1, "currency-converter": 1, "date-converter": 1, "invert-converter": 1, "lower-case-converter": 1, "new-line-to-br-converter": 1, "number-converter": 1, "trim-converter": 1, "upper-case-converter": 1},
            "event": {"action-event-listener": 1},
            "media-controller": 1,
            "radio-button-controller": 1,
            "range-controller": 1,
            "tree-controller": 1
        },
        "ui": {
            "condition.reel": 1, "flow.reel": 1, "loader.reel": 1, "modal-overlay.reel": 1, "overlay.reel": 1, "repetition.reel": 1, "slot.reel": 1, "substitution.reel": 1, "text.reel": 1}
    }})
};

function createAutocompleteModuleOptions(structure) {
    var modules = [];

    var createOptions = function(structure, base) {
        Object.keys(structure).forEach(function(moduleId) {
            if (typeof structure[moduleId] === "object") {
                createOptions(structure[moduleId], base + moduleId + "/")
            } else {
                modules.push(base + moduleId);
            }
        });
    };

    createOptions(structure, "");
    modules.sort();

    return modules;
}
