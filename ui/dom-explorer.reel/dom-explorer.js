/**
    @module "./dom-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    emmet = require("core/filament-emmet");

/**
    Description TODO
    @class module:"./dom-explorer.reel".DomExplorer
    @extends module:montage/ui/component.Component
*/
exports.DomExplorer = Montage.create(Component, /** @lends module:"./dom-explorer.reel".DomExplorer# */ {

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

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._elementCreationForm.addEventListener("submit", this);
                this._elementCreationForm.addEventListener("reset", this);
            }
        }
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
                self.templateObjects.tagField.focus();
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

    handleSubmit: {
        value: function (evt) {
            if (this._elementCreationForm === evt.target) {
                evt.stop();
                if (this.tag) {
                    var html = emmet.expandAbbreviation(this.tag);
                    var newNode = this.editingDocument.createTemplateNode(html);
                    this._deferredElement.resolve(newNode);
                }
            }
        }
    },

    //TODO handle esc to cancel as well
    handleReset: {
        value: function (evt) {
            if (this._elementCreationForm === evt.target) {
                evt.stop();

                if (this._deferredElement) {
                    this._deferredElement.resolve(null);
                    this._deferredElement = null;
                    this.tag = null;
                }
            }
        }
    },

    handleAppendNode: {
        value: function (evt) {
            var self =  this;
            var insertionFunction = function (newNode) {
                self.editingDocument.appendChildToTemplateNode(newNode, evt.detail.parentNode);
            };

            this._insertElement(insertionFunction);
        }
    },

    handleInsertBeforeNode: {
        value: function (evt) {
            var self =  this;
            var insertionFunction = function (newNode) {
                self.editingDocument.insertNodeBeforeTemplateNode(newNode, evt.detail.nextSibling);
            };

            this._insertElement(insertionFunction);
        }
    },

    handleInsertAfterNode: {
        value: function (evt) {
            var self =  this;
            var insertionFunction = function (newNode) {
                self.editingDocument.insertNodeAfterTemplateNode(newNode, evt.detail.previousSibling);
            };

            this._insertElement(insertionFunction);
        }
    },

    handleSelect: {
        value: function (evt) {
            this.editingDocument.selectObject(evt.detail.templateObject);
        }
    }

});
