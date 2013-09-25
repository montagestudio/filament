/**
 * @module ui/edit-properties-list.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;
var observeProperty = require("montage/frb/observers").observeProperty;

/**
 * @class EditPropertiesList
 * @extends Component
 */
exports.EditPropertiesList = Component.specialize(/** @lends EditPropertiesList# */ {
    constructor: {
        value: function EditPropertiesList() {
            this.super();
        }
    },

    observeProperty: {
        value: function (key, emit, scope) {
            if (
                key === "currentIteration" ||
                key === "objectAtCurrentIteration" ||
                key === "contentAtCurrentIteration"
            ) {
                if (this._repetition) {
                    return this._repetition.observeProperty(key, emit, scope);
                }
            } else {
                return observeProperty(this, key, emit, scope);
            }
        }
    },

    handleAddAction: {
        value: function (event) {
            if (this.dispatchEventNamed("add", true, true, this.templateObjects.newName.value)) {
                this.templateObjects.newName.value = "";
            }
        }
    },

    handleNewNameAction: {
        value: function () {
            if (this.dispatchEventNamed("add", true, true, this.templateObjects.newName.value)) {
                // the value can't be set while the text field has focus
                this.templateObjects.newName.element.blur();
                this.templateObjects.newName.value = "";
            }
        }
    },

    handleRemoveAction: {
        value: function (event) {
            this.dispatchEventNamed("remove", true, false, event.detail.get("object"));
        }
    },
});
