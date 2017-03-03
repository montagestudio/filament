/**
 * @module ui/component-tree.reel/cell.reel/add-entity.reel
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class AddEntity
 * @extends Component
 */
exports.AddEntity = Component.specialize(/** @lends AddEntity# */ {

    isDropTarget: {
        value: false
    },

    enterDocument: {
        value: function (firstTime) {
            this.super(firstTime);
            if (firstTime) {
                this.element.addEventListener("dragover", this, false);
                this.element.addEventListener("dragenter", this, false);
                this.element.addEventListener("dragleave", this, false);
                this.element.addEventListener("drop", this, false);
            }
        }
    },

    acceptsDrop: {
        value: function (event) {
            // TODO: Condition to check entity ancestry
            return true;
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
            this.isDropTarget = this.isDropTarget || this.acceptsDrop(event);
        }
    },

    handleDragleave: {
        value: function (event) {
            this.isDropTarget = this.isDropTarget && !this.acceptsDrop(event);
        }
    },

    handleDrop: {
        value: function (event) {
            var dataTransfer = event.dataTransfer,
                types = dataTransfer.types;
            event.stopPropagation();
            if (types.indexOf(MimeTypes.ENTITY) !== -1) {
                // TODO: Get proxy from component tree
                console.log("drop:", dataTransfer.getData(MimeTypes.ENTITY));
                // var proxy = JSON.parse(dataTransfer.getData(MimeTypes.ENTITY));
                this.dispatchEventNamed("moveEntity", true, true, {
                    //proxy: proxy
                });
            }
            this.isDropTarget = false;
            this.dispatchEventNamed("addProxyOut", true, true);
        }
    }
});
