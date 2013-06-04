var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;

var ActionSheetLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ActionSheetLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/action-sheet.reel",
            "properties": {
                "element": {"#": "anchor"},
                "value": "Link"
            }
        }
    },

    name: {
        value: "ActionSheet"
    },

    label: {
        value: "Action Sheet"
    },

    icon: {
        value: packageLocation + "assets/components/action-sheet.png"
    },

    html: {
        value: '<a data-montage-id="anchor"></a>'
    }

});

var AudioLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function AudioLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/audio.reel",
            "properties": {
                "element": {"#": "audio"}
            }
        }
    },

    name: {
        value: "AudioPlayer"
    },

    label: {
        value: "Audio"
    },

    icon: {
        value: packageLocation + "assets/components/audio.png"
    },

    html: {
        value: '<audio data-montage-id="audio"></audio>'
    }

});

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

var ButtonGroupLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ButtonGroupLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/button-group.reel",
            "properties": {
                "element": {"#": "buttonGroup"}
            }
        }
    },

    name: {
        value: "ButtonGroup"
    },

    label: {
        value: "ButtonGroup"
    },

    icon: {
        value: packageLocation + "assets/components/button-group.png"
    },

    html: {
        value: '<div data-montage-id="buttonGroup"></div>'
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

var HeaderLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function HeaderLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/header.reel",
            "properties": {
                "element": {"#": "header"}
            }
        }
    },

    name: {
        value: "Header"
    },

    label: {
        value: "Header"
    },

    icon: {
        value: packageLocation + "assets/components/header.png"
    },

    html: {
        value: '<div data-montage-id="header"></div>'
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

var MapLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function MapLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/map.reel",
            "properties": {
                "element": {"#": "map"}
            }
        }
    },

    name: {
        value: "Map"
    },

    label: {
        value: "Map"
    },

    icon: {
        value: packageLocation + "assets/components/map.png"
    },

    html: {
        value: '<div data-montage-id="map"></div>'
    }

});

var ModalLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ModalLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/popup/modal.reel",
            "properties": {
                "element": {"#": "popup"}
            }
        }
    },

    name: {
        value: "Modal"
    },

    label: {
        value: "Modal"
    },

    icon: {
        value: packageLocation + "assets/components/modal.png"
    },

    html: {
        value: '<div data-montage-id="popup"></div>'
    }

});

var NotificationLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function NotificationLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/popup/notification.reel",
            "properties": {
                "element": {"#": "notification"}
            }
        }
    },

    name: {
        value: "Notification"
    },

    label: {
        value: "Notification"
    },

    icon: {
        value: packageLocation + "assets/components/notification.png"
    },

    html: {
        value: '<div data-montage-id="notification"></div>'
    }

});

var ProgressLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ProgressLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/progress.reel",
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

var SplitViewLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function SplitViewLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/split-view.reel",
            "properties": {
                "element": {"#": "splitView"}
            }
        }
    },

    name: {
        value: "SplitView"
    },

    label: {
        value: "SplitView"
    },

    icon: {
        value: packageLocation + "assets/components/split-view.png"
    },

    html: {
        value: '<div data-montage-id="splitView"></div>'
    }

});

var TabBarLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function TabBarLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/popup/tab-bar.reel",
            "properties": {
                "element": {"#": "tabBar"}
            }
        }
    },

    name: {
        value: "TabBar"
    },

    label: {
        value: "TabBar"
    },

    icon: {
        value: packageLocation + "assets/components/tab-bar.png"
    },

    html: {
        value: '<div data-montage-id="tabBar"></div>'
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

var ToggleLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ToggleLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/toggle.reel",
            "properties": {
                "element": {"#": "toggle"}
            }
        }
    },

    name: {
        value: "Toggle"
    },

    label: {
        value: "Toggle"
    },

    icon: {
        value: packageLocation + "assets/components/toggle.png"
    },

    html: {
        value: '<div data-montage-id="toggle"></div>'
    }

});

var ToolBarLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ToolBarLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/popup/tool-bar.reel",
            "properties": {
                "element": {"#": "toolBar"}
            }
        }
    },

    name: {
        value: "ToolBar"
    },

    label: {
        value: "ToolBar"
    },

    icon: {
        value: packageLocation + "assets/components/tool-bar.png"
    },

    html: {
        value: '<div data-montage-id="toolBar"></div>'
    }

});

var VideoLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function VideoLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "digit/ui/video.reel",
            "properties": {
                "element": {"#": "video"}
            }
        }
    },

    name: {
        value: "Video"
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


//TODO build this automatically
exports.libraryItems = {

    "digit/ui/action-sheet.reel": ActionSheetLibraryItem,
    "digit/ui/audio.reel": AudioLibraryItem,
    "digit/ui/badge.reel": BadgeLibraryItem,
    "digit/ui/button-group.reel": ButtonGroupLibraryItem,
    "digit/ui/button.reel": ButtonLibraryItem,
    "digit/ui/header.reel": HeaderLibraryItem,
    "digit/ui/checkbox.reel": CheckboxLibraryItem,
    "digit/ui/number-field.reel": NumberFieldLibraryItem,
    "digit/ui/radio-button.reel": RadioButtonLibraryItem,
    "digit/ui/slider.reel": SliderLibraryItem,
    "digit/ui/text-field.reel": TextFieldLibraryItem,
    "digit/ui/list-item.reel": ListItemLibraryItem,
    "digit/ui/list.reel": ListLibraryItem,
    "digit/ui/map.reel": MapLibraryItem,
    "digit/ui/modal.reel": ModalLibraryItem,
    "digit/ui/notification.reel": NotificationLibraryItem,
    "digit/ui/progress.reel": ProgressLibraryItem,
    "digit/ui/select.reel": SelectLibraryItem,
    "digit/ui/split-view.reel": SplitViewLibraryItem,
    "digit/ui/tab-bar.reel": TabBarLibraryItem,
    "digit/ui/text.reel": TextLibraryItem,
    "digit/ui/text-area.reel": TextAreaLibraryItem,
    "digit/ui/title.reel": TitleLibraryItem,
    "digit/ui/toggle.reel": ToggleLibraryItem,
    "digit/ui/tool-bar.reel": ToolBarLibraryItem,
    "digit/ui/video.reel": VideoLibraryItem

};

exports.libraryAdditions = [];
