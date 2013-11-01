var DocumentEditor = require("./document-editor.reel").DocumentEditor,
    WeakMap = require("montage/collections/weak-map"),
    Editor = require("palette/ui/editor.reel").Editor,
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

                // Element highlight stage -> domExplorer & templateExplorer
                this.addEventListener("elementHover", this, false);
                // Element highlight DOM Explorer -> stage
                this.addEventListener("highlightStageElement", this, false);
                // Component highlight templateExplorer -> stage & domExplorer
                this.addEventListener("highlightComponent", this, false);
                // deHighlight everywhere
                this.addEventListener("deHighlight", this, false);

                this.addRangeAtPathChangeListener("currentDocument.selectedObjects", this, "handleSelectedObjectsChange");
                this.addRangeAtPathChangeListener("currentDocument.selectedElements", this, "handleSelectedElementsChange");
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
            var editorArea,
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
                existingListener = evt.detail.existingListener,
                listenerJig,
                overlay;

            listenerJig = this.templateObjects.listenerCreator;

            // If the listener jig is already referring to this listener, leave what's already in the overlay in case user was editing
            if (listenerJig.existingListener !== existingListener) {
                listenerJig.listenerModel = listenerModel;
                listenerJig.existingListener = existingListener;
            }

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

            // If the binding jig is already referring to this binding, leave what's already in the overlay in case user was editing
            if (bindingJig.existingBinding !== existingBinding) {
                bindingJig.bindingModel = bindingModel;
                bindingJig.existingBinding = existingBinding;
            }

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

    handleSelectComponent: {
        value: function (evt) {
            this.currentDocument.selectObject(evt.detail.templateObject);
        }
    },

    handleSelectElement: {
        value: function (evt) {
            this.currentDocument.selectElement(evt.detail.proxy, true);
        }
    },

    handleSelectedObjectsChange: {
        value: function (selectedObjects, oldSelectedObjects){
            if (!selectedObjects || selectedObjects.length > 0) {
                this.currentDocument.activeSelection = this.currentDocument.selectedObjects;
                this.currentDocument.clearSelectedElements();
            }
        }
    },

    handleSelectedElementsChange: {
        value: function (selectedElements, oldSelectedElements){
            if (!selectedElements || selectedElements.length > 0) {
                this.currentDocument.activeSelection = this.currentDocument.selectedElements;
                this.currentDocument.clearSelectedObjects();
            }
        }
    },

    /*
        Tree-way "assymetrical" highlighting

        - domExplorer: has elements and components,
        but not all sub elements/components.

        - stage: has everything

        - templateExplorer: has only components and no sub-components
    */

    clearHighlighting: {
        value: function(){
            var domExplorer = this.templateObjects.domExplorer,
                documentEditor = this.currentDocument,
                templateExplorer = this.templateObjects.templateExplorer;

            // de-highlight domExplorer element
            domExplorer.highlightedElement = null;
            // de-highlight templateExplorer component
            templateExplorer.highlightedComponent = null;
            // de-highlight stage
            documentEditor.clearHighlightedElements();
        }
    },

    // Highlighting from stage
    handleElementHover: {
        value: function (evt) {
            var detail = evt.detail,
                highlight = detail.highlight,
                xpath = detail.xpath,
                parentComponents = detail.parentComponents,
                documentEditor = this.currentDocument,
                domExplorer = this.templateObjects.domExplorer,
                templateExplorer = this.templateObjects.templateExplorer,
                parentComponentId;

            this.clearHighlighting();
            if (!highlight) {return;}

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
            while (!nodeProxy && parentComponents.length > 0 && (parentComponentId = parentComponents.shift())) {
                nodeProxy = documentEditor.nodeProxyForMontageId(parentComponentId);
            }

            // set domExplorer's highlighted element
            domExplorer.highlightedElement = nodeProxy;

            if (nodeProxy && nodeProxy.component) {
                // set templateExplorer's highlighted component
                templateExplorer.highlightedComponent = nodeProxy.component;
                // highlight the stageElement to simulate a hover
                if (nodeProxy.component.stageObject) {
                    element = nodeProxy.component.stageObject.element;
                    if (element) {
                        documentEditor.highlightElement(element);
                    }
                }
            }
        }
    },

    handleDeHighlight: {
        value: function (evt) {
            this.clearHighlighting();
        }
    },

    // Highlighting from the domExplorer
    handleHighlightStageElement: {
        value: function (evt) {
            var detail = evt.detail,
                highlight = detail.highlight,
                xpath = detail.xpath,
                component = detail.component,
                proxy = detail.proxy,
                documentEditor = this.currentDocument,
                editingController = documentEditor._editingController,
                stageDocument = editingController ? editingController.frame.iframe.contentDocument : void 0,
                domExplorer = this.templateObjects.domExplorer,
                templateExplorer = this.templateObjects.templateExplorer;

            this.clearHighlighting();
            if (!highlight) {return;}

            if (stageDocument) {
                var stageElement = stageDocument.evaluate(
                    xpath,
                    stageDocument,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                // handle highlighting at the component level if the DOM element is not found
                if (!stageElement && component && component.stageObject) {
                    stageElement = component.stageObject.element;
                }

                // highlight the stageElement
                if (stageElement) {
                    documentEditor.highlightElement(stageElement);
                }
            }

            // set domExplorer's highlighted element (hover effect)
            domExplorer.highlightedElement = proxy;
            // set templateExplorer's highlighted component
            templateExplorer.highlightedComponent = component || null;
        }
    },

    // Highlighting from the template Explorer
    handleHighlightComponent: {
        value: function (evt) {
            var detail = evt.detail,
                highlight = detail.highlight,
                component = detail.component,
                element = detail.element,
                stageObject = component.stageObject,
                stageElement = stageObject ? stageObject.element : void 0,
                domExplorer = this.templateObjects.domExplorer,
                documentEditor = this.currentDocument,
                templateExplorer = this.templateObjects.templateExplorer;

            this.clearHighlighting();
            if (!highlight) {return;}

            // set domExplorer's highlighted element
            if (element) {
                domExplorer.highlightedElement = element;
            }
            // set templateExplorer's highlighted component (hover effect)
            if (component) {
                templateExplorer.highlightedComponent = component;
            }
            // highlight the stageElement
            if (stageElement) {
                documentEditor.highlightElement(stageElement);
            }
        }
    }

});
