var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item.js").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;


var ActionSheetLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/action-sheet.reel",
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

var AudioLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/audio.reel",
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

var ButtonGroupLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/button-group.reel",
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

var ButtonLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/button.reel",
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

var HeaderLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/header.reel",
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

var InputCheckboxLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/input-checkbox.reel",
            "properties": {
                "element": {"#": "checkbox"},
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

var InputDateLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/input-date.reel",
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
            "prototype": "digit/input-number.reel",
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

var InputRadioLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/input-radio.reel",
            "properties": {
                "element": {"#": "radio"},
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
        value: '<input type="radio" data-montage-id="radio">'
    }

});

var InputRangeLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/input-range.reel",
            "properties": {
                "element": {"#": "inputRange"},
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
        value: '<input type="range" data-montage-id="inputRange">'
    }

});

var InputTextLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/input-text.reel",
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

var ListLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/list.reel",
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

var MapLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/map.reel",
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

var ModalLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/popup/modal.reel",
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

var NotificationLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/popup/notification.reel",
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

var ProgressLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/progress.reel",
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

var SelectLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/select.reel",
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

var SplitViewLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/split-view.reel",
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

var TabBarLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/popup/tab-bar.reel",
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

var TextareaLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/textarea.reel",
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

var ToggleLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/toggle.reel",
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

var ToolBarLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/popup/tool-bar.reel",
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

var VideoLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "digit/video.reel",
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

    "digit/action-sheet.reel": ActionSheetLibraryItem,
    "digit/audio.reel": AudioLibraryItem,
    "digit/button-group.reel": ButtonGroupLibraryItem,
    "digit/button.reel": ButtonLibraryItem,
    "digit/header.reel": HeaderLibraryItem,
    "digit/input-checkbox.reel": InputCheckboxLibraryItem,
    "digit/input-number.reel": InputNumberLibraryItem,
    "digit/input-radio.reel": InputRadioLibraryItem,
    "digit/input-range.reel": InputRangeLibraryItem,
    "digit/input-text.reel": InputTextLibraryItem,
    "digit/list.reel": ListLibraryItem,
    "digit/map.reel": MapLibraryItem,
    "digit/modal.reel": ModalLibraryItem,
    "digit/notification.reel": NotificationLibraryItem,
    "digit/progress.reel": ProgressLibraryItem,
    "digit/select.reel": SelectLibraryItem,
    "digit/split-view.reel": SplitViewLibraryItem,
    "digit/tab-bar.reel": TabBarLibraryItem,
    "digit/textarea.reel": TextareaLibraryItem,
    "digit/toggle.reel": ToggleLibraryItem,
    "digit/tool-bar.reel": ToolBarLibraryItem,
    "digit/video.reel": VideoLibraryItem

};

exports.libraryAdditions = [];
