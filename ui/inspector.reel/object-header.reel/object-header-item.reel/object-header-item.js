/**
 * @module ui/inspector.reel/object-header.reel//object-header-item.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ObjectHeaderItem
 * @extends Component
 */
exports.ObjectHeaderItem = Component.specialize(/** @lends ObjectHeaderItem# */ {

    object: {
        value: null
    },

    icon: {
        value: null
    },

    iconUrl: {
        get: function () {
            if (this.object && this.object.moduleId) {
                return this.application.delegate.projectController.iconUrlForModuleId(
                    this.object.exportId, this.object.exportName
                );
            } else {
                return document.baseURI + "/assets/icons/tag.png";
            }
        }
    },

    enterDocument: {
        value: function () {
            this.addOwnPropertyChangeListener("object", this);
        }
    },

    handleObjectChange: {
        value: function () {
            this.dispatchOwnPropertyChange("iconUrl", this.iconUrl);
        }
    }
});
