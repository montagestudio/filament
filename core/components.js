// Set of components available for use in the authoring system
// TODO replace with dynamic browsing of available modules informed by ComponentDescriptions
exports.components = [
    {
        label: "Button",
        name: "Button",
        serialization: {
            "prototype": "montage/ui/button.reel",
            "properties": {
                "label": "Button",
                "enabled": true
            }
        },
        icon: "assets/components/button.png",
        html: '<button data-montage-id=""></button>'
    },
    {
        label: "Toggle",
        name: "ToggleButton",
        serialization: {
            "prototype": "montage/ui/toggle-button.reel",
            "properties": {
                "value": true,
                "pressedLabel": "On",
                "unpressedLabel": "Off"
            }
        },
        icon: "assets/components/toggle-button.png",
        html: '<button data-montage-id=""></button>'
    },
    {
        label: "Checkbox",
        name: "InputCheckbox",
        serialization: {
            "prototype": "montage/ui/input-checkbox.reel",
            "properties": {
                "checked": true
            }
        },
        icon: "assets/components/input-checkbox.png",
        html: '<input type="checkbox" data-montage-id="">'
    },
    {
        label: "Radio",
        name: "InputRadio",
        serialization: {
            "prototype": "montage/ui/input-radio.reel",
            "properties": {
                "checked": true
            }
        },
        icon: "assets/components/input-radio.png",
        html: '<input type="radio" data-montage-id="">'
    },
    {
        label: "Range",
        name: "InputRange",
        serialization: {
            "prototype": "montage/ui/input-range.reel",
            "properties": {
                "minValue": 0,
                "maxValue": 100,
                "value": 50
            }
        },
        icon: "assets/components/input-range.png",
        html: '<input type="range" data-montage-id="">'
    },
    {
        label: "Select",
        name: "Select",
        serialization: {
            "prototype": "montage/ui/select.reel"
        },
        icon: "assets/components/select.png",
        html: '<select data-montage-id=""><option value="">Select</option></select>'
    },
    {
        label: "DynamicText",
        name: "DynamicText",
        serialization: {
            "prototype": "montage/ui/dynamic-text.reel",
            "properties": {
                "value": "Text"
            }
        },
        icon: "assets/components/dynamic-text.png",
        html: '<p data-montage-id=""></p>'
    },
    {
        label: "InputText",
        name: "InputText",
        serialization: {
            "prototype": "montage/ui/input-text.reel",
            "properties": {
                "value": "Editable text"
            }
        },
        icon: "assets/components/input-text.png",
        html: '<input data-montage-id="" type="text">'
    },
    {
        label: "Textarea",
        name: "Textarea",
        serialization: {
            "prototype": "montage/ui/textarea.reel",
            "properties": {
                "value": "Textarea"
            }
        },
        icon: "assets/components/textarea.png",
        html: '<textarea data-montage-id=""></textarea>'
    },
    {
        label: "Image",
        name: "Image",
        serialization: {
            "prototype": "montage/ui/image.reel",
            "properties": {
                "src": "http://client/node_modules/palette/assets/image/placeholder.png"
            }
        },
        icon: "assets/components/image.png",
        html: '<img data-montage-id="">'
    },
    {
        label: "Progress",
        name: "Progress",
        serialization: {
            "prototype": "montage/ui/progress.reel",
            "properties": {
                "max": 100,
                "value": 50
            }
        },
        icon: "assets/components/progress.png",
        html: '<progress data-montage-id=""></progress>'
    },
    {
        label: "Repetition",
        name: "Repetition",
        serialization: {
            "prototype": "montage/ui/repetition.reel",
            "properties": {
                "objects": [1, 2, 3]
            }
        },
        icon: "assets/components/repetition.png",
        html: '<ul data-montage-id=""><li>Item</li></ul>'
    },
    {
        label: "Flow",
        name: "Flow",
        serialization: {
            "prototype": "montage/ui/flow.reel",
            "properties": {
                "objects": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                "paths": [
                    {
                        "knots": [
                            {
                                "knotPosition": [-1200, 0, 0],
                                "nextHandlerPosition": [-400, 0, 0],
                                "previousDensity": 12,
                                "nextDensity": 12
                            },
                            {
                                "knotPosition": [1200, 0, 0],
                                "previousHandlerPosition": [400, 0, 0],
                                "previousDensity": 12,
                                "nextDensity": 12
                            }
                        ],
                        "headOffset":0,
                        "tailOffset": 0,
                        "units": {}
                    }
                ]
            }
        },
        icon: "assets/components/flow.png",
        html: '<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"></div>',
        postProcess: function (element, iRequire) {
            var innerElement = element.appendChild(element.ownerDocument.createElement("div"));

                var dynamicText = iRequire("montage/ui/component").Component.create();
                iRequire("montage/ui/component").Component.__proto__.defineProperty(dynamicText, "hasTemplate", {
                    value: false,
                    serializable: true
                });
                dynamicText.element = innerElement;
                dynamicText.attachToParentComponent();
                dynamicText.value = "foo";
                dynamicText.needsDraw = true;
                this._orphanedChildren = [dynamicText];
                innerElement.setAttribute("data-montage-id", "foo");
                innerElement.style.width = "160px";
                innerElement.style.height = "160px";
                innerElement.style.background = "white";
                innerElement.style.boxShadow = "0 0 10px rgba(0, 0, 0, .4)";
                innerElement.style.margin = "-80px 0 0 -80px";
                innerElement.style.borderRadius = "12px";
        }
    }
];

