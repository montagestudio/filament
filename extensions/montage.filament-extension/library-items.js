var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item.js").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;


var AnchorLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/anchor.reel",
            "properties": {
                "value": "Link"
            }
        }
    },

    name: {
        value: "Anchor"
    },

    label: {
        value: "Anchor"
    },

    icon: {
        value: packageLocation + "assets/components/anchor.png"
    },

    html: {
        value: '<a data-montage-id=""></a>'
    }

});

var AutocompleteLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/autocomplete/autocomplete.reel"
        }
    },

    name: {
        value: "Autocomplete"
    },

    label: {
        value: "Autocomplete"
    },

    icon: {
        value: packageLocation + "assets/components/autocomplete.png"
    },
    
    html: {
        value: '<input data-montage-id="">'
    }

});

var ButtonLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/button.reel",
            "properties": {
                label: "Button",
                enabled: true
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/toggle-button.reel",
            "properties": {
                "value": true,
                "pressedLabel": "On",
                "unpressedLabel": "Off"
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/input-checkbox.reel",
            "properties": {
                "checked": true
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/input-radio.reel",
            "properties": {
                "checked": true
            }
        }
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

var InputDateLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/input-date.reel",
            "properties": {
                "value": "2013-02-28"
            }
        }
    },

    name: {
        value: "InputDate"
    },

    label: {
        value: "Date Input"
    },

    icon: {
        value: packageLocation + "assets/components/input-date.png"
    },

    html: {
        value: '<input type="date" data-montage-id="">'
    }

});

var InputNumberLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/input-number.reel",
            "properties": {
                "value": 100
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/input-range.reel",
            "properties": {
                "minValue": 0,
                "maxValue": 100,
                "value": 50
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/select.reel"
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/dynamic-text.reel",
            "properties": {
                "value": "Text"
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/input-text.reel",
            "properties": {
                "value": "Text"
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/textarea.reel",
            "properties": {
                "value": "Textarea"
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/image.reel",
            "properties": {
                //TODO this should not be hardcoded in palette of all places
                "src": "http://client/node_modules/palette/assets/image/placeholder.png"
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/progress.reel",
            "properties": {
                "max": 100,
                "value": 50
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/repetition.reel",
            "properties": {
                "content": [1, 2, 3]
            }
        }
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

    serialization: {
        value: {
            "prototype": "montage/ui/flow.reel",
            "properties": {
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
            }
        }
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
    //TODO if you really want to add child components...should they be part of the component you're adding itself?
    postProcess: {
        value: function (editingProxy, editingDocument) {

            var flowImageSerialization = Object.clone(ImageLibraryItem.serialization),
                flowElement = editingProxy.stageObject.element,
                imageElement,
                imageIdentifier = "flowImage";

            if (!flowImageSerialization.bindings) {
                flowImageSerialization.bindings = {};
            }

            // XXX FIXME HACK WTF is going on here?
            flowImageSerialization.bindings.src = {
                boundObject: {"<-": "@" + editingProxy.label},
                boundObjectPropertyPath: "objectAtCurrentIteration",
                oneway: true
            };

            //TODO while this will work it's probably sub-optimal and we do need a way to specify the destination
            // of an element when adding a Component probably, though this works...
            imageElement = flowElement.appendChild(flowElement.ownerDocument.createElement("img"));
            imageElement.setAttribute("data-montage-id", imageIdentifier);
            imageElement.style.minWidth = "400px";
            imageElement.style.minHeight = "400px";
            imageElement.style.background = "white";
            imageElement.style.webkitTransform = "translate3d(-50%, -50%, 0)";
            imageElement.style.borderRadius = "12px";

            editingDocument.addComponent(
                null,
                flowImageSerialization,
                ImageLibraryItem.html,
                imageIdentifier
            ).done();
        }
    }

});

//TODO build this automatically
exports.libraryItems = {
    "montage/ui/anchor.reel": AnchorLibraryItem,
    "montage/ui/autocomplete/autocomplete.reel": AutocompleteLibraryItem,
    "montage/ui/button.reel": ButtonLibraryItem,
    "montage/ui/toggle-button.reel": ToggleButtonLibraryItem,
    "montage/ui/input-checkbox.reel": InputCheckboxLibraryItem,
    "montage/ui/input-radio.reel": InputRadioLibraryItem,
    "montage/ui/input-date.reel": InputDateLibraryItem,
    "montage/ui/input-number.reel": InputNumberLibraryItem,
    "montage/ui/input-range.reel": InputRangeLibraryItem,
    "montage/ui/select.reel": SelectLibraryItem,
    "montage/ui/dynamic-text.reel": DynamicTextLibraryItem,
    "montage/ui/input-text.reel": InputTextLibraryItem,
    "montage/ui/textarea.reel": TextareaLibraryItem,
    "montage/ui/image.reel": ImageLibraryItem,
    "montage/ui/progress.reel": ProgressLibraryItem,
    "montage/ui/repetition.reel": RepetitionLibraryItem,
    "montage/ui/flow.reel": FlowLibraryItem,
    "montage/ui/rich-text-editor/overlays/rich-text-linkpopup.reel": null,
    "montage/ui/rich-text-editor/overlays/rich-text-resizer.reel": null,
    "montage/ui/autocomplete/result-item.reel": null,
    "montage/ui/autocomplete/results-list.reel": null,
    "montage/ui/bluemoon/button-group.reel": null,
    "montage/ui/bluemoon/button.reel": null,
    "montage/ui/bluemoon/checkbox.reel": null,
    "montage/ui/bluemoon/progress.reel": null,
    "montage/ui/bluemoon/slider.reel": null,
    "montage/ui/bluemoon/tabs.reel": null,
    "montage/ui/bluemoon/textarea.reel": null,
    "montage/ui/bluemoon/textfield.reel": null,
    "montage/ui/bluemoon/toggle.reel": null,
    "montage/ui/loader.reel": null,
    "montage/ui/loading-panel.reel": null,
    "montage/ui/loading.reel": null,
    "montage/ui/token-field/token.reel": null,
    "montage/ui/component-group.reel": null,
    "montage/ui/scroll-bars.reel": null
};

var RangeControllerLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/core/range-controller"
        }
    },

    name: {
        value: "RangeController"
    },

    label: {
        value: "RangeController"
    },
    
    icon: {
        value: packageLocation + "assets/components/range-controller.png"
    }

});

exports.libraryAdditions = [RangeControllerLibraryItem];
