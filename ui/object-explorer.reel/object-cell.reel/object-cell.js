/**
 * @module ui/object-explorer.reel/object-cell.reel
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class ObjectCell
 * @extends Component
 */
exports.ObjectCell = Component.specialize(/** @lends ObjectCell# */ {

    constructor: {
        value: function ObjectCell() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this.element.addEventListener("dragstart", this);
            this.element.addEventListener("dragend", this);
            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("dragenter", this, false);
            this.element.addEventListener("dragleave", this, false);
            this.element.addEventListener("drop", this, false);

//            this._nodeSegment.addEventListener("mouseover", this, false);
//            this._nodeSegment.addEventListener("mouseout", this, false);
//
//            this.templateObjects.montageId.addEventListener("action", this);
//            this.element.addEventListener("mouseover", this);
//            this.element.addEventListener("mouseout", this);
//            this.element.addEventListener("dragleave", this, false);
//
//            this.addEventListener("addelementout", this);
        }
    },

    handleDragstart: {
        value: function (event) {
            this.classList.add("ObjectCell--dragged");

            var transfer = event.dataTransfer;
            transfer.setData(MimeTypes.SERIALIZATION_OBJECT_LABEL, this.data.label);
            transfer.setData("text/plain", "@" + this.data.label);
            event.dataTransfer.effectAllowed = "copyMove";
        }
    },

    handleDragend: {
        value: function () {
            this.classList.remove("ObjectCell--dragged");
        }
    },


    handleDragover: {
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
        value: function (event) {
            if (this.acceptsDrop(event) && (this.element === event.target || this.element.parentOf(event.target))) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        value: function (event) {
            if (this.acceptsDrop(event) && (this.element === event.target || this.element.parentOf(event.target))) {
                this.isDropTarget = true;
            }
        }
    },

    handleDrop: {
        value: function (event) {
        }
    },

    isDropTarget: {
        value: false
    },

    acceptsDrop: {
        value: function (event) {
            return false;
        }
    },

    /// MANUAL BINDINGS
    _data: {
        value: null
    },

    data: {
        get: function() {
            return this._data;
        },
        set: function(value) {
            if (this._data && this._data.removeEventListener) {
                // removeEventListener is redefined on ReelProxy
                Component.prototype.removeEventListener.call(this._data, "propertiesChange", this, false);
            }
            this._data = value;
            if (value && value.addEventListener) {
                // addEventListener is redefined on ReelProxy
                Component.prototype.addEventListener.call(value, "propertiesChange", this, false);
                this.updateDataDependencies();
            }
        }
    },

    explorer: {
        get: function() {
            return this._explorer;
        },
        set: function(value) {
            if (this._explorer && this._explorer.removeEventListener) {
                this._explorer.removeEventListener("propertiesChange", this, false);
            }
            this._explorer = value;
            if (value && value.addEventListener) {
                value.addEventListener("propertiesChange", this, false);
                this.updateExplorerDependencies();
            }
        }
    },

    templateDidLoad: {
        value: function() {
//            this.templateObjects.montageId.addPathChangeListener("isEditing", this, "handleMontageIdIsEditingChange");
            if (this.data) {
                this.updateDataDependencies();
            }
            if (this.explorer) {
                this.updateExplorerDependencies();
            }
        }
    },

    updateDataDependencies: {
        value: function() {
            var templateObjects = this.templateObjects;

            if (!templateObjects) {
                return;
            }

            var data = this.data;

            // direct properties of nodeInfo
            // @tagName: value <- @owner.nodeInfo.tagName
            templateObjects.objectName.value = data.label;

//            var componentLabel = nodeInfo.component && nodeInfo.component.label;
//
//            templateObjects.componentLabel.value = componentLabel;

            this.updateDataAndExplorerDependencies();

            return true;
        }
    },

    updateExplorerDependencies: {
        value: function() {
            var templateObjects = this.templateObjects;

            if (!templateObjects) {
                return;
            }

            this.updateDataAndExplorerDependencies();

            return true;
        }
    },

    updateDataAndExplorerDependencies: {
        value: function() {
            var templateObjects = this.templateObjects,
                explorer = this.explorer,
                highlightedObject,
                selectedObjects;

            if (!templateObjects) {
                return;
            }

            var data = this.data;
            if (explorer) {
                highlightedObject = this.explorer.highlightedObject;
                selectedObjects = this.explorer.editingDocument && this.explorer.editingDocument.selectedObjects;
            }
//
//            // @owner: classList.has('ObjectCell--highlighted') <- @owner.explorer.highlightedObject == @owner.data
            this.changeClassListItem(this.classList, 'ObjectCell--highlighted', highlightedObject === data);
            // @owner: classList.has('ObjectCell--selected') <- @owner.domExplorer.editingDocument.selectedObjects.has(@owner.data)
            this.changeClassListItem(this.classList, 'ObjectCell--selected', selectedObjects && selectedObjects.indexOf(data) >= 0);

            return true;
        }
    },

    changeClassListItem: {
        value: function(classList, name, value) {
            var hasClass = classList.has(name);

            if (value !== hasClass) {
                if (value) {
                    classList.add(name);
                } else {
                    classList.delete(name);
                }
            }
        }
    },

    handleSelectObjectPress: {
        value: function (evt) {
            this.dispatchEventNamed("selectTemplateObject", true, true, {
                templateObject: this.data
            });
        }
    },

    handleObjectNameAction: {
        value: function (evt) {
//            var newTagName = evt.target.value,
//                nodeProxy = this._nodeInfo;

//            if (!nodeProxy._editingDocument.setNodeProxyTagName(nodeProxy, newTagName)) {
//                evt.preventDefault();
//            }
        }
    },

    handlePropertiesChange: {
        value: function(event) {
            if (event.target === this.data) {
                this.updateDataDependencies();
            }
            if (event.target === this.explorer) {
                this.updateExplorerDependencies();
            }
        }
    }

});
