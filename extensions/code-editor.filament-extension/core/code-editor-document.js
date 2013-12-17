var Promise = require("montage/core/promise").Promise;
var CodeEditor = require("ui/code-editor.reel").CodeEditor;
var Document = require("palette/core/document").Document;

var CodeEditorDocument = exports.CodeEditorDocument = Document.specialize({

    constructor: {
        value: function CodeEditorDocument() {
            this.super();
            this.handleCodeMirrorDocumentChange = this.handleCodeMirrorDocumentChange.bind(this);
        }
    },

    content: {
        value: null
    },

    _codeMirrorDocument: {
        value: null
    },

    codeMirrorDocument: {
        get: function () {
            return this._codeMirrorDocument;
        },
        set: function (value) {
            if (value === this._codeMirrorDocument) {
                return;
            }

            this.undoManager.clearUndo();
            this.undoManager.clearRedo();
            this._expectedUndoCount = 0;
            this._expectedRedoCount = 0;

            if (this._codeMirrorDocument) {
                this._codeMirrorDocument.off("change", this.handleCodeMirrorDocumentChange);
            }

            this._codeMirrorDocument = value;

            if (this._codeMirrorDocument) {
                this._codeMirrorDocument.on("change", this.handleCodeMirrorDocumentChange);

                var historySize = this._codeMirrorDocument.historySize();
                this._expectedUndoCount = historySize.undo;
                this._expectedRedoCount = historySize.redo;

                // TODO build an appropriate undo redo stack
                // should be as simple as creating the right number of undos and redos
                // unfortunately, this is easy to do for undos, but redos are only registered
                // as inverses of an existing undo; we'll need to figure out how to resolve this
                // mismatch
                // NOTE assuming the CM document is actually not changed once set for now...
            }
        }
    },

    init: {
        value: function (fileUrl, packageRequire, content) {
            var self = this.super(fileUrl);
            self.content = content;

            self._mimeType = CodeEditorDocument.editorMimeType(fileUrl);
            self.codeEditorInstance = null;

            return self;
        }
    },

    _editor: {
        value: null
    },

    editor: {
        get: function () {
            return this._editor;
        },
        set: function (value) {
            if (value === this._editor) {
                return;
            }

            if (this._editor) {
                this._editor.removeEventListener("menuValidate", this);
                this._editor.removeEventListener("menuAction", this);
            }

            this._editor = value;

            if (this._editor) {
                this._editor.addEventListener("menuValidate", this);
                this._editor.addEventListener("menuAction", this);
            }
        }
    },

    handleMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = evt.detail.identifier;

            if ("undo" === identifier) {
                menuItem.enabled = this.canUndo;
                //TODO localize
                menuItem.title = this.canUndo ? "Undo " + this.undoManager.undoLabel : "Undo";
                evt.stop();
            } else if ("redo" === identifier) {
                menuItem.enabled = this.canRedo;
                //TODO localize
                menuItem.title = this.canRedo ? "Redo " + this.undoManager.redoLabel : "Redo";
                evt.stop();
            }
        }
    },

    handleMenuAction: {
        value: function (evt) {
            var identifier = evt.detail.identifier;

            if (this.editor.currentDocument !== this) {
                return;
            }

            if ("undo" === identifier) {
                if (this.canUndo) {
                    this.undo().done();
                }
                evt.stop();
            } else if ("redo" === identifier) {
                if (this.canRedo) {
                    this.redo().done();
                }
                evt.stop();
            }
        }
    },

    _mimeType: {
        value: null
    },

    mimeType: {
        get: function() {
            return this._mimeType;
        }
    },

    save: {
        value: function (location, dataWriter) {
            var self = this;

            this.dispatchEventNamed("willSave", true, false);
            return Promise.when(dataWriter(self.content, location)).then(function (value) {
                self.isDirty = false;
                self.dispatchEventNamed("didSave", true, false);
                return value;
            });
        }
    },

    _expectedRedoCount: {
        value: null
    },

    _expectedUndoCount: {
        value: null
    },

    handleCodeMirrorDocumentChange: {
        value: function(codeDoc, change) {
            var historySize = codeDoc.historySize(),
                undoHistoryCount = historySize.undo,
                redoHistoryCount = historySize.redo,
                undoDelta = undoHistoryCount - this._expectedUndoCount,
                redoDelta = redoHistoryCount - this._expectedRedoCount,
                undoManager = this.undoManager;

            // new undo discovered after this change applied; register a new undo
            if (0 !== undoDelta) {
                if (1 === undoDelta) {
                    this.undoManager.register("Edit", Promise.resolve([codeDoc.undo, codeDoc]));
                } else if (!(-1 === undoDelta && undoManager.isUndoing)) {
                    throw new Error("CodeMirror unexpectedly altered the number of undo operations");
                }

                this._expectedUndoCount = undoHistoryCount;
            }

            // new redo discovered after this change applied; register a new redo
            if (0 !== redoDelta) {

                if (1 === redoDelta && undoManager.isUndoing) {
                    this.undoManager.register("Edit", Promise.resolve([codeDoc.redo, codeDoc]));
                } else if (!(-1 === redoDelta && undoManager.isRedoing)) {
                    // A new operation was performed, forking the CM history; the redo stack has been cleared
                    // The stack cleared should match the count of our own redo stack
                    if (redoDelta < 0 && redoDelta === (this._expectedRedoCount * -1) && !undoManager.isUndoing && !undoManager.isRedoing) {
                        undoManager.clearRedo();
                    } else {
                        throw new Error("CodeMirror unexpectedly altered the number of redo operations");
                    }
                }

                this._expectedRedoCount = redoHistoryCount;
            }
        }
    }

},{

    editorMimeType:{
        value: function(fileUrl) {
            if (CodeEditorDocument.editorFileMatchJavaScript(fileUrl)) {
                return "application/javascript";
            } else if (CodeEditorDocument.editorFileMatchCss(fileUrl)) {
                return "text/css";
            } else if (CodeEditorDocument.editorFileMatchHtml(fileUrl)) {
                return "text/montage-template";
            } else if (CodeEditorDocument.editorFileMatchJson(fileUrl)) {
                return "application/json";
            } else if (CodeEditorDocument.editorFileMatchGLSL(fileUrl)) {
                return "x-shader/x-fragment";
            }
            return "text/plain";
        }
    },

    editorFileMatchJavaScript:{
        enumerable:false,
        value:function (fileUrl) {
            return (/\.js\/?$/).test(fileUrl);
        }
    },

    editorFileMatchCss:{
        enumerable:false,
        value:function (fileUrl) {
            return (/\.css\/?$/).test(fileUrl);
        }
    },

    editorFileMatchHtml:{
        enumerable:false,
        value:function (fileUrl) {
            return (/\.html\/?$/).test(fileUrl) || (/\.htm\/?$/).test(fileUrl);
        }
    },

    editorFileMatchJson:{
        enumerable:false,
        value:function (fileUrl) {
            return (/\.json\/?$/).test(fileUrl);
        }
    },

    editorFileMatchGLSL:{
        enumerable:false,
        value:function (fileUrl) {
            return (/\.glsl\/?$/).test(fileUrl);
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            return require.loadPackage(packageUrl).then(function (packageRequire) {

                var deferredDocument = Promise.defer();
                var request = new XMLHttpRequest();
                request.withCredentials = true;

                request.open("GET", fileUrl);
                request.addEventListener("load", function () {
                    if (request.status === 200) {
                        deferredDocument.resolve(new CodeEditorDocument().init(fileUrl, packageRequire, request.responseText));
                    } else {
                        deferredDocument.reject(
                            new Error("Failed to load document at'" + fileUrl + "' with status: " + request.status)
                        );
                    }
                }, false);
                request.addEventListener("error", function (event) {
                    deferredDocument.reject(
                        new Error("Failed to load document at '" + fileUrl + "' with error: " + event.error + ".")
                    );
                }, false);
                request.send();

                return deferredDocument.promise;
            });
        }
    },

    editorType: {
        get: function () {
            return CodeEditor;
        }
    }

});