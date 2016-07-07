var Montage = require("montage").Montage;

var EditorController = Montage.specialize({

    bringEditorToFront: {
        value: Function.noop
    },

    hideEditors: {
        value: Function.noop
    }

});

exports.editorControllerMock = function (options) {
    var editorController = new EditorController();

    if (options) {
        Object.keys(options).forEach(function (key) {
            editorController[key] = options[key];
        });
    }

    return editorController;
};



