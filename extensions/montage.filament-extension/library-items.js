var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item.js").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;


var AnchorLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/anchor.reel",
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
            "prototype": "matte/ui/autocomplete/autocomplete.reel"
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
            "prototype": "matte/ui/button.reel",
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
            "prototype": "matte/ui/toggle-button.reel",
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

var ToggleSwitchLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/toggle-switch.reel"
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
        value: '<div data-montage-id=""></div>'
    }

});

var InputCheckboxLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/input-checkbox.reel",
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
            "prototype": "matte/ui/input-radio.reel",
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
            "prototype": "matte/ui/input-date.reel",
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
            "prototype": "matte/ui/input-number.reel",
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
            "prototype": "matte/ui/input-range.reel",
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
            "prototype": "matte/ui/select.reel"
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
            "prototype": "matte/ui/text.reel",
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
            "prototype": "matte/ui/input-text.reel",
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
            "prototype": "matte/ui/textarea.reel",
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
            "prototype": "matte/ui/image.reel",
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
            "prototype": "matte/ui/progress.reel",
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
            "prototype": "matte/ui/repetition.reel",
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
            "prototype": "matte/ui/flow.reel",
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

var VideoPlayerLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/video-player.reel"
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
        value: '<video data-montage-id=""></video>'
    }

});

var TokenFieldLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/token-field.reel"
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
        value: '<input data-montage-id="">'
    }

});

var RichTextEditorLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/rich-text-editor/rich-text-editor.reel"
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
    }
});

var ScrollerLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/scroller.reel"
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
    }
});

var ListLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/list.reel"
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
    }
});

var TextSliderLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/text-slider.reel"
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
        value: '<input data-montage-id="">'
    }

});

var SlotLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/slot.reel"
        }
    },

    name: {
        value: "Slot"
    },

    label: {
        value: "Slot"
    },

    icon: {
        value: packageLocation + "assets/components/slot.png"
    },

    html: {
        value: '<div data-montage-id=""></div>'
    }

});

var SubstitutionLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/substitution.reel"
        }
    },

    name: {
        value: "Substitution"
    },

    label: {
        value: "Substitution"
    },

    icon: {
        value: packageLocation + "assets/components/substitution.png"
    },

    html: {
        value: '<div data-montage-id=""></div>'
    }

});

var ConditionLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/condition.reel"
        }
    },

    name: {
        value: "Condition"
    },

    label: {
        value: "Condition"
    },

    icon: {
        value: packageLocation + "assets/components/condition.png"
    },

    html: {
        value: '<div data-montage-id=""></div>'
    }

});

var PopupLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/popup.reel"
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
        value: '<div data-montage-id=""></div>'
    }

});

var AlertLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/alert.reel"
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
        value: '<div data-montage-id=""></div>'
    }

});

var NotifierLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/notifier.reel"
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
        value: '<div data-montage-id=""></div>'
    }

});

var ConfirmLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "matte/ui/popup/confirm.reel"
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
        value: '<div data-montage-id=""></div>'
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
    "matte/ui/input-radio.reel": InputRadioLibraryItem,
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
    
    "montage/ui/condition.reel": ConditionLibraryItem,
    "montage/ui/repetition.reel": RepetitionLibraryItem,
    "montage/ui/slot.reel": SlotLibraryItem,
    "montage/ui/substitution.reel": SubstitutionLibraryItem,
    "montage/ui/text.reel": DynamicTextLibraryItem,

    "matte/ui/rich-text-editor/overlays/rich-text-linkpopup.reel": null,
    "matte/ui/rich-text-editor/overlays/rich-text-resizer.reel": null,
    "matte/ui/token-field/token.reel": null,
    "matte/ui/scroll-bars.reel": null,
    "matte/ui/loading-panel.reel": null,
    "matte/ui/loading.reel": null,
    "matte/ui/dynamic-element.reel": null,
    "matte/ui/component-group.reel": null,
    "matte/ui/autocomplete/result-item.reel": null,
    "matte/ui/autocomplete/results-list.reel": null,

    "montage/ui/loader.reel": null,
    "montage/ui/radio-button.reel": null,

    "montage/ui/native/anchor.reel": null,
    "montage/ui/native/button.reel": null,
    "montage/ui/native/image.reel": null,
    "montage/ui/native/input-checkbox.reel": null,
    "montage/ui/native/input-date.reel": null,
    "montage/ui/native/input-number.reel": null,
    "montage/ui/native/input-radio.reel": null,
    "montage/ui/native/input-range.reel": null,
    "montage/ui/native/input-text.reel": null,
    "montage/ui/native/progress.reel": null,
    "montage/ui/native/select.reel": null,
    "montage/ui/native/textarea.reel": null,

    "montage/ui/bluemoon/button-group.reel": null,
    "montage/ui/bluemoon/button.reel": null,
    "montage/ui/bluemoon/checkbox.reel": null,
    "montage/ui/bluemoon/progress.reel": null,
    "montage/ui/bluemoon/slider.reel": null,
    "montage/ui/bluemoon/tabs.reel": null,
    "montage/ui/bluemoon/textarea.reel": null,
    "montage/ui/bluemoon/textfield.reel": null,
    "montage/ui/bluemoon/toggle.reel": null
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
