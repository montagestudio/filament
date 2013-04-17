/**
    @module "./node-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
    Description TODO
    @class module:"./node-cell.reel".NodeCell
    @extends module:montage/ui/component.Component
*/
exports.NodeCell = Montage.create(Component, /** @lends module:"./node-cell.reel".NodeCell# */ {

    nodeInfo: {
        value: null
    },

    didCreate: {
        value: function () {
            this.addOwnPropertyChangeListener("nodeInfo.depth", this);
        }
    },

    handleDepthChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            this.element.style.paddingLeft = (20 * this.getPath("nodeInfo.depth")) + 'px';
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }
            this._element.addEventListener("dragover", this, false);
            this._element.addEventListener("drop", this, false);
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (event) {
            // TODO: security issues?
            var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                transferObject = JSON.parse(data),
                parentProxy = null,
                stageElement = null;

            //TODO well this is pretty bad
            stageElement = this.nodeInfo._editingDocument._editingController.owner.element.ownerDocument.querySelector("[data-montage-id=" + this.nodeInfo.montageId + "]");
            if (!stageElement) {
                return;
            }

            this.nodeInfo._editingDocument.DEMOinsertLibraryItem(transferObject.serializationFragment, this.nodeInfo._templateNode, stageElement).done();
        }
    }

});
