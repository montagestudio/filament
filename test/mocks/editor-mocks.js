var Montage = require("montage").Montage;

var Editor = Montage.create(Montage, {

    open: {
        value: Function.noop
    }

});

exports.editorMock = function (options) {
    var editor = Editor.create();

    if (options) {
        Object.keys(options).forEach(function (key) {
            editor[key] = options[key];
        });
    }

    return editor;
};



