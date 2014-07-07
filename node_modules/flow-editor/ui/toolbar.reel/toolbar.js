var Component = require("montage/ui/component").Component,
    ToolBarConfig = require("core/configuration").FlowEditorConfig.toolbar,
    ToolBarDelegate = require("core/toolbar-delegate").ToolBarDelegate,
    PenTools = require("ui/pen-tools");

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
                this._tools = {
                    "arrow": PenTools.ArrowTool.create(), // Todo check if still used
                    "convert": PenTools.ConvertTool.create(),
                    "pen": PenTools.PenTool.create(),
                    "add": PenTools.AddTool.create(),
                    "helix": PenTools.HelixTool.create(),
                    "zoomOut": PenTools.ZoomOutTool.create(),
                    "zoomIn": PenTools.ZoomInTool.create(),
                    "remove": PenTools.RemoveTool.create()
                }; // Todo: create them lazily

                this.addPathChangeListener("templateObjects.flowEditorToolbarItemList._completedFirstDraw", this, "_handleToolItemsCompletedFirstDraw");
                this.toolsOverlay.delegate = this;
            }
        }
    },

    handleButtonAction: {
        value: function (event) {
            if (event) {
                var sourceCell = event.detail.get("source");

                if (sourceCell) {
                    var buttonID = sourceCell.object.id;

                    if (sourceCell.object.canBeSelected) {
                        this._selectCellTool(sourceCell);
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
                this._selectCellTool(toolCell);
            }
        }
    },

    _handleToolItemsCompletedFirstDraw: {
        value: function (completed) {
            if (completed) {
                var cells = this.templateObjects.flowEditorToolbarItemList.childComponents,
                    self = this;

                this.removePathChangeListener("templateObjects.flowEditorToolbarItemList._completedFirstDraw", this);

                var rep = cells.some(function (cell) {
                    if (cell.object.id === ToolBarConfig.initialToolSelected) {
                        self._selectCellTool(cell);

                        return true;
                    }
                });
            }
        }
    },

    _selectCellTool: {
        value: function (cell) {
            var buttonID = cell.object.id;

            if (this.selectedCell) {
                this.selectedCell.unSelect();
            }

            cell.select();
            this.selectedCell = cell;
            this.selectedTool = this._tools[buttonID];
        }
    }

});
