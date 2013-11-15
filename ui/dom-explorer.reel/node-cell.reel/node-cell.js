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

    addChildOver: {
        value: false
    },

    addAfterOver: {
        value: false
    },

    domExplorer: {
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

            this._nodeSegment.addEventListener("mouseover", this, false);
            this._nodeSegment.addEventListener("mouseout", this, false);

            this.templateObjects.montageId.addEventListener("action", this);
            this.element.addEventListener("mouseover", this);
            this.element.addEventListener("mouseout", this);
            this.element.addEventListener("dragleave", this, false);

            this.addEventListener("addelementout", this);
        }
    },

    handleDragstart: {
        value: function (event) {
            event.dataTransfer.effectAllowed = "copyMove";

            var nodeInfo = this.nodeInfo,
                component = nodeInfo.component,
                uuid = this.nodeInfo.uuid,
                sourceUuid = "x-montage-uuid/" + uuid;
            event.dataTransfer.setData(sourceUuid, uuid);
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

    acceptsDropAddElement: {
        value: function (evt) {
            return evt.dataTransfer.types &&
                (
                    evt.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1 ||
                    evt.dataTransfer.types.indexOf(MimeTypes.HTML_ELEMENT) !== -1
                );
        }
    },

    acceptsMoveDrop: {
        value: function (evt) {
            var types = evt.dataTransfer.types,
                uuid = this._getMontageUUID(types);

            return types && (uuid && uuid !== this.nodeInfo.uuid) &&
                (
                    types.indexOf(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) !== -1 ||
                    types.indexOf(MimeTypes.MONTAGE_TEMPLATE_XPATH) !== -1
                );
        }
    },

    addElementOver: {
        value: function () {
            this.domExplorer.addElementNodeHover = this;
        }
    },

    addElementOut: {
        value: function () {
            this.domExplorer.addElementNodeHover = null;
        }
    },

    handleAddelementout: {
        value: function (evt) {
            this.addElementOut();
        }
    },

    _getMontageUUID: {
        value: function (types) {
            if (!types) {
                return false;
            }
            var uuid = false;
            types.forEach(function (type, i) {
                if (type.startsWith("x-montage-uuid")) {
                    uuid = type.split("/")[1].toUpperCase();
                }
            });
            return uuid;
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

            this.dispatchEventNamed("highlightStageElement", true, true, {
                xpath: getElementXPath(this.nodeInfo._templateNode),
                proxy: this.nodeInfo,
                component: this.nodeInfo.component,
                highlight: true
            });
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsDropAddElement(evt) || this.acceptsMoveDrop(evt)) {
                this.addElementOver();
            }
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

            if (evt.target.classList.contains("NodeCellWrapper")) {
                this.domExplorer.addElementNodeHover = null;
                this.dispatchEventNamed("highlightStageElement", true, true, {
                    xpath: getElementXPath(this.nodeInfo._templateNode),
                    proxy: this.nodeInfo,
                    component: this.nodeInfo.component,
                    highlight: false
                });
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

    handleAddElementAfterInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertAfterNode", true, true, {
                previousSibling: this.nodeInfo,
                transferObject: evt.detail.transferObject
            });
        }
    },

    handleAddElementBeforeInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertBeforeNode", true, true, {
                nextSibling: this.nodeInfo,
                transferObject: evt.detail.transferObject
            });
        }
    },

    handleAddChildElementInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("appendNode", true, true, {
                parentNode: this.nodeInfo,
                transferObject: evt.detail.transferObject
            });
        }
    },

    handleAddElementAfterInsertElementAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertAfterNode", true, true, {
                previousSibling: this.nodeInfo,
                htmlElement: evt.detail.htmlElement
            });
        }
    },

    handleAddElementBeforeInsertElementAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertBeforeNode", true, true, {
                nextSibling: this.nodeInfo,
                htmlElement: evt.detail.htmlElement
            });
        }
    },

    handleAddChildElementInsertElementAction: {
        value: function (evt) {
            this.dispatchEventNamed("appendNode", true, true, {
                parentNode: this.nodeInfo,
                htmlElement: evt.detail.htmlElement
            });
        }
    },

    handleMoveTemplate: {
        value: function (evt) {
            var nodeInfo = this.nodeInfo,
                editingDocument = nodeInfo._editingDocument,
                detail = evt.detail,
                montageId = detail.montageId,
                xpath = detail.xpath,
                dispatchedDetail = {},
                eventName;

            if (montageId) {
                dispatchedDetail.nodeProxy = editingDocument.nodeProxyForMontageId(montageId);
            } else if (xpath) {
                dispatchedDetail.nodeProxy = editingDocument.nodeProxyForXPath(xpath);
            } else {
                throw new Error("Can not find the node to move");
            }

            switch (evt._target.identifier) {
            case "addElementBefore":
                dispatchedDetail.nextSibling = this.nodeInfo;
                eventName = "moveBeforeNode";
                break;
            case "addElementAfter":
                dispatchedDetail.previousSibling = this.nodeInfo;
                eventName = "moveAfterNode";
                break;
            case "addChildElement":
                dispatchedDetail.parentNode = this.nodeInfo;
                eventName = "moveChildNode";
                break;
            }

            this.dispatchEventNamed(eventName, true, true, dispatchedDetail);
        }
    },

    handleSelectComponentPress: {
        value: function (evt) {
            this.dispatchEventNamed("selectComponent", true, true, {
                templateObject: this.nodeInfo.component
            });
        }
    },

    handleSelectElementPress: {
        value: function (evt) {
            this.dispatchEventNamed("selectElement", true, true, {
                proxy: this.nodeInfo
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

    handleMontageParamAction: {
        value: function (evt) {
            var newMontageParam = evt.target.value,
                nodeProxy = this._nodeInfo;

            //TODO consolidate attribute constants somewhere
            if (!nodeProxy._editingDocument.setNodeProxyAttribute(nodeProxy, "data-param", newMontageParam)) {
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
