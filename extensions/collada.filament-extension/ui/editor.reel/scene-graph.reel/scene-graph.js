/**
 * @module ui/scene-graph.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    NodeTemplate = require("library-items/mjs-volume/node.library-item/node.html").content,
    MIME_TYPES = require("core/mime-types"),
    ICON_PATH = "library-items/mjs-volume/node.library-item/node.png";

/**
 * @class SceneGraph
 * @extends Component
 */
exports.SceneGraph = Component.specialize(/** @lends SceneGraph# */ {

    constructor: {
        value: function SceneTreeView() {
            this.super();
        }
    },

    sceneLabel: {
        value: null
    },

    _scene: {
        value: null
    },

    scene: {
        set: function (scene) {
            if (scene) {
                if (!this._scene) {
                    var pathData = /([^\/]+)\.[^\.]+$|(?:[^\/]+)$/.exec(scene.path);

                    if (pathData && Array.isArray(pathData) && pathData.length === 2) {
                        this.fileName = pathData[1];
                    }

                    this._scene = scene;
                }
            } else {
                this._scene = null;
            }
        },
        get: function () {
            return this._scene;
        }
    },

    fileName: {
        value: null
    },

    sceneGraphTree: {
        value: null
    },

    _nodeTemplateHtmlDocument: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this);
            }
        }
    },

    _createNodeTemplate: {
        value: function (nodeElementID) {
            var htmlDocument = document.implementation.createHTMLDocument("");
            htmlDocument.documentElement.innerHTML = NodeTemplate;

            if (nodeElementID && this._scene) {
                var selector = "script[type='" + MIME_TYPES.SERIALIZATON_SCRIPT_TYPE + "']",
                    scriptSerialization = htmlDocument.querySelector(selector);

                if (scriptSerialization) {
                    var serialization = JSON.parse(scriptSerialization.textContent);

                    if (serialization && serialization.node) {
                        var node = serialization.node;

                        node.properties = node.properties ? node.properties : {};
                        node.properties.id = nodeElementID;
                        node.properties.scene = {"@": this.sceneLabel};

                        scriptSerialization.textContent = JSON.stringify(serialization);
                    }
                }
            }

            return htmlDocument.documentElement.outerHTML;
        }
    },

    selectNodeById: {
        value: function (id) {
            if (id) {
                this.sceneGraphTree.selectTreeControllerNodeById(id);
            }
        }
    },

    handleDragstart: {
        value: function (event) {
            var dataTransfer = event.dataTransfer;

            if (dataTransfer) {
                var nodeElementID = dataTransfer.getData(MIME_TYPES.TEXT_PLAIN);
                dataTransfer.effectAllowed = 'copy';

                if (nodeElementID) {
                    var nodeTemplate = this._createNodeTemplate(nodeElementID),
                        imageElement = document.createElement("img");

                    dataTransfer.setData(MIME_TYPES.TEMPLATE, nodeTemplate);

                    imageElement.src = require.location + ICON_PATH;
                    dataTransfer.setDragImage(imageElement, imageElement.width / 2, imageElement.height / 2);
                }
            }
        }
    }

});
