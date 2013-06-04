var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;

var BadgeLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function BadgeLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/badge.reel",
            "properties": {
                "element": {"#": "badge"}
            }
        }
    },

    name: {
        value: "Badge"
    },

    label: {
        value: "Badge"
    },

    icon: {
        value: packageLocation + "assets/components/badge.png"
    },

    html: {
        value: '<output data-montage-id="badge"></output>'
    }

});

var ButtonLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ButtonLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/button.reel",
            "properties": {
                "element": {"#": "button"},
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

var CheckboxLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function CheckboxLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/checkbox.reel",
            "properties": {
                "element": {"#": "checkbox"},
                "checked": true
            }
        }
    },

    name: {
        value: "Checkbox"
    },

    label: {
        value: "Checkbox"
    },

    icon: {
        value: packageLocation + "assets/components/checkbox.png"
    },

    html: {
        value: '<input type="checkbox" data-montage-id="checkbox">'
    }

});

var NumberFieldLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function NumberFieldLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/number-field.reel",
            "properties": {
                "element": {"#": "number"},
                "value": 100
            }
        }
    },

    name: {
        value: "NumberField"
    },

    label: {
        value: "Number Field"
    },

    icon: {
        value: packageLocation + "assets/components/number-field.png"
    },

    html: {
        value: '<input type="number" data-montage-id="number">'
    }

});

var RadioButtonLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function RadioButtonLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/radio-button.reel",
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
        value: "Radio Button"
    },

    icon: {
        value: packageLocation + "assets/components/radio-button.png"
    },

    html: {
        value: '<input type="radio" data-montage-id="radio">'
    }

});

var SliderLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function SliderLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/slider.reel",
            "properties": {
                "element": {"#": "slider"},
                "min": 0,
                "max": 100,
                "value": 50
            }
        }
    },

    name: {
        value: "Slider"
    },

    label: {
        value: "Slider"
    },

    icon: {
        value: packageLocation + "assets/components/slider.png"
    },

    html: {
        value: '<div data-montage-id="slider"></div>'
    }

});

var TextFieldLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function TextFieldLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/text-field.reel",
            "properties": {
                "element": {"#": "textField"},
                "placeholder": "Text"
            }
        }
    },

    name: {
        value: "TextField"
    },

    label: {
        value: "TextField"
    },

    icon: {
        value: packageLocation + "assets/components/text-field.png"
    },

    html: {
        value: '<input data-montage-id="inputText" type="text">'
    }

});

var ListItemLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ListItemLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/list-item.reel",
            "properties": {
                "element": {"#": "ListItem"}
            }
        }
    },

    name: {
        value: "ListItem"
    },

    label: {
        value: "ListItem"
    },

    icon: {
        value: packageLocation + "assets/components/list-item.png"
    },

    html: {
        value: '<li data-montage-id="listItem">List Item</li>'
    }
});

var ListLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ListLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/list.reel",
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

var SelectLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function SelectLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/select.reel",
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

var TextLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function TextLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/text.reel",
            "properties": {
                "element": {"#": "text"},
                "value": "Text"
            }
        }
    },

    name: {
        value: "Text"
    },

    label: {
        value: "Text"
    },

    icon: {
        value: packageLocation + "assets/components/text.png"
    },

    html: {
        value: '<span data-montage-id="text"></span>'
    }

});

var TextAreaLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function TextAreaLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/text-area.reel",
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

var TitleLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function TitleLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/title.reel",
            "properties": {
                "element": {"#": "title"},
                "value": "Title"
            }
        }
    },

    name: {
        value: "Title"
    },

    label: {
        value: "Title"
    },

    icon: {
        value: packageLocation + "assets/components/title.png"
    },

    html: {
        value: '<h3 data-montage-id="title"></h3>'
    }

});

//TODO build this automatically
exports.libraryItems = {
    "digit/ui/badge.reel": BadgeLibraryItem,
    "digit/ui/button.reel": ButtonLibraryItem,
    "digit/ui/checkbox.reel": CheckboxLibraryItem,
    "digit/ui/list-item.reel": ListItemLibraryItem,
    "digit/ui/list.reel": ListLibraryItem,
    "digit/ui/number-field.reel": NumberFieldLibraryItem,
    "digit/ui/radio-button.reel": RadioButtonLibraryItem,
    "digit/ui/select.reel": SelectLibraryItem,
    "digit/ui/slider.reel": SliderLibraryItem,
    "digit/ui/text-area.reel": TextAreaLibraryItem,
    "digit/ui/text-field.reel": TextFieldLibraryItem,
    "digit/ui/text.reel": TextLibraryItem,
    "digit/ui/title.reel": TitleLibraryItem
};

exports.libraryAdditions = [];
