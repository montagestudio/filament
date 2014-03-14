/**
 * @module ui/inspector.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    SceneHelper = require("mjs-volume/runtime/scene-helper").SceneHelper,

    CONFIGURATION = {

        TEMPLATE_TYPES: {
            node: 'node',
            material: 'material'
        },

        ITEMS: {
            node: [
                {
                    label: "node",
                    index: 0
                },
                {
                    label: "material",
                    index: 1
                },
                {
                    label: "light",
                    index: 2
                },
                {
                    label: "camera",
                    index: 3
                }
            ],

            material: [
                {
                    label: "material",
                    index: 0
                }
            ]
        }
    };

/**
 * @class Inspector
 * @extends Component
 */
exports.Inspector = Component.specialize(/** @lends Inspector# */ {

    constructor: {
        value: function Inspector() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    sceneLabel: {
        value: null
    },

    toolBarItems: {
        value: null
    },

    templateType: {
        value: null
    },

    _glTFNode: {
        value: null
    },

    glTFNode: {
        set: function (element) {
            if (element !== this._glTFNode) {
                this._glTFNode = {
                    name: element.name,
                    materials: SceneHelper.getMaterialsFromNode(element).toArray()
                };
            }
        },
        get: function () {
            return this._glTFNode;
        }
    },

    selectedTemplate: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                application.addEventListener("sceneNodeSelected", this);

                this.addOwnPropertyChangeListener('selectedTemplate', this);
                this._populateToolBarItems();
            }
        }
    },

    handleSceneNodeSelected: {
        value: function (event) {
            var glTFNode = event.detail;

            if (glTFNode) {
                this.glTFNode = glTFNode;
            }
        }
    },

    handleSelectedTemplateChange: {
        value: function () {
            if (this.selectedTemplate) {
                var oldTemplateType = this.templateType,
                    newTemplateType = null;

                if (/mjs-volume\/runtime\/node/.test(this.selectedTemplate.exportId)) {
                    newTemplateType = CONFIGURATION.TEMPLATE_TYPES.node;
                } else if (/mjs-volume\/runtime\/material/.test(this.selectedTemplate.exportId)) {
                    newTemplateType = CONFIGURATION.TEMPLATE_TYPES.material;
                }

                if (oldTemplateType !== newTemplateType) {
                    this.templateType = newTemplateType;
                    this._populateToolBarItems();
                }
            }
        }
    },

    _populateToolBarItems: {
        value: function () {
            if (!this.templateType) {
                this.templateType = CONFIGURATION.TEMPLATE_TYPES.node;
            }

            this.toolBarItems = CONFIGURATION.ITEMS[this.templateType];

            if (this.toolBarItems.length > 0) {
                this.templateObjects.inspectorBar.barController.select(this.toolBarItems[0]);
            }
        }
    }

});
