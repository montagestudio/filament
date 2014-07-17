var PREDEFINED_COLORS = {
        GRID_RED: "rgba(255,0,0, 1)",
        GRID_GREEN: "rgba(0,128,0, 1)",
        GRID_BLUE: "rgba(0,0,255, 1)"
    },

    FlowEditorConfig = {

        cross: {
            xColor: PREDEFINED_COLORS.GRID_RED,
            yColor: PREDEFINED_COLORS.GRID_GREEN,
            zColor: PREDEFINED_COLORS.GRID_BLUE,
            font: "8px Arial"
        },

        viewPort: {
            _types: null,

            matrix: {
                top: [
                    0.1,  0,    0,   0,
                    0,    0,    1,   0,
                    0,    0.1,  0,   0,
                    0,    0,    0,   1
                ],
                front: [
                    0.1,  0,    0,   0,
                    0,    0.1,  0,   0,
                    0,    0,    1,   0,
                    0,    0,    0,   1
                ],
                profile: [
                    0,    0,    0.1, 0,
                    0,    0.1,  0,   0,
                    0.1,  0,    0,   0,
                    0,    0,    0,   1
                ]
            }
        },

        grid: {
            top: {
                colorAbscissa: PREDEFINED_COLORS.GRID_RED,
                colorOrdinate: PREDEFINED_COLORS.GRID_BLUE
            },
            front: {
                colorAbscissa: PREDEFINED_COLORS.GRID_RED,
                colorOrdinate: PREDEFINED_COLORS.GRID_GREEN
            },
            profile: {
                colorAbscissa: PREDEFINED_COLORS.GRID_BLUE,
                colorOrdinate: PREDEFINED_COLORS.GRID_GREEN
            }
        },

        stage: {
            slide: {
                min: 0,
                max: 100
            },

            propertiesNotRequiredForRefreshing: [
                'element',
                'flowEditorMetadata',
                'slotContent',
                'contentController',
                'content'
            ]
        },

        toolbar: {
            initialToolSelected: "convert",
            classBaseName: "flow-Editor-Toolbar-Button",
            classSelectedTools: "flow-Editor-Toolbar-Button--selected",
            items: [
                {
                    id: "convert",
                    title: "Move Tool",
                    canBeSelected: true
                },
                {
                    id: "pen",
                    title: "Pen Tool",
                    canBeSelected: true
                },
                {
                    id: "add",
                    title: "Pen Add Tool",
                    canBeSelected: true
                },
                {
                    id: "remove",
                    title: "Pen Remove Tool",
                    canBeSelected: true
                },
                {
                    id: "helix",
                    title: "Helix Tool",
                    canBeSelected: true
                },
                {
                    id: "zoomIn",
                    title: "Zoom In Tool",
                    canBeSelected: true
                },
                {
                    id: "zoomOut",
                    title: "Zoom Out Tool",
                    canBeSelected: true
                },
                {
                    id: "zoomExtents",
                    title: "Zoom Extents Tool",
                    canBeSelected: false
                },
                {
                    id: "inspector",
                    title: "Inspector Tool",
                    canBeSelected: false
                },
                {
                    id: "tree",
                    title: "Tree Tool",
                    canBeSelected: false
                },
                {
                    id: "close",
                    title: "Close",
                    canBeSelected: false
                }
            ]
        }
    };

Object.defineProperty(FlowEditorConfig.viewPort, "types", {
    configurable: false,
    get: function () {
        if (this._types === null) {
            this._types = Object.keys(FlowEditorConfig.viewPort.matrix).reduce(function(previous, current) {
                previous[current] = current;

                return previous;
            }, {});
        }

        return this._types;
    }
});

exports.FlowEditorConfig = FlowEditorConfig;
