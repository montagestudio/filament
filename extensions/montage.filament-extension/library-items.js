var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item.js").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;

var ConditionLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/condition.reel"
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

var RepetitionLibraryItem = Montage.create(LibraryItem, {

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

var SlotLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/slot.reel"
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
            "prototype": "montage/ui/substitution.reel"
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

var DynamicTextLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "montage/ui/text.reel",
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

//TODO build this automatically
exports.libraryItems = {
    "montage/ui/condition.reel": ConditionLibraryItem,
    "montage/ui/repetition.reel": RepetitionLibraryItem,
    "montage/ui/slot.reel": SlotLibraryItem,
    "montage/ui/substitution.reel": SubstitutionLibraryItem,
    "montage/ui/text.reel": DynamicTextLibraryItem,

    "montage/ui/loader.reel": null
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
