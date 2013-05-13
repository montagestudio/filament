var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;


var AnchorLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/anchor.reel",
            "properties": {
                "element": {"#": "anchor"},
                "value": "Link",
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
        value: '<a data-montage-id="anchor"></a>'
    }

});

var AutocompleteLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/autocomplete/autocomplete.reel",
            "properties": {
                "element": {"#": "autocomplete"}
            }
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
        value: '<input data-montage-id="autocomplete">'
    }

});

var ButtonLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/button.reel",
            "properties": {
                element: {"#": "button"},
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
        value: '<button data-montage-id="button"></button>'
    }

});

var ToggleButtonLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/toggle-button.reel",
            "properties": {
                "element": {"#": "toggleButton"},
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
        value: '<button data-montage-id="toggleButton"></button>'
    }

});

var ToggleSwitchLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/toggle-switch.reel",
            "properties": {
                "element": {"#": "toggleSwitch"}
            }
        }
    },

    name: {
        value: "ToggleSwitch"
    },

    label: {
        value: "Switch"
    },

    icon: {
        value: packageLocation + "assets/components/toggle-switch.png"
    },

    html: {
        value: '<div data-montage-id="toggleSwitch"></div>'
    }

});

var InputCheckboxLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/input-checkbox.reel",
            "properties": {
                element: {"#": "checkbox"},
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
        value: '<input type="checkbox" data-montage-id="checkbox">'
    }

});

var RadioButtonLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/radio-button.reel",
            "properties": {
                "element": {"#": "radio"},
                "checked": true
            }
        }
    },

    name: {
        value: "RadioButton"
    },

    label: {
        value: "Radio"
    },

    icon: {
        value: packageLocation + "assets/components/radio-button.png"
    },

    html: {
        value: '<input type="radio" data-montage-id="radio">'
    }

});

var InputDateLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/input-date.reel",
            "properties": {
                "element": {"#": "date"},
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
        value: '<input type="date" data-montage-id="date">'
    }

});

var InputNumberLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/input-number.reel",
            "properties": {
                "element": {"#": "number"},
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
        value: '<input type="number" data-montage-id="number">'
    }

});

var InputRangeLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/input-range.reel",
            "properties": {
                "element": {"#": "inputRange"},
                "min": 0,
                "max": 100,
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
        value: '<input type="range" data-montage-id="inputRange">'
    }

});

var SelectLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/select.reel",
            "properties": {
                "element": {"#": "select"}
            }
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
        value: '<select data-montage-id="select"><option value="">Select</option></select>'
    }

});

var InputTextLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/input-text.reel",
            "properties": {
                "element": {"#": "inputText"},
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
        value: '<input data-montage-id="inputText" type="text">'
    }

});

var TextareaLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/textarea.reel",
            "properties": {
                "element": {"#": "textarea"},
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
        value: '<textarea data-montage-id="textarea"></textarea>'
    }

});

var ImageLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/image.reel",
            "properties": {
                "element": {"#": "image"},
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
        value: '<img data-montage-id="image">'
    }

});

var ProgressLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/progress.reel",
            "properties": {
                "element": {"#": "progress"},
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
        value: '<progress data-montage-id="progress"></progress>'
    }

});

var FlowLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/flow.reel",
            "properties": {
                "element": {"#": "flow"},
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
        value: '<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0" data-montage-id="flow"></div>'
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

var VideoPlayerLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/video-player.reel",
            "properties": {
                "element": {"#": "video"}
            }
        }
    },

    name: {
        value: "VideoPlayer"
    },

    label: {
        value: "Video"
    },

    icon: {
        value: packageLocation + "assets/components/video.png"
    },

    html: {
        value: '<video data-montage-id="video"></video>'
    }

});

var TokenFieldLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/token-field.reel",
            "properties": {
                "element": {"#": "tokenField"}
            }
        }
    },

    name: {
        value: "TokenField"
    },

    label: {
        value: "Token Input"
    },

    icon: {
        value: packageLocation + "assets/components/token-field.png"
    },

    html: {
        value: '<input data-montage-id="tokenField">'
    }

});

var RichTextEditorLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/rich-text-editor/rich-text-editor.reel",
            "properties": {
                "element": {"#": "richTextEditor"}
            }
        }
    },

    name: {
        value: "RichTextEditor"
    },

    label: {
        value: "Rich Text Editor"
    },

    icon: {
        value: packageLocation + "assets/components/rte.png"
    },

    html: {
        value: '<div data-montage-id="richTextEditor"></div>'
    }
});

var ScrollerLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/scroller.reel",
            "properties": {
                "element": {"#": "scroller"}
            }
        }
    },

    name: {
        value: "Scroller"
    },

    label: {
        value: "Scroller"
    },

    icon: {
        value: packageLocation + "assets/components/scroller.png"
    },

    html: {
        value: '<div data-montage-id="scroller"></div>'
    }
});

var ListLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/list.reel",
            "properties": {
                "element": {"#": "list"}
            }
        }
    },

    name: {
        value: "List"
    },

    label: {
        value: "List"
    },

    icon: {
        value: packageLocation + "assets/components/list.png"
    },

    html: {
        value: '<ul data-montage-id="list"><li>Item</li></ul>'
    }
});

var TextSliderLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/text-slider.reel",
            "properties": {
                "element": {"#": "textSlider"}
            }
        }
    },

    name: {
        value: "TextSlider"
    },

    label: {
        value: "Text Slider"
    },

    icon: {
        value: packageLocation + "assets/components/text-slider.png"
    },

    html: {
        value: '<input data-montage-id="textSlider">'
    }

});

var PopupLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/popup.reel",
            "properties": {
                "element": {"#": "popup"}
            }
        }
    },

    name: {
        value: "Popup"
    },

    label: {
        value: "Popup"
    },

    icon: {
        value: packageLocation + "assets/components/popup-popup.png"
    },

    html: {
        value: '<div data-montage-id="popup"></div>'
    }

});

var AlertLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/alert.reel",
            "properties": {
                "element": {"#": "alert"}
            }
        }
    },

    name: {
        value: "Alert"
    },

    label: {
        value: "Alert"
    },

    icon: {
        value: packageLocation + "assets/components/popup-alert.png"
    },

    html: {
        value: '<div data-montage-id="alert"></div>'
    }

});

var NotifierLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/notifier.reel",
            "properties": {
                "element": {"#": "notifier"}
            }
        }
    },

    name: {
        value: "Notifier"
    },

    label: {
        value: "Notifier"
    },

    icon: {
        value: packageLocation + "assets/components/popup-notifier.png"
    },

    html: {
        value: '<div data-montage-id="notifier"></div>'
    }

});

var ConfirmLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/confirm.reel",
            "properties": {
                "element": {"#": "confirm"}
            }
        }
    },

    name: {
        value: "Confirm"
    },

    label: {
        value: "Confirm"
    },

    icon: {
        value: packageLocation + "assets/components/popup-confirm.png"
    },

    html: {
        value: '<div data-montage-id="confirm"></div>'
    }

});


//TODO build this automatically
exports.libraryItems = {
    "matte/ui/anchor.reel": AnchorLibraryItem,
    "matte/ui/autocomplete/autocomplete.reel": AutocompleteLibraryItem,
    "matte/ui/button.reel": ButtonLibraryItem,
    "matte/ui/toggle-button.reel": ToggleButtonLibraryItem,
    "matte/ui/toggle-switch.reel": ToggleSwitchLibraryItem,
    "matte/ui/input-checkbox.reel": InputCheckboxLibraryItem,
    "matte/ui/radio-button.reel": RadioButtonLibraryItem,
    "matte/ui/input-date.reel": InputDateLibraryItem,
    "matte/ui/input-number.reel": InputNumberLibraryItem,
    "matte/ui/input-range.reel": InputRangeLibraryItem,
    "matte/ui/select.reel": SelectLibraryItem,
    "matte/ui/input-text.reel": InputTextLibraryItem,
    "matte/ui/rich-text-editor/rich-text-editor.reel": RichTextEditorLibraryItem,
    "matte/ui/scroller.reel": ScrollerLibraryItem,
    "matte/ui/list.reel": ListLibraryItem,
    "matte/ui/textarea.reel": TextareaLibraryItem,
    "matte/ui/image.reel": ImageLibraryItem,
    "matte/ui/progress.reel": ProgressLibraryItem,
    "matte/ui/flow.reel": FlowLibraryItem,
    "matte/ui/token-field/token-field.reel": TokenFieldLibraryItem,
    "matte/ui/text-slider.reel": TextSliderLibraryItem,
    "matte/ui/video-player.reel": VideoPlayerLibraryItem,
    "matte/ui/popup/popup.reel": PopupLibraryItem,
    "matte/ui/popup/notifier.reel": NotifierLibraryItem,
    "matte/ui/popup/alert.reel": AlertLibraryItem,
    "matte/ui/popup/confirm.reel": ConfirmLibraryItem,

    "matte/ui/rich-text-editor/overlays/rich-text-linkpopup.reel": null,
    "matte/ui/rich-text-editor/overlays/rich-text-resizer.reel": null,
    "matte/ui/token-field/token.reel": null,
    "matte/ui/scroll-bars.reel": null,
    "matte/ui/loading-panel.reel": null,
    "matte/ui/loading.reel": null,
    "matte/ui/dynamic-element.reel": null,
    "matte/ui/component-group.reel": null,
    "matte/ui/autocomplete/result-item.reel": null,
    "matte/ui/autocomplete/results-list.reel": null
};

exports.libraryAdditions = [];
