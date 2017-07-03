var WeakMap = require("montage/collections/weak-map"),
    Editor = require("palette/ui/editor.reel").Editor,
    Promise = require("montage/core/promise").Promise;

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

    _modalEditorSlot: {
        value: null
    },

    _documentNeedsRefresh: {
        value: false
    },

    constructor: {
        value: function ComponentEditor() {
            this.super();
            this._documentModalEditorMap = new WeakMap();
        }
    },

    friendlyName : {
        value: "Component Editor"
    },

    // Accept activeTarget status, this puts us in the position
    // of power when we need to validate menus etc.
    //
    // ModalEditors that we may be presenting are given a first
    // shot at being activeTarget, so if they rejected the role
    // and we made it this far, we do indeed want to accept it.
    acceptsActiveTarget: {
        value: true
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var app = this.templateObjects.application;
                app.addEventListener("enterModalEditor", this);
                app.addEventListener("exitModalEditor", this);
            }
        }
    },

    open: {
        value: function (doc) {
            this.dispatchBeforeOwnPropertyChange("modalEditorComponent", this.modalEditorComponent);
            var result = this.super(doc);
            this.dispatchOwnPropertyChange("modalEditorComponent", this.modalEditorComponent);
            this.needsDraw = true;
            return result;
        }
    },

    openDocument: {
        value: function (document) {

            if (document) {
                if (document.needsRefresh()) {
                    this._showLoadingPanel();
                    this._documentNeedsRefresh = true;
                } else if (document.errors.length > 0) {
                    this._showErrorPanel();
                } else {
                    this._hidePanel();
                }

                //TODO why are these done here and not in the template? not sure they need to be here
                this.addEventListener("addListenerForObject", this, false);
                this.addEventListener("addProperty", this, false);
                this.addEventListener("addBinding", this, false);

                this.needsDraw = true;
                document.editor = this;

                // Component highlight templateExplorer -> stage & domExplorer
                this.addEventListener("highlightComponent", this, false);
                // deHighlight everywhere
                this.addEventListener("deHighlight", this, false);
                // Library item dragend
                this.addEventListener("templateObjectDragend", this, false);
            }
        }
    },

    closeDocument: {
        value: function (document) {
            if (document) {
                this.needsDraw = true;
            }
        }
    },

    _refreshDocument: {
        value: function() {
            var self = this;

            this.dispatchOwnPropertyChange("currentDocument", null);
            this.dispatchOwnPropertyChange("editingDocument", null);
            return this._currentDocument.refresh().then(function() {
                self.dispatchOwnPropertyChange("currentDocument", self._currentDocument);
                self.dispatchOwnPropertyChange("editingDocument", self._editingDocument);
            });
        }
    },

    draw: {
        value: function () {
            var self = this,
                modalEditorArea = this._modalEditorSlot,
                modalEditorAreaHasContent = modalEditorArea.children.length > 0,
                modalEditor = this.modalEditorComponent,
                modalContentRange;

            // Remove content from modalEditor area if we need to
            // becaseuthere's no reason to show any modal editor
            // or if we need to present the expected modal editor
            if (modalEditorAreaHasContent && (
                !modalEditor ||
                (!modalEditor.element || !modalEditor.element.parentNode)))
            {
                modalContentRange = document.createRange();
                modalContentRange.selectNodeContents(modalEditorArea);
                modalContentRange.deleteContents();
            }

            if (this.modalEditorComponent) {
                this.element.classList.add("palettes-hidden");

                // The area has already been cleared; insert modal now
                if (!modalEditor.element) {
                    modalEditor.element = document.createElement("div");
                }

                if (!modalEditor.element.parentNode) {

                    modalEditorArea.appendChild(modalEditor.element);
                    modalEditor.attachToParentComponent();
                    modalEditor.needsDraw = true;
                }
            } else {
                this.element.classList.remove("palettes-hidden");
            }

            if (this._documentNeedsRefresh) {
                this._documentNeedsRefresh = false;
                // Update the document on the next tick because it's too slow
                // to do it inside the draw cycle.
                // This draw cycle is just useful to show the component editor
                // and the loading overlay.
                // Translated from Q.fcall(function() { return self._refreshDocument(); })
                Promise.resolve()
                .then(function() {
                    return self._refreshDocument();
                }).then(function() {
                    self._hidePanel();
                }, function(reason) {
                    console.log("Failed reloading document", reason);
                    self._showErrorPanel();
                });
            }
        }
    },

    _hidePanel: {
        value: function() {
            this.templateObjects.overlayPanel.visible = false;
        }
    },

    _showLoadingPanel: {
        value: function() {
            this.templateObjects.overlayPanelMessage.value = "Reloading Component…";
            this.templateObjects.overlayPanel.visible = true;
        }
    },

    _showErrorPanel: {
        value: function() {
            this.templateObjects.overlayPanelMessage.value = "Error: Invalid document…";
            this.templateObjects.overlayPanel.visible = true;
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

    handleAddProperty: {
        value: function (evt) {
            var propertyModel = evt.detail.propertyModel,
                existingPropertyKeys = evt.detail.existingPropertyKeys;
            this.propertyJig.isToggleBindingDisabled = false;
            this.propertyJig.model = propertyModel;
            this.propertyJig.existingPropertyKeys = existingPropertyKeys;
            this.propertyOverlay.show();
        }
    },

    handleAddBinding: {
        value: function (evt) {
            var bindingModel = evt.detail.bindingModel,
                existingPropertyKeys = evt.detail.existingPropertyKeys,
                bindingJig,
                overlay;

            bindingJig = this.templateObjects.bindingCreator;

            bindingJig.model = bindingModel;
            bindingJig.isToggleBindingDisabled = true;
            bindingJig.existingPropertyKeys = existingPropertyKeys;

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
            // for now we only support single element selection
            this.currentDocument.clearSelectedElements();
            this.currentDocument.selectElement(evt.detail.proxy);
        }
    },

    /*
        Tree-way "asymmetrical" highlighting

        - domExplorer: has elements and components,
        but not all sub elements/components.

        - stage: has everything

        - templateExplorer: has only components and no sub-components
    */

    clearHighlighting: {
        value: function(){
            var templateExplorer = this.templateObjects.templateExplorer;

            // de-highlight templateExplorer component
            templateExplorer.highlightedComponent = null;
        }
    },

    handleDeHighlight: {
        value: function (evt) {
            this.clearHighlighting();
        }
    },

    // Highlighting from the template Explorer
    handleHighlightComponent: {
        value: function (evt) {
            var detail = evt.detail,
                highlight = detail.highlight,
                component = detail.component,
                element = detail.element,
                templateExplorer = this.templateObjects.templateExplorer;

            this.clearHighlighting();
            if (!highlight) {return;}

            // set templateExplorer's highlighted component (hover effect)
            if (component) {
                templateExplorer.highlightedComponent = component;
            }
        }
    },

    handleExitModalEditorKeyPress: {
        enumerable: false,
        value: function () {
            this.exitModalEditor();
        }
    },

    handleExitModalEditor: {
        enumerable: false,
        value: function (event) {
            this.exitModalEditor();
        }
    },

    handleEnterModalEditor: {
        enumerable: false,
        value: function (event) {
            this.enterModalEditor(event.detail.modalEditor);
        }
    },

    /**
     * The map of documents to the modalEditor that is currently
     * in place for that document; if there is a modal editor
     * currently in place.
     * @private
     */
    _documentModalEditorMap: {
        value: null
    },

    /**
     * Exit the current modal editor for the current document
     * Currently, this simply removes the modal editor,
     * effectively leaving it regardless of its state.
     */
    exitModalEditor: {
        value: function () {
            //TODO gracefully try to exit the editor

            var modalEditor = this.modalEditorComponent,
                doc = this.currentDocument;

            if (doc && modalEditor) {
                this.dispatchBeforeOwnPropertyChange("modalEditorComponent", this.modalEditorComponent);
                this._documentModalEditorMap.delete(doc);
                this.dispatchOwnPropertyChange("modalEditorComponent", this.modalEditorComponent);
                this.needsDraw = true;
            }
        }
    },

    /**
     * Present the specified modal editor.
     * The editor object should already have been
     * initialized with the a document ahead of reaching
     * this point; this method simply presents the specified editor.
     * It is presumed that the editor is related to the
     * currentDocument.
     */
    enterModalEditor: {
        value: function (modalEditor) {
            var doc = this.currentDocument;
            if (doc) {
                this.dispatchBeforeOwnPropertyChange("modalEditorComponent", this.modalEditorComponent);
                this._documentModalEditorMap.set(doc, modalEditor);
                this.dispatchOwnPropertyChange("modalEditorComponent", this.modalEditorComponent);
                this.needsDraw = true;
            }
        }
    },

    /**
     * The current modalEditor that should be presented, if any,
     * based upon the current document
     *
     * This accommodates a single ComponentEditor presenting multiple
     * documents, some of which may be presenting a modal editor and some
     * that which are not.
     */
    modalEditorComponent: {
        get: function () {
            var doc = this.currentDocument;
            return doc ? this._documentModalEditorMap.get(doc) : null;
        }
    },

    preload: {
        value: function() {
            var self = this;
            var ReelDocument = require("core/reel-document").ReelDocument,
                reelDocument = new ReelDocument(),
                preloadPackageRequire,
                preloadDataSource;

            this.projectController.addEventListener("willOpenDocument", this, false);

            preloadPackageRequire = {
                location: "https://localhost/",
                async: function() {
                    return Promise.resolve({
                        PropertyDescriptor: {},
                        EventDescriptor: {},
                        ModuleId: Promise.resolve({
                            blueprint: {
                                addPropertyDescriptorGroupNamed: function(){}
                            }
                        })
                    });
                }
            };

            preloadDataSource = {
                read: function() {
                    return Promise.resolve(
                        require("./preload-document.html").content);
                },
                registerDataModifier: Function.noop,
                addEventListener: Function.noop
            };

            return reelDocument.init("https://localhost/module-id.reel", preloadDataSource, preloadPackageRequire).load()
            .then(function() {
                self._currentDocument = reelDocument;
            });
        }
    },

    handleWillOpenDocument: {
        value: function(event) {
            if (event.detail.editor === this) {
                this._currentDocument = null;
                this.dispatchOwnPropertyChange("currentDocument", null);
                this.projectController.removeEventListener("willOpenDocument", this, false);
            }
        }
    },

    //TODO this should be removed when no longer needed; it fulfills the API expected by the documentEditor this replaces
    refresh: {
        value: Function.noop
    }

}, {
    requestsPreload: {
        value: true
    }
});
