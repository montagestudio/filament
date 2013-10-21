var Montage = require("montage").Montage;

var EditorController = Montage.create(Montage, {

    bringEditorToFront: {
        value: Function.noop
    },

    hideEditors: {
        value: Function.noop
    }

});

exports.editorControllerMock = function (options) {
    var editorController = EditorController.create();

    if (options) {
        Object.keys(options).forEach(function (key) {
            editorController[key] = options[key];
        });
    }

    return editorController;
};



