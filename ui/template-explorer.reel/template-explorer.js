/**
    @module "./template-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    MimeTypes = require("core/mime-types");

/**
    Description TODO
    @class module:"./template-explorer.reel".TemplateExplorer
    @extends module:montage/ui/component.Component
*/
exports.TemplateExplorer = Component.specialize(/** @lends module:"./template-explorer.reel".TemplateExplorer# */ {

    _showHidden: {
        value: false
    },

    _hiddenCardsCount: {
        value: 0
    },

    hiddenCardsCount: {
        get: function () {
            return this._hiddenCardsCount;
        },
        set: function (value) {
            if (value === this._hiddenCardsCount) {
                return;
            }
            this._hiddenCardsCount = value;
            this.needsDraw = true;
        }
    },

    showHidden: {
        get: function () {
            return this._showHidden;
        },
        set: function (value) {
            if (value === this._showHidden) {
                return;
            }

            this.dispatchBeforeOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
            this._templateObjectFilterPath = null;
            this._showHidden = value;
            this.dispatchOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
        }
    },

    _templateObjectFilterTerm: {
        value: null
    },

    templateObjectFilterTerm: {
        get: function () {
            return this._templateObjectFilterTerm;
        },
        set: function (value) {
            if (value === this._templateObjectFilterTerm) {
                return;
            }

            this.dispatchBeforeOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
            this._templateObjectFilterPath = null;
            this._templateObjectFilterTerm = value;
            this.dispatchOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
        }
    },

    _templateObjectFilterPath : {
        value: null
    },

    templateObjectFilterPath: {
        get: function () {
            var term = this.templateObjectFilterTerm,
                filterPath;

            if (!this._templateObjectFilterPath) {

                if (this._showHidden) {
                    filterPath = "";
                } else {
                    filterPath = "!editorMetadata.get('isHidden') && ";
                }

                if (term) {
                    // TODO remove manual capitalization once we can specify case insensitivity
                    var capitalizedTerm = term.toCapitalized();
                    filterPath += "!label.contains('owner') && (label.contains('" + term + "') || label.contains('" + capitalizedTerm + "'))";
                } else {
                    filterPath += "!label.contains('owner')";
                }

                this._templateObjectFilterPath = filterPath;
            }

            return this._templateObjectFilterPath;
        }
    },

    templateObjectsTree: {
        value: null
    },

    constructor: {
        value: function TemplateExplorer() {
            this.super();
            this.defineBinding("templateObjectsController.filterPath", {"<-": "templateObjectFilterPath"});
        }
    },

    _willAcceptDrop: {
        value: false
    },

    highlightedComponent: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this._element.addEventListener("dragover", this, false);
            this._element.addEventListener("dragleave", this, false);
            this._element.addEventListener("drop", this, false);

            this._element.addEventListener("click", this);

            this.addRangeAtPathChangeListener("editingDocument.selectedObjects", this, "handleSelectedObjectsChange");
            this.addEventListener("toggle", this);
        }
    },

    templateObjectsController: {
        value: null
    },

    editingDocument: {
        value: null
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            var availableTypes = event.dataTransfer.types;

            //Accept dropping prototypes from library
            if (availableTypes &&
                (availableTypes.has(MimeTypes.TEMPLATE) || availableTypes.has(MimeTypes.TEXT_PLAIN))) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                this._willAcceptDrop = true;
            } else {
                event.dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
            }
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types,
                data;

            if (availableTypes) {

                if (availableTypes.has(MimeTypes.TEMPLATE)) {
                    data = event.dataTransfer.getData(MimeTypes.TEMPLATE);
                } else if (availableTypes.has(MimeTypes.TEXT_PLAIN)) {
                    data = event.dataTransfer.getData(MimeTypes.TEXT_PLAIN);
                }

                // Insert template if we have data and it looks like a template
                // e.g. it starts with an "<", and optional leading whitespace
                if (data && /^\s*<\S+/.test(data)) {
                    this.editingDocument.insertTemplateContent(data).done();
                }
            }
            this._willAcceptDrop = false;
            event.preventDefault();
        }
    },

    handleClick: {
        value: function (evt) {
            var target = evt.target;

            // clear selection on click outside from cards
            if (
                    target === this.element ||
                    target === this.templateObjects.templateNodeList.element ||
                    (target.component && target.component.identifier === "row")
                ) {
                this.editingDocument.clearSelectedObjects();
                this.editingDocument.clearSelectedElements();
            }
        }
    },

    handleRemoveElementAction: {
        value: function (evt) {
            this.editingDocument.setOwnedObjectElement(evt.detail.get('templateObject'), null);
        }
    },

    handleSelectedObjectsChange: {
        value: function (selectedObjects, oldSelectedObjects) {
            if (!selectedObjects || 0 === selectedObjects.length || selectedObjects.length > 1) {
                return;
            }

            //TODO do something sane if multiple objects are selected
            var selectedObject = selectedObjects[0],
                iterations = this.templateObjects.templateTreeController.iterations,
                iterationCount,
                iteration,
                i,
                selectedIteration;

            for (i = 0, iterationCount = iterations.length; (!selectedIteration && (iteration = iterations[i])); i++) {
                if (selectedObject === iteration.object) {
                    selectedIteration = iteration;
                }
            }

            if (selectedIteration) {
                this._scrollToElement = selectedIteration.firstElement;
                this.needsDraw = true;
            }
        }
    },

    _scrollToElement: {
        value: null
    },

    draw: {
        value: function () {
            if (this._scrollToElement) {
                // NOTE we need to wait for the drawing of the repetition to settle down
                // before we scroll to the iteration element we determeind we need to go to
                // this check for the selected class feel a little brittle but works well enough right now
                if (this._scrollToElement.classList.contains('selected')) {
                    this._scrollToElement.scrollIntoViewIfNeeded();
                    this._scrollToElement = null;
                } else {
                    this.needsDraw = true;
                }
            }
            var label = this.element.querySelector(".TemplateExplorer-hiddenControl");
            label.classList.toggle("is-disabled", this.hiddenCardsCount === 0);
        }
    }

});
