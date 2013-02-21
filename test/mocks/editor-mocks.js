var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise;

var Editor = Montage.create(Montage, {

    load: {
        value: function (fileUrl) {
            return Promise.reject(new Error("Editor cannot open fileUrl"));
        }
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



