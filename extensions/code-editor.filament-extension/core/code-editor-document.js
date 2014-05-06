var Promise = require("montage/core/promise").Promise;
var CodeEditor = require("ui/code-editor.reel").CodeEditor;
var Document = require("palette/core/document").Document;

var CodeEditorDocument = exports.CodeEditorDocument = Document.specialize({

    constructor: {
        value: function CodeEditorDocument(fileUrl) {
            this.super(fileUrl);
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
        value: function (fileUrl, dataSource) {
            this.super(fileUrl, dataSource);

            this._hasModifiedData = {undoCount: 0, redoCount: 0};
            this._mimeType = CodeEditorDocument.editorMimeType(fileUrl);
            this.codeEditorInstance = null;
            dataSource.registerDataModifier(this);

            return this;
        }
    },

    destroy: {
        value: function() {
            this._dataSource.unregisterDataModifier(this);
            this._dataSource.removeEventListener("dataChange", this, false);
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
        value: function (location) {
            var self = this;

            if (!this.hasModifiedData(location)) {
                return Promise.resolve();
            }

            this.dispatchEventNamed("willSave", true, false);
            this._resetModifiedDataState();
            return Promise.when(this._dataSource.write(location, self.content)).then(function (value) {
                self.isDirty = false;
                self._changeCount = 0;
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

            // TODO: I don't feel too confident in firing this event for all
            // files for performance reasons so I'm hard coding it here to CSS
            // files for the moment. There should be a way for interested
            // parties to announce they're interested in listening for changes
            // in particular files.
            if (/\.css$/.test(this.url)) {
                this.dispatchEventNamed("fileContentModified", true, false, {
                    url: this.url,
                    content: codeDoc.getValue()
                });
            }
        }
    },

    load: {
        value: function () {
            var self = this;

            return this._dataSource.read(this.url)
            .then(function (content) {
                self._dataSource.addEventListener("dataChange", self, false);
                self.content = content;
                return self;
            });
        }
    },

    _dataChanged: {
        value: null
    },

    _hasModifiedData: {
        value: null
    },

    hasModifiedData: {
        value: function(url) {
            if (url === this.url) {
                var undoManager = this._undoManager;
                var hasModifiedData = this._hasModifiedData;
                return undoManager && hasModifiedData &&
                    (hasModifiedData.undoCount !== undoManager.undoCount ||
                        hasModifiedData.redoCount !== undoManager.redoCount);
            }
        }
    },

    acceptModifiedData: {
        value: function(url) {
            if (url === this.url) {
                this.content = this.codeMirrorDocument.getValue();
                this._resetModifiedDataState();
                return Promise.resolve(this.content);
            }
        }
    },

    /**
     * When the modified data state is reseted the document stops reporting as
     * having modified the data source.
     */
    _resetModifiedDataState: {
        value: function() {
            this._hasModifiedData.undoCount = this._undoManager.undoCount;
            this._hasModifiedData.redoCount = this._undoManager.redoCount;
        }
    },

    rejectModifiedData: {
        value: function(url) {
            if (url === this.url) {
                console.warn("modifications reseted");
            }
        }
    },

    needsRefresh: {
        value: function() {
            return this._dataChanged ||
                this._dataSource.isModified(this.url);
        }
    },

    /**
     * Refreshes the document, it returns a promise for true or false indicating
     * if the refresh resulted in the content being changed or not.
     */
    refresh: {
        value: function() {
            var self = this;

            return this._dataSource.read(this.url).then(function(content) {
                self.content = content;
                self.codeMirrorDocument.setValue(content);
                self._dataChange = false;
                self._changeCount = 0;
                self._resetModifiedDataState();
                return true;
            });
        }
    },

    handleDataChange: {
        value: function() {
            this._changeCount = 0;
            this._dataChanged = true;
        }
    }

}, {

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
            } else if (CodeEditorDocument.editorFileMatchMarkdown(fileUrl)) {
                return "text/plain";
            }
            return null;
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

    editorFileMatchMarkdown:{
        enumerable:false,
        value:function (fileUrl) {
            return (/\.md\/?$/).test(fileUrl);
        }
    },

    editorType: {
        get: function () {
            return CodeEditor;
        }
    }

});
