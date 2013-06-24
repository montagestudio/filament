var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;

var ConditionLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function ConditionLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/ui/condition.reel",
            "properties": {
                "element": {"#": "condition"}
            }
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
        value: '<div data-montage-id="condition"></div>'
    }

});

var FlowLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function FlowLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/ui/flow.reel",
            "properties": {
                "element": {"#": "flow"},
                "content": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99],
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
    imageSerialization: {
        value: {
            "prototype": "matte/ui/image.reel",
            "properties": {
                "element": {"#": "image"},
                //TODO this should not be hardcoded in palette of all places
                "src": "http://client/node_modules/palette/assets/image/placeholder.png"
            }
        }
    },

    postProcess: {
        value: function (editingProxy, editingDocument) {

            var flowImageSerialization = Object.clone(this.imageSerialization),
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
                '<img data-montage-id="image">',
                imageIdentifier
            ).done();
        }
    }

});

var OverlayLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function OverlayLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/ui/overlay.reel",
            "properties": {
                "element": {"#": "overlay"}
            }
        }
    },

    name: {
        value: "Overlay"
    },

    label: {
        value: "Overlay"
    },

    icon: {
        value: packageLocation + "assets/components/overlay.png"
    },

    html: {
        value: '<div data-montage-id="overlay"></div>'
    }

});

var RepetitionLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function RepetitionLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/ui/repetition.reel",
            "properties": {
                "element": {"#": "repetition"},
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
        value: '<ul data-montage-id="repetition"><li>Item</li></ul>'
    }

});

var SlotLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function SlotLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/ui/slot.reel",
            "properties": {
                "element": {"#": "slot"}
            }
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
        value: '<div data-montage-id="slot"></div>'
    }

});

var SubstitutionLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function SubstitutionLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/ui/substitution.reel",
            "properties": {
                "element": {"#": "substitution"}
            }
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
        value: '<div data-montage-id="substitution"></div>'
    }

});

var DynamicTextLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function DynamicTextLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/ui/text.reel",
            "properties": {
                "value": "Text",
                "element": {"#": "text"}
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
        value: '<p data-montage-id="text"></p>'
    }

});

//TODO build this automatically
exports.libraryItems = {
    "montage/ui/condition.reel": ConditionLibraryItem,
    "montage/ui/flow.reel": FlowLibraryItem,
    "montage/ui/overlay.reel": OverlayLibraryItem,
    "montage/ui/repetition.reel": RepetitionLibraryItem,
    "montage/ui/slot.reel": SlotLibraryItem,
    "montage/ui/substitution.reel": SubstitutionLibraryItem,
    "montage/ui/text.reel": DynamicTextLibraryItem,

    "montage/ui/loader.reel": null
};

var RangeControllerLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function RangeControllerLibraryItem() {
            this.super();
        }
    },

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

var ActionEventListenerLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function ActionEventListenerLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "montage/core/event/action-event-listener"
        }
    },

    name: {
        value: "ActionEventListener"
    },

    label: {
        value: "ActionEventListener"
    },

    icon: {
        value: packageLocation + "assets/components/event.png"
    }

});

exports.libraryAdditions = [RangeControllerLibraryItem, ActionEventListenerLibraryItem];
