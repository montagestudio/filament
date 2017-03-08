/**
 * @module ui/component-tree.reel/cell.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * An enum-style object holding constants for each of the different types
 * of data that can be represented by a cell.
 * 
 * @type {CellType}
 */
exports.CellType = {
    Entity: "entity",
    Property: "property",
    Listener: "listener",
    Function: "function",
    Class: "class"
};

/**
 * @class Cell
 * @extends Component
 */
exports.Cell = Component.specialize(/** @lends Cell# */ {

    info: {
        value: null
    },

    componentTree: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            var cellElement = this.cell.element;
            if (firstTime) {
                this.addPathChangeListener("info.isExpanded", this, "handleExpandedChange");
                cellElement.addEventListener("dragstart", this);
                cellElement.addEventListener("dragend", this);
                cellElement.addEventListener("dragenter", this, false);
                cellElement.addEventListener("dragleave", this, false);
                cellElement.addEventListener("mouseover", this, false);
            }
        }
    },

    handleExpandedChange: {
        value: function (isExpanded) {
            var data = this.info ? this.info.data : null;
            if (isExpanded && data && data.proxy.moduleId && !data.isExpanded) {
                this.componentTree.expandProxy(this.info.data.proxy);
                data.isExpanded = true;
            }
        }
    },

    handleDragstart: {
        value: function (event) {
            event.dataTransfer.effectAllowed = "copyMove";
            this.classList.add("Cell--dragged");
            this.dragDelegate.beginDragging(this.info.row, this.info.data);
        }
    },

    handleDragend: {
        value: function (evt) {
            this.classList.remove("Cell--dragged");
            this.dragDelegate.endDrag();
        }
    },

    handleDragenter: {
        value: function (event) {
            if (this.info.data.proxy) {
                this.componentTree.addEntityNodeHover = this;
            }
        }
    },

    handleAddProxyOut: {
        value: function (evt) {
            if (this.info.data.proxy) {
                this.componentTree.addEntityNodeHover = null;
            }
        }
    },

    handleMoveEntity: {
        value: function (event) {
            var addEntity = event.target;
            this.classList.remove("Cell--dragged");
            this.dragDelegate.endDrag(this.info.data, addEntity.type);
        }
    }
});
