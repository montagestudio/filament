/**
 * @module ui/node-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    SceneEditorTools = require("core/scene-editor-tools"),
    MimeTypes = require("core/mime-types");

/**
 * @class NodeExplorer
 * @extends Component
 */
exports.NodeExplorer = Component.specialize(/** @lends NodeExplorer# */ {
    constructor: {
        value: function NodeExplorer() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    editor: {
        value: null
    },

    _willAcceptDrop: {
        value: null
    },

    selectedTemplate: {
        value: null
    },

    sceneGraph: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragover", this, false);
                this._element.addEventListener("dragleave", this, false);
                this._element.addEventListener("drop", this, false);
                this._element.addEventListener("click", this);
                application.addEventListener("sceneNodeSelected", this, false);
                this.addPathChangeListener("selectedTemplate", this, "handleSelectedTemplate");
            }
        }
    },

    _findTemplateWithId: {
        value: function (id) {
            var template = null,
                content = this.templateObjects.nodeTemplatesListController.content;

            if (typeof id === "string" && content) {
                content.some(function (reelProxy) {
                    var exist = false;

                    if (/mjs-volume\/runtime\/(node|material)/.test(reelProxy.exportId)) {
                        exist = reelProxy.properties.get("id") === id;

                        if (exist) {
                            template = reelProxy;
                        }
                    }

                    return exist;
                });
            }

            return template;
        }
    },

    handleSelectedTemplate: {
        value: function (selectedTemplate) {
            if (selectedTemplate) {
                if (SceneEditorTools.isNodeProxy(selectedTemplate.exportId)) {
                    this.sceneGraph.selectNodeById(selectedTemplate.properties.get("id"));
                } else if (SceneEditorTools.isMaterialProxy(selectedTemplate.exportId)) {
                    this.sceneGraph.clearSelection();
                }
            }
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            var availableTypes = event.dataTransfer.types;

            //Accept dropping prototypes from library
            if (availableTypes && availableTypes.has(MimeTypes.TEMPLATE)) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                this._willAcceptDrop = true;
            } else {
                event.dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
            }
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types,
                data,
                id;

            if (availableTypes) {
                if (availableTypes.has(MimeTypes.TEMPLATE) && availableTypes.has(MimeTypes.TEXT_PLAIN)) {
                    data = event.dataTransfer.getData(MimeTypes.TEMPLATE);
                    id = event.dataTransfer.getData(MimeTypes.TEXT_PLAIN);
                }

                if (data && id) {
                    var alreadyExist = this._findTemplateWithId(id);

                    if (alreadyExist) {
                        this.templateObjects.nodeTemplatesListController.select(alreadyExist);
                    } else {
                        var self = this;

                        this.editingDocument.insertTemplateContent(data).then(function (proxies) {
                            if (proxies && proxies.length > 0) {
                                proxies.some(function (proxy) {
                                    var proxyId = proxy.properties.get('id');

                                    if (proxyId && proxyId === id) {
                                        self.templateObjects.nodeTemplatesListController.select(proxy);

                                        return true;
                                    }
                                });
                            }
                        }).done();
                    }
                }
            }

            this._willAcceptDrop = false;
        }
    },

    handleSceneNodeSelected: {
        value: function (event) {
            var selectedNode = event.detail;

            if (selectedNode) {
                var template = this._findTemplateWithId(selectedNode.id);

                if (template) {
                    this.templateObjects.nodeTemplatesListController.select(template);
                } else {
                    this.templateObjects.nodeTemplatesListController.clearSelection();
                }
            }
        }
    },

    handleClick: {
        value: function (evt) {
            var target = evt.target;

            if (target === this.element) {
                this.templateObjects.nodeTemplatesListController.clearSelection();
                this.sceneGraph.clearSelection();
            }
        }
    }

});
