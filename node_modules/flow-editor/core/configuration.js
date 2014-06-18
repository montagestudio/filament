var FlowEditorConfig = {

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
        items: [
            {
                id: "convert",
                title: "Move Tool",
                canBeSelected: true,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Convert"
                    ]
                },
                children: null
            },
            {
                id: "pen",
                title: "Pen Tool",
                canBeSelected: true,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Pen"
                    ]
                },
                children: null
            },
            {
                id: "add",
                title: "Pen Add Tool",
                canBeSelected: true,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Add"
                    ]
                },
                children: null
            },
            {
                id: "helix",
                title: "Helix Tool",
                canBeSelected: true,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Helix"
                    ]
                },
                children: null
            },
            {
                id: "zoomExtents",
                title: "Zoom Extents Tool",
                canBeSelected: false,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Zoom-Extends"
                    ]
                },
                children: null
            },
            {
                id: "inspector",
                title: "Inspector Tool",
                canBeSelected: false,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Inspector"
                    ]
                },
                children: null
            },
            {
                id: "tree",
                title: "Tree Tool",
                canBeSelected: false,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Tree"
                    ]
                },
                children: null
            },
            {
                id: "close",
                title: "Close",
                canBeSelected: false,
                cssRules:{
                    class: [
                        "flow-Editor-Toolbar-Button-Close"
                    ]
                },
                children: null
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
