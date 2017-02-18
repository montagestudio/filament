/**
    @module "./node-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    getElementXPath = require("palette/core/xpath").getElementXPath;

/**
    Description TODO
    @class module:"./node-cell.reel".NodeCell
    @extends module:montage/ui/component.Component
*/
exports.NodeCell = Component.specialize(/** @lends module:"./node-cell.reel".NodeCell# */ {
    constructor: {
        value: function NodeCell() {

        }
    },

    templateDidLoad: {
        value: function() {
            this._montageId.addPathChangeListener("isEditing", this, "handleMontageIdIsEditingChange");
            if (this.nodeInfo) {
                this.updateNodeInfoDependencies();
            }
            if (this.domExplorer) {
                this.updateDomExplorerDependencies();
            }
        }
    },

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

    _domExplorer: {
        value: null
    },

    domExplorer: {
        get: function() {
            return this._domExplorer;
        },
        set: function(value) {
            if (this._domExplorer && this._domExplorer.removeEventListener) {
                this._domExplorer.removeEventListener("propertiesChange", this, false);
            }
            this._domExplorer = value;
            if (value && value.addEventListener) {
                value.addEventListener("propertiesChange", this, false);
                this.updateDomExplorerDependencies();
            }
        }
    },

    nodeInfo: {
        get: function() {
            return this._nodeInfo;
        },
        set: function(value) {
            if (this._nodeInfo === value) {
                return;
            }

            if (this._nodeInfo && this._nodeInfo.removeEventListener) {
                this._nodeInfo.removeEventListener("propertiesChange", this, false);
            }
            this._nodeInfo = value;

            if (value && value.addEventListener) {
                value.addEventListener("propertiesChange", this, false);
                this.updateNodeInfoDependencies();
            }

            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this._nodeSegment.addEventListener("dragstart", this);
            this._nodeSegment.addEventListener("dragend", this);
            this._nodeSegment.addEventListener("dragover", this, false);
            this._nodeSegment.addEventListener("dragenter", this, false);
            this._nodeSegment.addEventListener("dragleave", this, false);
            this._nodeSegment.addEventListener("drop", this, false);

            this._nodeSegment.addEventListener("mouseover", this, false);
            this._nodeSegment.addEventListener("mouseout", this, false);

            this._montageId.addEventListener("action", this);
            this.element.addEventListener("mouseover", this);
            this.element.addEventListener("mouseout", this);
            this.element.addEventListener("dragleave", this, false);

            this.addEventListener("addelementout", this);
        }
    },

    handleDragstart: {
        value: function (event) {
            event.dataTransfer.effectAllowed = "copyMove";
            this.classList.add("NodeCell--dragged");
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

    handleDragend: {
        value: function (evt) {
            this.classList.remove("NodeCell--dragged");
        }
    },

    isDropTarget: {
        value: false
    },

    acceptsDrop: {
        value: function (event) {
            return 0 !== this.nodeInfo.depth &&
                event.dataTransfer.types &&
                event.dataTransfer.types.has(MimeTypes.SERIALIZATION_FRAGMENT) &&
                !this.nodeInfo.component;
        }
    },

    acceptsDropAddElement: {
        value: function (evt) {
            return evt.dataTransfer.types &&
                (
                    evt.dataTransfer.types.has(MimeTypes.TEMPLATE) ||
                    evt.dataTransfer.types.has(MimeTypes.TEXT_PLAIN) ||
                    evt.dataTransfer.types.has(MimeTypes.JSON_NODE)
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

            var dataTransfer = event.dataTransfer,
                nodeInfo = this.nodeInfo,
                editingDocument = nodeInfo._editingDocument,
                self = this,
                data;

            if (dataTransfer.types.has(MimeTypes.SERIALIZATION_FRAGMENT)) {
                data = dataTransfer.getData(MimeTypes.SERIALIZATION_FRAGMENT);

                editingDocument.insertTemplateObjectFromSerialization(data, nodeInfo).finally(function () {
                    self.isDropTarget = false;
                }).done();
            }
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
                template: evt.detail.template
            });
        }
    },

    handleAddElementBeforeInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertBeforeNode", true, true, {
                nextSibling: this.nodeInfo,
                template: evt.detail.template
            });
        }
    },

    handleAddChildElementInsertTemplateAction: {
        value: function (evt) {
            this.dispatchEventNamed("appendNode", true, true, {
                parentNode: this.nodeInfo,
                template: evt.detail.template
            });
        }
    },

    handleAddElementAfterInsertElementAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertAfterNode", true, true, {
                previousSibling: this.nodeInfo,
                jsonNode: evt.detail.jsonNode
            });
        }
    },

    handleAddElementBeforeInsertElementAction: {
        value: function (evt) {
            this.dispatchEventNamed("insertBeforeNode", true, true, {
                nextSibling: this.nodeInfo,
                jsonNode: evt.detail.jsonNode
            });
        }
    },

    handleAddChildElementInsertElementAction: {
        value: function (evt) {
            this.dispatchEventNamed("appendNode", true, true, {
                parentNode: this.nodeInfo,
                jsonNode: evt.detail.jsonNode
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
    },

    /// MANUAL BINDINGS
    _info: {
        value: null
    },

    info: {
        get: function() {
            return this._info;
        },
        set: function(value) {
            if (value !== this._info) {
                this._info = value;
                if (value) {
                    this.treeControllerNode = value;
                    this.nodeInfo = value.data;
                } else {
                    this.treeControllerNode = null;
                    this.nodeInfo = null;
                }
            }
        }
    },

    updateNodeInfoDependencies: {
        value: function() {
            if (typeof this._tagName === "undefined") {
                // Not loaded
                return;
            }

            var nodeInfo = this.nodeInfo;

            // direct properties of nodeInfo
            // @tagName: value <- @owner.nodeInfo.tagName
            this._tagName.value = nodeInfo.tagName;
            // @montageArg: value <- @owner.nodeInfo.montageArg
            this._montageArg.value = nodeInfo.montageArg;
            // @montageParam: value <- @owner.nodeInfo.montageParam
            this._montageParam.value = nodeInfo.montageParam;
            // @montageId: value <- @owner.nodeInfo.montageId
            this._montageId.value = nodeInfo.montageId;
            // @componentCondition: condition <- @owner.nodeInfo.component
            this._componentCondition.condition = !!nodeInfo.component;
            // @canRemoveNodeCondition: condition <- @owner.nodeInfo.canRemoveNode
            this._canRemoveNodeCondition.condition = nodeInfo.canRemoveNode;

            var childrenLength = nodeInfo && nodeInfo.children && nodeInfo.children.length || 0;
            var componentLabel = nodeInfo.component && nodeInfo.component.label;

            // @owner: classList.has('NodeCell--owner') <- nodeInfo.component.label == 'owner'
            this.changeClassListItem(this.classList, 'NodeCell--owner', componentLabel === "owner");
            // @owner: classList.has('NodeCell--noChildren') <- !@owner.nodeInfo.children.length
            this.changeClassListItem(this.classList, 'NodeCell--noChildren', childrenLength === 0);
            // @hasChildrenCondition: condition <- @owner.nodeInfo.children.length
            this._hasChildrenCondition.condition = childrenLength > 0;
            // @componentLabel: value <- @owner.nodeInfo.component.label
            this._componentLabel.value = componentLabel;

            this.updateNodeInfoAndMontageIdDependencies();
            this.updateNodeInfoAndDomExplorerDependencies();
        }
    },

    updateMontageIdDependencies: {
        value: function() {
            this.updateNodeInfoAndMontageIdDependencies();
        }
    },

    updateDomExplorerDependencies: {
        value: function() {
            var addElementNodeHover;

            if (typeof this._addElementBefore === "undefined") {
                // Not loaded
                return;
            }

            if (this.domExplorer) {
                addElementNodeHover = this.domExplorer.addElementNodeHover;
            }

            // @addElementBefore: classList.has('dropover') <- @owner.domExplorer.addElementNodeHover == @owner
            this.changeClassListItem(this._addElementBefore.classList, 'dropover', addElementNodeHover === this);
            // @addElementAfter: classList.has('dropover') <- @owner.domExplorer.addElementNodeHover == @owner
            this.changeClassListItem(this._addElementAfter.classList, 'dropover', addElementNodeHover === this);
            // @addChildElement: classList.has('dropover') <- @owner.domExplorer.addElementNodeHover == @owner
            this.changeClassListItem(this._addChildElement.classList, 'dropover', addElementNodeHover === this);

            this.updateNodeInfoAndDomExplorerDependencies();
        }
    },

    updateNodeInfoAndMontageIdDependencies: {
        value: function() {
            var childrenLength;

            if (typeof this._montageId === "undefined") {
                // Not loaded
                return;
            }

            var isEditing = this._montageId && this._montageId.isEditing;
            var nodeInfo = this.nodeInfo;
            if (nodeInfo) {
                childrenLength = nodeInfo.children && nodeInfo.children.length;
            }

            // @canInsertBeforeNodeCondition: condition <- @owner.nodeInfo.canInsertBeforeNode && && !@montageId.isEditing
            this._canInsertBeforeNodeCondition.condition = nodeInfo && nodeInfo.canInsertBeforeNode && !isEditing;
            // @canAppendNodeCondition: condition <- 0 == @owner.nodeInfo.children.length && @owner.nodeInfo.canAppendToNode && !@montageId.isEditing
            this._canAppendNodeCondition.condition = childrenLength === 0 && nodeInfo && nodeInfo.canAppendToNode && !isEditing;
            // @canInsertAfterNodeCondition: condition <- !@owner.nodeInfo.nextSibling &&  @owner.nodeInfo.canInsertAfterNode && !@montageId.isEditing
            this._canInsertAfterNodeCondition.condition = nodeInfo && (!nodeInfo.nextSibling && nodeInfo.canInsertAfterNode) && !isEditing;
            // @montageId: classList.has('montage-invisible') <- !@owner.nodeInfo.component || @owner.nodeInfo.component.label != @owner.nodeInfo.montageId
            this.changeClassListItem(this._montageId.classList, 'montage-invisible', !(nodeInfo && (!nodeInfo.component || nodeInfo.component.label !== nodeInfo.montageId)));

        }
    },

    updateNodeInfoAndDomExplorerDependencies: {
        value: function() {
            var highlightedElement;
            var selectedElements;

            var nodeInfo = this.nodeInfo;
            var domExplorer = this.domExplorer;
            if (domExplorer) {
                highlightedElement = domExplorer.highlightedElement;
                selectedElements = domExplorer.editingDocument && domExplorer.editingDocument.selectedElements;
            }

            // @owner: classList.has('NodeCell--highlighted') <- @owner.domExplorer.highlightedElement == @owner.nodeInfo
            this.changeClassListItem(this.classList, 'NodeCell--highlighted', highlightedElement === nodeInfo);
            // @owner: classList.has('NodeCell--selected') <- @owner.domExplorer.editingDocument.selectedElements.has(@owner.nodeInfo)
            this.changeClassListItem(this.classList, 'NodeCell--selected', selectedElements && selectedElements.indexOf(nodeInfo) >= 0);
        }
    },

    changeClassListItem: {
        value: function(classList, name, value) {
            var hasClass = classList.has(name);

            //jshint -W116
            if (value != hasClass) {
            //jshint +W116
                if (value) {
                    classList.add(name);
                } else {
                    classList.delete(name);
                }
            }
        }
    },

    handleMontageIdIsEditingChange: {
        value: function(event) {
            this.updateMontageIdDependencies();
        }
    },

    handlePropertiesChange: {
        value: function(event) {
            if (event.target === this.nodeInfo) {
                this.updateNodeInfoDependencies();
            } else if (event.target === this.domExplorer) {
                this.updateDomExplorerDependencies();
            }
        }
    }
});
