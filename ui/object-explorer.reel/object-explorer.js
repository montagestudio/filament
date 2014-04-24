/**
 * @module ui/object-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ObjectExplorer
 * @extends Component
 */
exports.ObjectExplorer = Component.specialize(/** @lends ObjectExplorer# */ {
    constructor: {
        value: function ObjectExplorer() {
            this.super();
        }
    },

    _editingDocument: {
        value: null
    },

    _editDocumentRangeListenerCancel: {
        value: null
    },

    editingDocument: {
        get: function() {
            return this._editingDocument;
        },
        set: function(value) {
            if (this._editingDocument !== value) {
                if (this._editingDocument) {
                    this._editDocumentRangeListenerCancel();
                }
                this._editingDocument = value;
                if (value) {
                    this._editDocumentRangeListenerCancel = value.addRangeAtPathChangeListener("selectedObjects", this, "handleSelectedObjectsChange");
                }
            }
        }
    },

    // MANUAL BINDINGS
    handleSelectedObjectsChange: {
        value: function() {
            this._dispatchPropertiesChange();
        }
    },

    // PROPERTIES DISPATCHING, USED FOR MANUAL BINDINGS
    _dispatchPropertiesChange: {
        value: function() {
            this.dispatchEventNamed("propertiesChange", true, false);
        }
    }

});
