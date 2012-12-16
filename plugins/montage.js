var Montage = require("montage").Montage;
var LibraryItem = require("core/library-item.js").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the plugins themselves
//TODO each plugin really should be its own package, anticipate consuming plugins from elsewhere
var packageLocation = require.location;

var ButtonLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                label: "Button",
                enabled: true
            };
        }
    },

    moduleId: {
        value: "montage/ui/button.reel"
    },

    name: {
        value: "Button"
    },

    label: {
        value: "Button"
    },

    icon: {
        value: packageLocation + "assets/components/button.png"
    },

    html: {
        value: '<button data-montage-id=""></button>'
    }

});

var ToggleButtonLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "value": true,
                "pressedLabel": "On",
                "unpressedLabel": "Off"
            };
        }
    },

    moduleId: {
        value: "montage/ui/toggle-button.reel"
    },

    name: {
        value: "ToggleButton"
    },

    label: {
        value: "Toggle"
    },

    icon: {
        value: packageLocation + "assets/components/toggle-button.png"
    },

    html: {
        value: '<button data-montage-id=""></button>'
    }

});

var InputCheckboxLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "checked": true
            };
        }
    },

    moduleId: {
        value: "montage/ui/input-checkbox.reel"
    },

    name: {
        value: "InputCheckbox"
    },

    label: {
        value: "Checkbox"
    },

    icon: {
        value: packageLocation + "assets/components/input-checkbox.png"
    },

    html: {
        value: '<input type="checkbox" data-montage-id="">'
    }

});

var InputRadioLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "checked": true
            };
        }
    },

    moduleId: {
        value: "montage/ui/input-radio.reel"
    },

    name: {
        value: "InputRadio"
    },

    label: {
        value: "Radio"
    },

    icon: {
        value: packageLocation + "assets/components/input-radio.png"
    },

    html: {
        value: '<input type="radio" data-montage-id="">'
    }

});

var InputNumberLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "value": 100
            };
        }
    },

    moduleId: {
        value: "montage/ui/input-number.reel"
    },

    name: {
        value: "InputNumber"
    },

    label: {
        value: "Number Input"
    },

    icon: {
        value: packageLocation + "assets/components/input-number.png"
    },

    html: {
        value: '<input type="number" data-montage-id="">'
    }

});

var InputRangeLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "minValue": 0,
                "maxValue": 100,
                "value": 50
            };
        }
    },

    moduleId: {
        value: "montage/ui/input-range.reel"
    },

    name: {
        value: "InputRange"
    },

    label: {
        value: "Range Input"
    },

    icon: {
        value: packageLocation + "assets/components/input-range.png"
    },

    html: {
        value: '<input type="range" data-montage-id="">'
    }

});

var SelectLibraryItem = Montage.create(LibraryItem, {

    moduleId: {
        value: "montage/ui/select.reel"
    },

    name: {
        value: "Select"
    },

    label: {
        value: "Select"
    },

    icon: {
        value: packageLocation + "assets/components/select.png"
    },

    html: {
        value: '<select data-montage-id=""><option value="">Select</option></select>'
    }

});

var DynamicTextLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "value":"Text"
            };
        }
    },

    moduleId: {
        value: "montage/ui/dynamic-text.reel"
    },

    name: {
        value: "DynamicText"
    },

    label: {
        value: "DynamicText"
    },

    icon: {
        value: packageLocation + "assets/components/dynamic-text.png"
    },

    html: {
        //TODO why a paragraph; highlighting the pain of hiding the dom
        value: '<p data-montage-id=""></p>'
    }

});

var InputTextLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "value": "Text"
            };
        }
    },

    moduleId: {
        value: "montage/ui/input-text.reel"
    },

    name: {
        value: "InputText"
    },

    label: {
        value: "Text Input"
    },

    icon: {
        value: packageLocation + "assets/components/input-text.png"
    },

    html: {
        value: '<input data-montage-id="" type="text">'
    }

});

var TextareaLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "value": "Textarea"
            };
        }
    },

    moduleId: {
        value: "montage/ui/textarea.reel"
    },

    name: {
        value: "Textarea"
    },

    label: {
        value: "Textarea"
    },

    icon: {
        value: packageLocation + "assets/components/textarea.png"
    },

    html: {
        value: '<textarea data-montage-id=""></textarea>'
    }

});

var ImageLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                //TODO this should not be hardcoded in palette of all places
                "src": "http://client/node_modules/palette/assets/image/placeholder.png"
            };
        }
    },

    moduleId: {
        value: "montage/ui/image.reel"
    },

    name: {
        value: "Image"
    },

    label: {
        value: "Image"
    },

    icon: {
        value: packageLocation + "assets/components/image.png"
    },

    html: {
        value: '<img data-montage-id="">'
    }

});

var ProgressLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "max": 100,
                "value": 50
            };
        }
    },

    moduleId: {
        value: "montage/ui/progress.reel"
    },

    name: {
        value: "Progress"
    },

    label: {
        value: "Progress"
    },

    icon: {
        value: packageLocation + "assets/components/progress.png"
    },

    html: {
        value: '<progress data-montage-id=""></progress>'
    }

});

var RepetitionLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "objects": [1, 2, 3]
            };
        }
    },

    moduleId: {
        value: "montage/ui/repetition.reel"
    },

    name: {
        value: "Repetition"
    },

    label: {
        value: "Repetition"
    },

    icon: {
        value: packageLocation + "assets/components/repetition.png"
    },

    html: {
        value: '<ul data-montage-id=""><li>Item</li></ul>'
    }

});

var FlowLibraryItem = Montage.create(LibraryItem, {

    didCreate: {
        value: function () {
            this.properties = {
                "objects": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                "cameraPosition": [0, 0, 1500],
                "paths": [
                    {
                        "knots": [
                            {
                                "knotPosition": [-2400, 0, -1],
                                "nextHandlerPosition": [-800, 0, -1],
                                "previousDensity": 10,
                                "nextDensity": 10
                            },
                            {
                                "knotPosition": [2400, 0, -1],
                                "previousHandlerPosition": [800, 0, -1],
                                "previousDensity": 10,
                                "nextDensity": 10
                            }
                        ],
                        "headOffset": 0,
                        "tailOffset": 0,
                        "units": {}
                    }
                ]
            };
        }
    },

    moduleId: {
        value: "montage/ui/flow.reel"
    },

    name: {
        value: "Flow"
    },

    label: {
        value: "Flow"
    },

    icon: {
        value: packageLocation + "assets/components/flow.png"
    },

    html: {
        value: '<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"></div>'
    },

    // Action to take after addedTo the template
    //TODO rename didAddToTemplate?
    postProcess: {
        value: function (element, iRequire) {
            var self = this;
            var innerElement = element.appendChild(element.ownerDocument.createElement("img"));
            innerElement.setAttribute("data-montage-id", "foo");
            var dynamicText = iRequire("montage/ui/image.reel").Image.create();
            dynamicText.element = innerElement;
            dynamicText.attachToParentComponent();
            //dynamicText.value = "foo";
            dynamicText.needsDraw = true;
            self._orphanedChildren = [dynamicText];

            self.originalContent = [innerElement];

            Object.defineBinding(dynamicText, "src", {
                "boundObject": self,
                "boundObjectPropertyPath": "objectAtCurrentIteration",
                "oneway": true
            });

            innerElement.style.minWidth = "400px";
            innerElement.style.minHeight = "400px";
            innerElement.style.background = "white";
            innerElement.style.webkitTransform = "translate3d(-50%, -50%, 0)";
            innerElement.style.borderRadius = "12px";

        }
    }

});

//TODO build this automatically
exports.libraryItems = {
    "montage/ui/button.reel": ButtonLibraryItem,
    "montage/ui/toggle-button.reel": ToggleButtonLibraryItem,
    "montage/ui/input-checkbox.reel": InputCheckboxLibraryItem,
    "montage/ui/input-radio.reel": InputRadioLibraryItem,
    "montage/ui/input-number.reel": InputNumberLibraryItem,
    "montage/ui/input-range.reel": InputRangeLibraryItem,
    "montage/ui/select.reel": SelectLibraryItem,
    "montage/ui/dynamic-text.reel": DynamicTextLibraryItem,
    "montage/ui/input-text.reel": InputTextLibraryItem,
    "montage/ui/textarea.reel": TextareaLibraryItem,
    "montage/ui/image.reel": ImageLibraryItem,
    "montage/ui/progress.reel": ProgressLibraryItem,
    "montage/ui/repetition.reel": RepetitionLibraryItem,
    "montage/ui/flow.reel": FlowLibraryItem
};