var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    ToolBarConfig = require("core/configuration").FlowEditorConfig.toolbar,
    ToolBarDelegate = require("core/toolbar-delegate").ToolBarDelegate,
    PenTools = require("ui/pen-tools");

/**
    Description TODO
    @class module:"ui/toolbar.reel".Toolbar
    @extends module:montage/ui/component.Component
*/
exports.Toolbar = Montage.create(Component, /** @lends module:"ui/toolbar.reel".Toolbar# */ {

    constructor: {
        value: function ToolbarCell() {
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
                    "helix": PenTools.HelixTool.create()
                };

                this.selectedTool = this._tools.convert;
            }
        }
    },

    handleButtonAction: {
        value: function (event) {
            if (event) {
                var source = event.detail.get("source");

                if (source) {
                    var buttonID = source.object.id;

                    if (source.object.canBeSelected) {
                        if (this.selectedCell) {
                            this.selectedCell.buttonElement.classList.remove("flow-Editor-Toolbar-Button--selected");
                        }

                        this.selectedCell = source;
                        this.selectedTool = this._tools[buttonID];

                        source.buttonElement.classList.add("flow-Editor-Toolbar-Button--selected");
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
            //Todo display some addtional tools for the same category of tool within an orverlay.
        }
    },

    draw: {
        value: function () {
            if (!this.selectedButton) {
                var cells = this.templateObjects.flowEditorToolbarItemList.childComponents,
                    self = this;

                cells.some(function (cell) {
                    if (cell.object.id === ToolBarConfig.initialToolSelected) {
                        cell.buttonElement.classList.add("flow-Editor-Toolbar-Button--selected");
                        self.selectedCell = cell;
                    }
                });
            }
        }
    }

});
