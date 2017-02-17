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

    componentStore: {
        value: null
    },

    handleCellButtonAction: {
        value: function () {
            this.componentStore.select(this.info.data.proxy);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.addPathChangeListener("info.isExpanded", this, "handleExpandedChange");
            }
        }
    },

    handleExpandedChange: {
        value: function (isExpanded) {
            var data = this.info ? this.info.data : null;
            if (isExpanded && data && data.proxy.prototypeModuleId && !data.isPreloaded) {
                this.componentStore.preloadChildrenOfComponent(this.info.data.proxy.prototypeModuleId)
                    .then(function () {
                        data.isPreloaded = true;
                    });
            }
        }
    }

});
