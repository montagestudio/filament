/**
 * @module ui/flow-stage.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,
    StageConfig = require("core/configuration").FlowEditorConfig.stage;

/**
 * @class FlowStage
 * @extends Component
 */
exports.FlowStage = Component.specialize(/** @lends FlowStage# */ {

    constructor: {
        value: function FlowStage() {
            this.super();

            var content = [];

            for (var i = StageConfig.slide.min; i <= StageConfig.slide.max; i++) {
                content.push(i);
            }

            this.contentFlow = content
        }
    },

    editor: {
        value: null
    },

    contentFlow: {
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
                    if (StageConfig.propertiesNotRequiredForRefreshing.indexOf(key) < 0) {
                        flow[key] = objectProperties[key];
                    }
                });

                flow.needsDraw = true;
            }
        }
    }

});
