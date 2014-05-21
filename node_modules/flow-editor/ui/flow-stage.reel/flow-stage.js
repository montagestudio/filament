/**
 * @module ui/flow-stage.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,

    PROPERTIES_NOT_REQUIRED = [
        'element',
        'flowEditorMetadata',
        'slotContent',
        'contentController',
        'content'
    ];

/**
 * @class FlowStage
 * @extends Component
 */
exports.FlowStage = Component.specialize(/** @lends FlowStage# */ {

    constructor: {
        value: function FlowStage() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstime) {
            if (firstime) {
                Application.addEventListener("didSetOwnedObjectProperties", this);
            }
        }
    },

    exitDocument: {
        value: function () {
            Application.removeEventListener("didSetOwnedObjectProperties", this);
        }
    },

    editor: {
        value: null
    },

    paths: {
        value: null
    },

    handleDidSetOwnedObjectProperties: {
        value: function (event) {
            var detail = event.detail;

            if (detail && detail.proxy && /montage\/ui\/flow.reel/.test(detail.proxy.exportId)) {
                this.refreshStage();
            }
        }
    },

    refreshStage: {
        value: function () {
            if (this.editor && this.editor.object) {
                var flow = this.templateObjects.flow,
                    properties = this.editor.object.getObjectProperties();

                Object.keys(properties).forEach(function (key) {
                    if (PROPERTIES_NOT_REQUIRED.indexOf(key) < 0) {

                        flow[key] = properties[key];
                    }
                });

                flow.needsDraw = true;
            }
        }
    }

});
