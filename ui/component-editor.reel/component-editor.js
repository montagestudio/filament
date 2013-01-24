var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    DocumentEditor = require("./document-editor.reel").DocumentEditor,
    Promise = require("montage/core/promise").Promise;

exports.ComponentEditor = Montage.create(Component, {

    editorsToInsert: {
        enumerable: false,
        value: null
    },

    documentEditorSlot: {
        enumerable: false,
        value: null
    },

    fileUrlEditorPromiseMap: {
        enumerable: false,
        value: null
    },

    didCreate: {
        value: function () {
            this.editorsToInsert = [];
            this.fileUrlEditorPromiseMap = {};
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var documentEditorPromise = this.fileUrlEditorPromiseMap[fileUrl],
                deferredEditor,
                newEditor,
                editorFirstDrawHandler;

            if (!documentEditorPromise) {
                deferredEditor = Promise.defer();
                documentEditorPromise = deferredEditor.promise;
                this.fileUrlEditorPromiseMap[fileUrl] = documentEditorPromise;

                newEditor = DocumentEditor.create();
                this.editorsToInsert.push(newEditor);

                editorFirstDrawHandler = function (evt) {
                    var editor = evt.target;
                    editor.removeEventListener("firstDraw", editorFirstDrawHandler, false);
                    deferredEditor.resolve(editor);
                };

                newEditor.addEventListener("firstDraw", editorFirstDrawHandler, false);
                this.needsDraw = true;
            }

            return documentEditorPromise.then(function (editor) {
                return editor.load(fileUrl, packageUrl);
            });
        }
    },

    draw: {
        value: function () {

            if (this.editorsToInsert.length) {
                var editorArea = this.documentEditorSlot,
                    element;

                //TODO do this in a fragment if possible
                this.editorsToInsert.forEach(function (editor) {
                    element = document.createElement("div");
                    element.classList.add("standby");
                    editor.element = element;
                    editorArea.appendChild(element);
                    editor.attachToParentComponent();
                    editor.needsDraw = true;
                });
                this.editorsToInsert = [];
            }

        }
    }

});
