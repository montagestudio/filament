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

    fileUrlEditorMap: {
        enumerable: false,
        value: null
    },

    fileUrlDocumentMap: {
        enumerable: false,
        value: null
    },

    didCreate: {
        value: function () {
            this.editorsToInsert = [];
            this.fileUrlEditorPromiseMap = {};
            this.fileUrlEditorMap = {};
            this.fileUrlDocumentMap = {};
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var documentEditorPromise = this.fileUrlEditorPromiseMap[fileUrl],
                deferredEditor,
                newEditor,
                editorFirstDrawHandler,
                editingDocument,
                editingDocumentPromise,
                self = this;

            if (!documentEditorPromise) {
                deferredEditor = Promise.defer();
                documentEditorPromise = deferredEditor.promise;
                this.fileUrlEditorPromiseMap[fileUrl] = documentEditorPromise;

                newEditor = DocumentEditor.create();
                this.editorsToInsert.push(newEditor);

                editorFirstDrawHandler = function (evt) {
                    var editor = evt.target;
                    editor.removeEventListener("firstDraw", editorFirstDrawHandler, false);

                    self.fileUrlEditorMap[fileUrl] = editor;
                    deferredEditor.resolve(editor);
                };

                newEditor.addEventListener("firstDraw", editorFirstDrawHandler, false);
                this.needsDraw = true;
            }

            return documentEditorPromise.then(function (editor) {

                editingDocument = self.fileUrlDocumentMap[fileUrl];

                if (editingDocument) {
                    editingDocumentPromise = Promise.resolve(editingDocument);
                } else {
                    editingDocumentPromise = editor.load(fileUrl, packageUrl).then(function (editingDoc) {
                        self.fileUrlDocumentMap[fileUrl] = editingDoc;
                        return editingDoc;
                    });
                }

                //Update the stadby classes
                editingDocumentPromise.then(function () {
                    self.needsDraw = true;
                });

                return editingDocumentPromise;
            });
        }
    },

    draw: {
        value: function () {

            var self = this,
                editorArea,
                element,
                editorElement,
                fileUrls,
                currentFileUrl,
                editor;

            if (this.editorsToInsert.length) {
                editorArea = this.documentEditorSlot;

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

            //TODO optimize this entire draw method
            fileUrls = Object.keys(this.fileUrlEditorMap);
            currentFileUrl = this.getProperty("projectController.currentDocument.reelUrl"); //TODO fileUrl hopefully

            fileUrls.forEach(function (fileUrl) {
                editor = self.fileUrlEditorMap[fileUrl];
                editorElement = editor.element;

                if (editorElement && fileUrl === currentFileUrl) {
                    editorElement.classList.remove("standby");
                } else if (editorElement) {
                    editor.element.classList.add("standby");
                }
            });

        }
    }

});
