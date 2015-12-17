var Montage = require("montage").Montage;

var Editor = Montage.specialize({

    open: {
        value: Function.noop
    }

});

exports.editorMock = function (options) {
    var editor = new Editor();

    if (options) {
        Object.keys(options).forEach(function (key) {
            editor[key] = options[key];
        });
    }

    return editor;
};



