var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    DocumentEditor = require("./document-editor.reel").DocumentEditor,
    Promise = require("montage/core/promise").Promise,
    WeakMap = require("montage/collections/weak-map"),
    Editor = require("palette/ui/editor.reel").Editor,
    getElementXPath = require("palette/core/xpath").getElementXPath,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

exports.ComponentEditor = Editor.specialize({

    projectController: {
        value: null
    },

    viewController: {
        value: null
    },

    templateObjectsController: {
        value: null
    },

    _editorsToInsert: {
        value: null
    },

    _editorsToRemove: {
        value: null
    },

    _documentEditorSlot: {
        value: null
    },

    _openEditors: {
        value: null
    },

    _frontEditor: {
        value: null
    },

    nextTarget: {
        get: function () {
            // Consider whichever documentEditor is upfront to be the nextTarget
            return this._frontEditor;
        }
    },

    constructor: {
        value: function ComponentEditor() {
            this.super();
            this._editorsToInsert = [];
            this._editorsToRemove = [];
            this._openEditors = [];
            this._documentEditorMap = new WeakMap();
        }
    },

    openDocument: {
        value: function (document) {
            var editor;

            if (document) {
                editor = this._documentEditorMap.get(document);

                if (!editor) {
                    editor = new DocumentEditor();
                    editor.projectController = this.projectController;
                    editor.viewController = this.viewController;
                    editor.load(document).done();
                    this._documentEditorMap.set(document, editor);
                }

                if (!editor.element) {
                    this._editorsToInsert.push(editor);
                    this._openEditors.push(editor);
                }

                //TODO why are these done here and not in the template? not sure they need to be here
                this.addEventListener("addListenerForObject", this, false);
                this.addEventListener("addBinding", this, false);
                this._frontEditor = editor;
                if (editor.acceptsActiveTarget) {
                    defaultEventManager.activeTarget = editor;
                }

                this.needsDraw = true;

                // Element highlight stage -> DOM Explorer
                this.addEventListener("elementHover", this, false);
                // Element highlight DOM Explorer -> stage
                this.addEventListener("highlightStageElement", this, false);
                this.addEventListener("deHighlightDomExplorerElement", this, false);
            }
        }
    },

    closeDocument: {
        value: function (document) {
            var editor,
                editorIndex;

            if (document) {
                editor = this._documentEditorMap.get(document);

                if (editor) {
                    this._editorsToRemove.push(editor);
                    editorIndex = this._openEditors.indexOf(editor);
                    if (-1 !== editorIndex) {
                        this._openEditors.splice(editorIndex, 1);
                    }
                }
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {

            var self = this,
                editorArea,
                element,
                editorElement,
                frontEditor = this._frontEditor;

            if (this._editorsToInsert.length) {
                editorArea = this._documentEditorSlot;

                this._editorsToInsert.forEach(function (editor) {
                    element = document.createElement("div");
                    editor.element = element;
                    editorArea.appendChild(element);
                    editor.attachToParentComponent();
                    editor.needsDraw = true;
                });
                this._editorsToInsert = [];
            }

            if (this._editorsToRemove.length) {
                editorArea = this._documentEditorSlot;

                this._editorsToRemove.forEach(function (editor) {
                    editorArea.removeChild(editor.element);
                });
                this._editorsToRemove = [];
            }

            this._openEditors.forEach(function (editor) {
                editorElement = editor.element;

                if (editorElement && editor === frontEditor) {
                    editorElement.classList.remove("standby");
                } else if (editorElement) {
                    editor.element.classList.add("standby");
                }
            });

        }
    },

    handleAddListenerForObject: {
        value: function (evt) {
            var listenerModel = evt.detail.listenerModel,
                listenerJig,
                overlay;

            listenerJig = this.templateObjects.listenerCreator;
            listenerJig.listenerModel = listenerModel;

            overlay = this.templateObjects.eventTargetOverlay;
//            overlay.anchor = evt.target.element; //TODO when anchoring works well inside this scrollview
            overlay.show();
        }
    },

    handleListenerCreatorCommit: {
        value: function (evt) {
            this.templateObjects.eventTargetOverlay.hide();
        }
    },

    handleListenerCreatorDiscard: {
        value: function (evt) {
            this.templateObjects.eventTargetOverlay.hide();
        }
    },

    handleAddBinding: {
        value: function (evt) {
            var bindingModel = evt.detail.bindingModel,
                existingBinding = evt.detail.existingBinding,
                bindingJig,
                overlay;

            bindingJig = this.templateObjects.bindingCreator;
            bindingJig.bindingModel = bindingModel;
            bindingJig.existingBinding = existingBinding;

            overlay = this.templateObjects.bindingOverlay;
//            overlay.anchor = evt.target.element; //TODO when anchoring works well inside this scrollview
            overlay.show();
        }
    },

    handleBindingCreatorCommit: {
        value: function (evt) {
            this.templateObjects.bindingOverlay.hide();
        }
    },

    handleBindingCreatorDiscard: {
        value: function (evt) {
            this.templateObjects.bindingOverlay.hide();
        }
    },

    handleSelect: {
        value: function (evt) {
            this.currentDocument.selectObject(evt.detail.templateObject);
        }
    },

    // Event dispatched on stage element hover
    handleElementHover: {
        value: function (evt) {
            var detail = evt.detail,
                highlight = detail.highlight,
                xpath = detail.xpath,
                stageElement = detail.element,
                parentComponents = detail.parentComponents,
                documentEditor = this.currentDocument,
                stageDocument = documentEditor._editingController.frame.iframe.contentDocument,
                domExplorer = this.templateObjects.domExplorer;

            // de-highlight all DOM Elements
            domExplorer.highlightedDOMElement = null;

            // Ignore body
            if (xpath === "/html/body") {
                return;
            }
            
            var element = documentEditor.htmlDocument.evaluate(
                    xpath,
                    documentEditor.htmlDocument,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
            var nodeProxy = documentEditor.nodeProxyForNode(element);
            // handle highlighting at the component level if the DOM element is not found
            if (!nodeProxy && parentComponents) {
                var parentComponentId;
                do {
                    parentComponentId = parentComponents.shift();
                    nodeProxy = documentEditor.nodeProxyForMontageId(parentComponentId);
                } while (!nodeProxy);
            }

            // select the highlighted domExplorer element
            domExplorer.highlightedDOMElement = nodeProxy;

            // highlight the stageElement to simulate a hover
            if (nodeProxy.component) {
                xpath = getElementXPath(nodeProxy._templateNode);
                element = documentEditor.htmlDocument.evaluate(
                    xpath,
                    stageDocument,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                documentEditor.clearHighlightedElements();
                documentEditor.hightlightElement(element);
            }
        }
    },

    handleDeHighlightDomExplorerElement: {
        value: function (evt) {
            var domExplorer = this.templateObjects.domExplorer;
            domExplorer.highlightedDOMElement = null;
        }
    },

    // Event dispatched on DOM Explorer hover
    handleHighlightStageElement: {
        value: function (evt) {
            var detail = evt.detail,
                highlight = detail.highlight,
                xpath = detail.xpath,
                component = detail.component,
                documentEditor = this.currentDocument,
                stageDocument = documentEditor._editingController.frame.iframe.contentDocument;

            var element = documentEditor.htmlDocument.evaluate(
                xpath,
                stageDocument,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            // use the component stage element representation when the DON element can't be found
            if (!element && component) {
                element = component.stageObject.element;
            }

            if (highlight) {
                documentEditor.hightlightElement(element);
            }
            else {
                documentEditor.deHighlightElement(element);
            }
        }
    },

});
