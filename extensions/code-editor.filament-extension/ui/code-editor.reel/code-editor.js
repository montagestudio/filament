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
require("./codemirror/mode/clike/clike");

require("./codemirror/addon/hint/show-hint");
require("./codemirror/addon/hint/montage-serialization-hint");
require("./codemirror/addon/hint/xml-hint");
require("./codemirror/addon/hint/html-hint");
require("./codemirror/addon/hint/css-hint");
require("./codemirror/addon/hint/javascript-hint");

/**
 Description TODO
 @class module:"./Editor.reel".Editor
 @extends module:palette/ui/editor.reel.Editor
 */
var CodeEditor = exports.CodeEditor = Editor.specialize ({

    constructor: {
        value: function CodeEditor() {
            this.super();
            this._openDocuments = new Map();
        }
    },

    friendlyName : {
        value: "Text Editor"
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

    autoIndent: {
        value: true
    },

    /**
     * A map of document -> codemirror document.
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

            // Configure html-hint
            ["data-montage-id", "data-param", "data-arg"]
            .forEach(function(attr) {
                CodeMirror.htmlSchema.s.attrs[attr] = null;
            });

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

            var codemirror = CodeMirror(this.element, {
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

            codemirror.on("beforeChange", function(cm, changeObj) {
                if (!self.autoIndent) {
                    return CodeMirror.Pass;
                }

                if (changeObj.origin === "paste") {
                    // the first line is not indented
                    var fromLine = changeObj.from.line + 1;
                    var toLine = fromLine + changeObj.text.length - 2;

                    // In order to make the paste operation and the
                    // indentation a single history item we need to
                    // use the operation() function to create an atomic
                    // change. To do this we cancel the paste and do it
                    // ourselves on the nextTick since we shouldn't change the
                    // document during a "beforeChange" event.
                    changeObj.cancel();
                    Promise.resolve().then(function () {
                        cm.operation(function() {
                            cm.getDoc().replaceRange(
                                changeObj.text.join("\n"),
                                changeObj.from, changeObj.to);
                            for (var i = fromLine; i <= toLine; i++) {
                                cm.indentLine(i);
                            }
                        });
                    });
                }
            });

            return codemirror;
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                var codemirror = this._codeMirror = this._createCodeMirror();

                if (this.currentDocument) {
                    var codeMirrorDocument = this._openDocuments.get(this.currentDocument);
                    codemirror.swapDoc(codeMirrorDocument);
                }
            }
        }
    },

    didDraw: {
        value: function() {
            this._codeMirror.refresh();
            this._codeMirror.focus();
        }
    },

    hasModeErrors: {
        value: function() {
            return !!this.element.querySelector("*[class~='cm-error']");
        }
    },

    _isDocumentOpen: {
        value: function(document) {
            return this._openDocuments.has(document);
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
                codeMirrorDocument = CodeMirror.Doc(this.currentDocument.content || "", this.mode, 0);
                editingDocument.codeMirrorDocument = codeMirrorDocument;
                editingDocument.editor = this;
                //TODO why put the code mirror document into the openDocument list and not the code-editor-doc?
                this._openDocuments.set(editingDocument, codeMirrorDocument);
                editingDocument.addEventListener("didSave", this, false);
                editingDocument.addEventListener("willSave", this, false);
            }

            if (this._codeMirror) {
                try {
                    this._codeMirror.swapDoc(this._openDocuments.get(editingDocument));
                } catch (ex) {
                    console.error("Error loading CodeMirror document", ex);
                }

                this.needsDraw = true;
            }

            if (editingDocument.needsRefresh()) {
                editingDocument.refresh().done();
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

            codeMirrorDocument = this._openDocuments.get(editingDocument);
            editingDocument.removeEventListener("didSave", this, false);
            editingDocument.removeEventListener("willSave", this, false);

            //TODO need to remove the editor from the codeEditorDocument instance that was associated with this codeMirrorDocument

            this._openDocuments.delete(editingDocument);
        }
    },

    handleWillSave: {
        value: function(event) {
            var document = event.target;
            var codeMirrorDocument = this._openDocuments.get(document);

            if (codeMirrorDocument) {
                document.content = codeMirrorDocument.getValue();
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
            "condition.reel": 1,
            "flow.reel": 1,
            "loader.reel": 1,
            "modal-overlay.reel": 1,
            "overlay.reel": 1,
            "repetition.reel": 1,
            "slot.reel": 1,
            "substitution.reel": 1,
            "text.reel": 1
        }
    }, "digit": {
        "ui": {
            "badge.reel": 1,
            "button.reel": 1,
            "checkbox.reel": 1,
            "image.reel": 1,
            "list-item.reel": 1,
            "list.reel": 1,
            "number-field.reel": 1,
            "radio-button.reel": 1,
            "select.reel": 1,
            "slider.reel": 1,
            "text-area.reel": 1,
            "text-field.reel": 1,
            "text.reel": 1,
            "title.reel": 1,
            "toggle-switch.reel": 1,
            "video-control.reel": 1,
            "video.reel": 1
        }
    }})
};

function createAutocompleteModuleOptions(structure) {
    var modules = [];

    var createOptions = function(structure, base) {
        Object.keys(structure).forEach(function(moduleId) {
            if (typeof structure[moduleId] === "object") {
                createOptions(structure[moduleId], base + moduleId + "/");
            } else {
                modules.push(base + moduleId);
            }
        });
    };

    createOptions(structure, "");
    modules.sort();

    return modules;
}
