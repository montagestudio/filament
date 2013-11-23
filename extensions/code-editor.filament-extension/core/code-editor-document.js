var Promise = require("montage/core/promise").Promise;
var CodeEditor = require("ui/code-editor.reel").CodeEditor;
var Document = require("palette/core/document").Document;

var CodeEditorDocument = exports.CodeEditorDocument = Document.specialize({

    constructor: {
        value: function CodeEditorDocument() {
            this.super();
        }
    },

    content: {
        value: null
    },

    init: {
        value: function (fileUrl, packageRequire, content) {
            var self = this.super(fileUrl);
            self.content = content;

            self._fileType = CodeEditorDocument.editorFileType(fileUrl);
            self.codeEditorInstance = null;

            self.addPathChangeListener("content", self, "handleContentChange");

            return self;
        }
    },

    _fileType: {
        value: null
    },

    fileType: {
        get: function() {
            return this._fileType;
        }
    },

    handleContentChange: {
        value: function () {
        }
    },

    save: {
        value: function (location, dataWriter) {
            var self = this;

            this.dispatchEventNamed("willSave", true, false);
            return Promise.when(dataWriter(self.content, location)).then(function (value) {
                self._changeCount = 0;
                self.dispatchEventNamed("didSave", true, false);
                return value;
            });
        }
    }

},{

    editorFileType:{
        value: function(fileUrl) {
            if (CodeEditorDocument.editorFileMatchJavaScript(fileUrl)) {
                return "javascript";
            } else if (CodeEditorDocument.editorFileMatchCss(fileUrl)) {
                return "css";
            } else if (CodeEditorDocument.editorFileMatchHtml(fileUrl)) {
                return "html";
            } else if (CodeEditorDocument.editorFileMatchJson(fileUrl)) {
                return "json";
            }
            return "text";
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

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this;

            return require.loadPackage(packageUrl).then(function (packageRequire) {

                var deferredDocument = Promise.defer();
                var request = new XMLHttpRequest();

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