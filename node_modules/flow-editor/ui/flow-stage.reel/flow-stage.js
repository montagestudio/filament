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

    editor: {
        value: null
    },

    refresh: {
        value: function (objectProperties) {
            if (!objectProperties) {
                if (this.editor && this.editor.object) {
                    objectProperties = this.editor.object.getObjectProperties();
                }
            }

            if (objectProperties) {
                var flow = this.templateObjects.flow;

                Object.keys(objectProperties).forEach(function (key) {
                    if (PROPERTIES_NOT_REQUIRED.indexOf(key) < 0) {
                        flow[key] = objectProperties[key];
                    }
                });

                flow.needsDraw = true;
            }
        }
    }

});
