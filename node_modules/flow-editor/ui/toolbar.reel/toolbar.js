var Component = require("montage/ui/component").Component,
    ToolBarConfig = require("core/configuration").FlowEditorConfig.toolbar,
    ToolBarDelegate = require("core/toolbar-delegate").ToolBarDelegate,
    FlowEditorTools = require("core/flow-editor-tools").FlowEditorTools;

/**
 Description TODO
 @class module:"ui/toolbar.reel".Toolbar
 @extends module:montage/ui/component.Component
 */
exports.Toolbar = Component.specialize( /** @lends module:"ui/toolbar.reel".Toolbar# */ {

    constructor: {
        value: function Toolbar() {
            this.super();

            this.items = ToolBarConfig.items;
            this._delegate = new ToolBarDelegate();
            this._delegate.source = this;
        }
    },

    selectedTool: {
        value: null
    },

    items: {
        value: null
    },

    isTreeVisible: {
        value: false
    },

    isInspectorVisible: {
        value: false
    },

    selectedCell: {
        value: null
    },

    toolsOverlay: {
        value: null
    },

    _delegate: {
        value: null
    },

    _tools: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._tools = new FlowEditorTools();
                this.toolsOverlay.delegate = this;
            }
        }
    },

    handleFlowEditorToolbarItemListFirstDraw: {
        value: function () {
            this.selectTool(ToolBarConfig.initialToolSelected);
        }
    },

    handleButtonAction: {
        value: function (event) {
            if (event) {
                var sourceCell = event.detail.get("source");

                if (sourceCell) {
                    var buttonID = sourceCell.object.id;

                    if (sourceCell.object.canBeSelected) {
                        this.selectTool(buttonID);
                    }

                    if (this._delegate) {
                        var handlerName = "handle" + buttonID[0].toUpperCase() + buttonID.slice(1) + "Action";

                        if (handlerName && typeof this._delegate[handlerName] === "function") {
                            this._delegate[handlerName](event, this.viewPorts);
                        }
                    }
                }
            }
        }
    },

    handleButtonHold: {
        value: function (event) {
            var toolCell = event.target.detail.get('source');

            if (Array.isArray(toolCell.subTools) && toolCell.subTools.length > 0) {
                this.toolsOverlay.showAtTarget(toolCell);
            }
        }
    },

    handleSelectSubTool: {
        value: function (event, toolCell) {
            var toolSelected = event.detail.get('source');

            if (toolSelected && toolSelected.object) {
                toolCell.object = toolSelected.object;
                this._selectCellTool(toolCell.object.id);
            }
        }
    },

    selectTool: {
        value: function (key) {
            if (typeof key === "string") {
                var cells = this.templateObjects.flowEditorToolbarItemList.childComponents,
                    self = this,

                    exists = cells.some(function (cell) {
                        if (cell.object.id === key) {
                            if (self.selectedCell) {
                                self.selectedCell.unSelect();
                            }

                            cell.select();
                            self.selectedCell = cell;

                            return true;
                        }
                    });

                if (exists) {
                    this.selectedTool = this._tools.get(key);
                }
            }
        }
    }

});
