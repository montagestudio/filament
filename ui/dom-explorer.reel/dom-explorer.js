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

    templateObjectsController: {
        value: null
    },

    editingDocument: {
        value: null
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

    highlightedElement : {
        value: null
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
                transferObject,
                html;

            if (transferObject = detail.transferObject) {

                var serializationFragment = transferObject.serializationFragment;
                var htmlFragment = transferObject.htmlFragment;
                var parentNode = detail.parentNode;

                this.editingDocument.addLibraryItemFragments(serializationFragment, htmlFragment, parentNode, null, null).done();
            } else if (html = detail.htmlElement) {
                var newNode = this.editingDocument.createTemplateNode(html);
                this.editingDocument.appendChildToTemplateNode(newNode, evt.detail.parentNode);
                this.templateObjects.createNodeCell.reset();
            } else {
                var self =  this;
                var insertionFunction = function (newNode) {
                    self.editingDocument.appendChildToTemplateNode(newNode, evt.detail.parentNode);
                };

                this._insertElement(insertionFunction);
            }
        }
    },

    handleInsertBeforeNode: {
        value: function (evt) {
            var detail = evt.detail,
                transferObject,
                html;

            if (transferObject = detail.transferObject) {
                var serializationFragment = transferObject.serializationFragment;
                var htmlFragment = transferObject.htmlFragment;
                var nextSibling = detail.nextSibling;
                var parentNode = nextSibling.parentNode;

                this.editingDocument.addLibraryItemFragments(serializationFragment, htmlFragment, parentNode, nextSibling, null).done();

            } else if (html = detail.htmlElement) {
                var newNode = this.editingDocument.createTemplateNode(html);
                this.editingDocument.insertNodeBeforeTemplateNode(newNode, evt.detail.nextSibling);
                this.templateObjects.createNodeCell.reset();
            } else {
                var self =  this;
                var insertionFunction = function (newNode) {
                    self.editingDocument.insertNodeBeforeTemplateNode(newNode, evt.detail.nextSibling);
                };

                this._insertElement(insertionFunction);
            }
        }
    },

    handleInsertAfterNode: {
        value: function (evt) {
            var detail = evt.detail,
                transferObject,
                html;

            if (transferObject = detail.transferObject) {
                var serializationFragment = transferObject.serializationFragment;
                var htmlFragment = transferObject.htmlFragment;
                var nextSibling = detail.previousSibling.nextSibling;
                var parentNode = detail.previousSibling.parentNode;

                this.editingDocument.addLibraryItemFragments(serializationFragment, htmlFragment, parentNode, nextSibling, null).done();

            } else if (html = detail.htmlElement) {
                var newNode = this.editingDocument.createTemplateNode(html);
                this.editingDocument.insertNodeAfterTemplateNode(newNode, evt.detail.previousSibling);
                this.templateObjects.createNodeCell.reset();
            } else {
                var self =  this;
                var insertionFunction = function (newNode) {
                    self.editingDocument.insertNodeAfterTemplateNode(newNode, evt.detail.previousSibling);
                };

                this._insertElement(insertionFunction);
            }
        }
    }

});
