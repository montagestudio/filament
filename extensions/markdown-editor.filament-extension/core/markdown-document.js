var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    Editor = require("ui/editor.reel").Editor,
    Promise = require("montage/core/promise").Promise,
    marked = require('marked/lib/marked');

exports.MarkdownDocument = Montage.create(EditingDocument, {

    editorType: {
        get: function () {
            return Editor;
        }
    },

    load: {
        value: function (url) {
            var deferredDocument = Promise.defer(),
                request = new XMLHttpRequest(),
                self = this;

            request.open("GET", url);
            request.addEventListener("load", function() {
                if (request.status === 200) {
                    deferredDocument.resolve(self.create().init(url, request.responseText));
                } else {
                    deferredDocument.reject(
                        new Error("Failed to locad document at'" + url + "' with status: " + request.status)
                    );
                }
            }, false);
            request.addEventListener("error", function(event) {
                deferredDocument.reject(
                    new Error("Failed to load document at '" + url + "' with error: " + event.error + ".")
                );
            }, false);
            request.send();

            return deferredDocument.promise;
        }
    },

    content: {
        value: null
    },

    _markup: {
        value: null
    },

    markup: {
        get: function () {
            if (!this._markup) {
                this._markup = marked(this.content);
            }
            return this._markup;
        }
    },

    init: {
        value: function (url, content) {
            this._url = url;
            this.content = content;

            this.addPathChangeListener("content", this, "handleContentChange");

            return this;
        }
    },

    handleContentChange: {
        value: function () {
            this.dispatchBeforeOwnPropertyChange("markup", this.markup);
            this._markup = null;
            this.dispatchOwnPropertyChange("markup", this.markup);
        }
    },

    save: {
        value: function (location, dataWriter) {
            return dataWriter(this.content, location);
        }
    }

});
