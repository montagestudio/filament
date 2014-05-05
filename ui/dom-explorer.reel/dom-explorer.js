/**
    @module "./dom-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./dom-explorer.reel".DomExplorer
    @extends module:montage/ui/component.Component
*/
exports.DomExplorer = Montage.create(Component, /** @lends module:"./dom-explorer.reel".DomExplorer# */ {

    constructor: {
        value: function DomExplorer() {
            this.super();
            this.defineBinding("classList.has('DomExplorer--collapseDom')", {"<-": "collapseNonComponents"});
        }
    },


    // TODO this is a temporary solution inspired by main.js
    handleKeyPress: {
        value: function(evt) {
            var identifier = evt.identifier;

            switch (identifier) {
            case "cancelElementEscape":
                this._cancelElementCreation();
                break;
            }
        }
    },

    _editingDocument: {
        value: null
    },

    _editDocumentSelectedElementsListenerCancel: {
        value: null
    },

    _editDocumentSelectedObjectsListenerCancel: {
        value: null
    },

    editingDocument: {
        get: function() {
            return this._editingDocument;
        },
        set: function(value) {
            if (this._editingDocument !== value) {
                if (this._editingDocument) {
                    this._editDocumentSelectedElementsListenerCancel();
                    this._editDocumentSelectedObjectsListenerCancel();
                }
                this._editingDocument = value;
                if (value) {
                    this._editDocumentSelectedElementsListenerCancel = value.addRangeAtPathChangeListener("selectedElements", this, "handleSelectedElementsChange");
                    this._editDocumentSelectedObjectsListenerCancel = value.addRangeAtPathChangeListener("selectedObjects", this, "handleSelectedObjectsChange");
                }

                if (value && this.templateObjects) {
                    if (!value.templateBodyNode) {
                        return;
                    }
                    window.X = true;
                    console.timeStamp("START");
                    var startTime = window.performance.now();
                    this.templateObjects.nodeTreeController.content = value.templateBodyNode.children[0];
                    var endTime = window.performance.now();
                    console.timeStamp("END");
                    window.X = false;
                    console.log("dom-explorer: ", endTime - startTime);
                }
            }
        }
    },

    nodeTreeController: {
        value: null
    },

    tag: {
        value: null
    },

    _elementCreationForm: {
        value: null
    },

    isCreatingElement: {
        get: function () {
            return !!this._deferredElement;
        }
    },

    _highlightedElement : {
        value: null
    },

    highlightedElement : {
        get: function() {
            return this._highlightedElement;
        },
        set: function(value) {
            if (this._highlightedElement !== value) {
                this._highlightedElement = value;
                this._dispatchPropertiesChange();
            }
        }
    },

    _addElementNodeHover : {
        value: null
    },

    addElementNodeHover: {
        get: function () {
            return this._addElementNodeHover;
        },
        set: function (value) {
            if (value === this._addElementNodeHover) { return; }

            // handle vertical tree shifting by adding a class
            if (value) {
                var nodeInfo = value.nodeInfo;
                if (nodeInfo.canInsertBeforeNode) {
                    this.classList.add('shiftUp');
                } else {
                    this.classList.remove('shiftUp');
                }
            } else {
                this.classList.remove('shiftUp');
            }
            this._addElementNodeHover = value;
            this._dispatchPropertiesChange();
        }
    },

    _collapseNonComponents: {
        value: false
    },

    collapseNonComponents: {
        get: function() {
            return this._collapseNonComponents;
        },
        set: function(value) {
            if (this._collapseNonComponents !== value) {
                this._collapseNonComponents = value;
                this._dispatchPropertiesChange();
            }
        }
    },

    handleClick: {
        value: function (evt) {
            var target = evt.target;
            if (target === this.templateObjects.nodeList.element) {
                this.editingDocument.clearSelectedElements();
                this.editingDocument.clearSelectedObjects();
            }
        }
    },

    handleRemoveNode: {
        value: function (evt) {
            this.editingDocument.removeTemplateNode(evt.detail);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this.element.addEventListener("mouseout", this, false);
            this.element.addEventListener("dragleave", this, false);
            this.element.addEventListener("click", this, false);
            this.addEventListener("hideAddElements", this, false);
        }
    },

    handleDragleave: {
        value: function (evt) {
            if (evt.target.classList.contains('NodeCellWapper')) {
                this.hideAddElements();
            }
        }
    },

    handleTagFieldAction: {
        value: function (evt) {
            this._createElement();
        }
    },

    handleAddElementButtonAction: {
        value: function (evt) {
            this._createElement();
        }
    },

    hideAddElements: {
        value: function (evt) {
            this.addElementNodeHover = null;
        }
    },

    handleMouseout: {
        value: function (evt) {
            this.hideAddElements();
        }
    },

    handleHideAddElements: {
        value: function (evt) {
            this.hideAddElements();
        }
    },

    handleCancelElementButtonAction: {
        value: function (evt) {
            this._cancelElementCreation();
        }
    },

    handleAppendNode: {
        value: function (evt) {

            var detail = evt.detail,
                templateContent,
                jsonNode;
            // from library template
            if (templateContent = detail.template) {
                var parentNode = detail.parentNode;

                this.editingDocument.insertTemplateContent(templateContent, parentNode, null, null).done();
            // from user input
            } else if (jsonNode = detail.jsonNode) {
                var newNode = this.editingDocument.createTemplateNodeFromJSONNode(jsonNode);
                this.editingDocument.appendChildToTemplateNode(newNode, evt.detail.parentNode);
                this.templateObjects.createNodeCell.reset();
            }
        }
    },

    handleInsertBeforeNode: {
        value: function (evt) {
            var detail = evt.detail,
                templateContent,
                jsonNode;

            if (templateContent = detail.template) {
                var nextSibling = detail.nextSibling;
                var parentNode = nextSibling.parentNode;

                this.editingDocument.insertTemplateContent(templateContent, parentNode, nextSibling, null).done();

            } else if (jsonNode = detail.jsonNode) {
                var newNode = this.editingDocument.createTemplateNodeFromJSONNode(jsonNode);
                this.editingDocument.insertNodeBeforeTemplateNode(newNode, evt.detail.nextSibling);
                this.templateObjects.createNodeCell.reset();
            }
        }
    },

    handleInsertAfterNode: {
        value: function (evt) {
            var detail = evt.detail,
                templateContent,
                jsonNode;

            if (templateContent = detail.template) {
                var nextSibling = detail.previousSibling.nextSibling;
                var parentNode = detail.previousSibling.parentNode;

                this.editingDocument.insertTemplateContent(templateContent, parentNode, nextSibling, null).done();

            } else if (jsonNode = detail.jsonNode) {
                var newNode = this.editingDocument.createTemplateNodeFromJSONNode(jsonNode);
                this.editingDocument.insertNodeAfterTemplateNode(newNode, evt.detail.previousSibling);
                this.templateObjects.createNodeCell.reset();
            }
        }
    },

    handleMoveBeforeNode: {
        value: function (evt) {
            var detail = evt.detail,
                nodeProxy = detail.nodeProxy,
                nextSibling = detail.nextSibling;

            this.editingDocument.moveTemplateNodeBeforeNode(nodeProxy, nextSibling);
        }
    },

    handleMoveAfterNode: {
        value: function (evt) {
            var detail = evt.detail,
                nodeProxy = detail.nodeProxy,
                previousSibling = detail.previousSibling;

            this.editingDocument.moveTemplateNodeAfterNode(nodeProxy, previousSibling);
        }
    },

    handleMoveChildNode: {
        value: function (evt) {
            var detail = evt.detail,
                nodeProxy = detail.nodeProxy,
                parentNode = detail.parentNode;

            this.editingDocument.moveTemplateNodeChildNode(nodeProxy, parentNode);
        }
    },

    isDrawerOpen: {
        value: null
    },

    handleToggleDrawerAction: {
        value: function (evt) {
            this.isDrawerOpen = !this.isDrawerOpen;
            if (this.isDrawerOpen) {
                this.templateObjects.createNodeCell.focusTagName();
            } else {
                this.templateObjects.createNodeCell.reset();
            }
        }
    },

    // MANUAL BINDINGS
    handleSelectedElementsChange: {
        value: function() {
            this._dispatchPropertiesChange();
        }
    },

    handleSelectedObjectsChange: {
        value: function() {
            this._dispatchPropertiesChange();
        }
    },

    // PROPERTIES DISPATCHING, USED FOR MANUAL BINDINGS
    _dispatchPropertiesChange: {
        value: function() {
            this.dispatchEventNamed("propertiesChange", true, false);
        }
    }
});

