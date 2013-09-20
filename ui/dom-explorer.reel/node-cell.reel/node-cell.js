/**
    @module "./node-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    getElementXPath = require("palette/core/xpath").getElementXPath;

/**
    Description TODO
    @class module:"./node-cell.reel".NodeCell
    @extends module:montage/ui/component.Component
*/
exports.NodeCell = Montage.create(Component, /** @lends module:"./node-cell.reel".NodeCell# */ {

    _nodeSegment: {
        value: null
    },

    _nodeInfo: {
        value: null
    },

    editingDocument:{
        value: null
    },

    nodeInfo: {
        get: function() {
            return this._nodeInfo;
        },
        set: function(value) {
            if (this._nodeInfo === value) {
                return;
            }

            this._nodeInfo = value;

            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this._nodeSegment.addEventListener("dragstart", this);
            this._nodeSegment.addEventListener("dragover", this, false);
            this._nodeSegment.addEventListener("dragenter", this, false);
            this._nodeSegment.addEventListener("dragleave", this, false);
            this._nodeSegment.addEventListener("drop", this, false);

            this.templateObjects.montageId.addEventListener("action", this);
            this.element.addEventListener("mouseover", this);
            this.element.addEventListener("mouseout", this);
        }
    },

    handleDragstart: {
        value: function (event) {
            event.dataTransfer.effectAllowed = 'all';

            var nodeInfo = this.nodeInfo;

            var component = nodeInfo.component;
            if (component) {
                event.dataTransfer.setData(MimeTypes.SERIALIZATION_OBJECT_LABEL, component.label);
            }

            var montageId = nodeInfo.montageId;
            if (montageId) {
                event.dataTransfer.setData(MimeTypes.MONTAGE_TEMPLATE_ELEMENT, montageId);
                event.dataTransfer.setData("text/plain", '{"#": "' + montageId + '"}');
            } else {
                event.dataTransfer.setData(MimeTypes.MONTAGE_TEMPLATE_XPATH, getElementXPath(this.nodeInfo._templateNode));
            }
        }
    },

    isDropTarget: {
        value: false
    },

    acceptsDrop: {
        value: function (event) {
            return 0 !== this.nodeInfo.depth &&
                event.dataTransfer.types &&
                event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1 &&
                !this.nodeInfo.component;
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (this.acceptsDrop(event)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsDrop(evt) && (this._nodeSegment === evt.target || this._nodeSegment.parentOf(evt.target))) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        value: function (evt) {
            if (this.acceptsDrop(evt) && (this._nodeSegment === evt.target || this._nodeSegment.parentOf(evt.target))) {
                this.isDropTarget = false;
            }
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (event) {
            event.stop();
            // TODO: security issues?
            var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                transferObject = JSON.parse(data),
                nodeInfo = this.nodeInfo,
                editingDocument = nodeInfo._editingDocument,
                self = this;

            editingDocument.addAndAssignLibraryItemFragment(transferObject.serializationFragment, nodeInfo)
            .finally(function () {
                self.isDropTarget = false;
            })
            .done();
        }
    },

    handleRemoveNodeButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("removeNode", true, true, this.nodeInfo);
        }
    },

    handleAppendNodeButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("appendNode", true, true, {
                parentNode: this.nodeInfo
            });
        }
    },

    handleAppendNodeButtonInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("appendNode", true, true, {
                parentNode: this.nodeInfo,
                transferObject: evt.detail.transferObject
            });
        }
    },

    handleInsertBeforeNodeButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertBeforeNode", true, true, {
                nextSibling: this.nodeInfo
            });
        }
    },

    handleInsertBeforeNodeButtonInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertBeforeNode", true, true, {
                nextSibling: this.nodeInfo,
                transferObject: evt.detail.transferObject
            });
        }
    },

    handleInsertAfterNodeButtonAction: {
        value: function (evt) {
            //TODO prompt for tagName
            this.dispatchEventNamed("insertAfterNode", true, true, {
                previousSibling: this.nodeInfo
            });
        }
    },

    handleInsertAfterNodeButtonInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertAfterNode", true, true, {
                previousSibling: this.nodeInfo,
                transferObject: evt.detail.transferObject
            });
        }
    },

    handlePress: {
        value: function () {
            this.dispatchEventNamed("select", true, true, {
                templateObject: this.nodeInfo.component
            });
        }
    },

    handleTagNameAction: {
        value: function (evt) {
            var newTagName = evt.target.value,
                nodeProxy = this._nodeInfo;

            if (!nodeProxy._editingDocument.setNodeProxyTagName(nodeProxy, newTagName)) {
                evt.preventDefault();
            }
        }
    },

    handleMontageIdAction: {
        value: function (evt) {
            var newMontageId = evt.target.value,
                nodeProxy = this._nodeInfo;

            //TODO consolidate attribute constants somewhere
            if (!nodeProxy._editingDocument.setNodeProxyAttribute(nodeProxy, "data-montage-id", newMontageId)) {
                evt.preventDefault();
            }
        }
    },

    handleMontageArgAction: {
        value: function (evt) {
            var newMontageArg = evt.target.value,
                nodeProxy = this._nodeInfo;

            //TODO consolidate attribute constants somewhere
            if (!nodeProxy._editingDocument.setNodeProxyAttribute(nodeProxy, "data-arg", newMontageArg)) {
                evt.preventDefault();
            }
        }
    },

    handleMouseover: {
        value: function (evt) {
            this.dispatchEventNamed("highlightStageElement", true, true, {
                xpath: getElementXPath(this.nodeInfo._templateNode),
                proxy: this.nodeInfo,
                component: this.nodeInfo.component,
                highlight: true
            });
        }
    },

    handleMouseout: {
        value: function (evt) {
            this.dispatchEventNamed("highlightStageElement", true, true, {
                xpath: getElementXPath(this.nodeInfo._templateNode),
                proxy: this.nodeInfo,
                component: this.nodeInfo.component,
                highlight: false
            });
        }
    }

});
