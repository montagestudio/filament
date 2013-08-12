/**
    @module "./dom-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    emmet = require("core/filament-emmet"),
    MimeTypes = require("core/mime-types");

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

    __deferredElement: {
        value: null
    },

    _deferredElement : {
        get: function () {
            return this.__deferredElement;
        },
        set: function(value) {
            if (value === this.__deferredElement) {
                return;
            }

            this.dispatchBeforeOwnPropertyChange("isCreatingElement", this.isCreatingElement);
            this.__deferredElement = value;
            this.dispatchOwnPropertyChange("isCreatingElement", this.isCreatingElement);
        }
    },

    handleRemoveNode: {
        value: function (evt) {
            this.editingDocument.removeTemplateNode(evt.detail);
        }
    },

    _insertElement: {
        value: function (insertionFunction) {
            var self = this;

            if (this._deferredElement) {
                // Was in the middle of inserting a node, forget about that one now
                this._deferredElement.resolve(null);
                this._deferredElement = null;
            }

            this._deferredElement = Promise.defer();

            setTimeout(function () {
                self.templateObjects.tagField.element.focus();
            }, 100);

            this._deferredElement.promise.then(function (newNode) {
                if (newNode) {
                    insertionFunction(newNode);
                    self._deferredElement = null;
                    self.tag = null;
                }
            }).done();
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

    _createElement: {
        value: function () {
            if (this.tag) {
                var html = emmet.expandAbbreviation(this.tag);
                var newNode = this.editingDocument.createTemplateNode(html);
                this._deferredElement.resolve(newNode);
            }
        }
    },

    _cancelElementCreation: {
        value: function () {
            if (this._deferredElement) {
                this._deferredElement.resolve(null);
                this._deferredElement = null;
                this.tag = null;
            }
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
                transferObject;

            if (transferObject = detail.transferObject) {

                var serializationFragment = transferObject.serializationFragment;
                var htmlFragment = transferObject.htmlFragment;
                var parentNode = detail.parentNode;

                this.editingDocument.addLibraryItemFragments(serializationFragment, htmlFragment, parentNode, null, null).done();

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
                transferObject;

            if (transferObject = detail.transferObject) {
                var serializationFragment = transferObject.serializationFragment;
                var htmlFragment = transferObject.htmlFragment;
                var nextSibling = detail.nextSibling;
                var parentNode = nextSibling.parentNode;

                this.editingDocument.addLibraryItemFragments(serializationFragment, htmlFragment, parentNode, nextSibling, null).done();

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
                transferObject;

            if (transferObject = detail.transferObject) {
                var serializationFragment = transferObject.serializationFragment;
                var htmlFragment = transferObject.htmlFragment;
                var nextSibling = detail.previousSibling.nextSibling;
                var parentNode = detail.previousSibling.parentNode;

                this.editingDocument.addLibraryItemFragments(serializationFragment, htmlFragment, parentNode, nextSibling, null).done();

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
