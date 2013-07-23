var Montage = require("montage").Montage,
    Editor = require("palette/ui/editor.reel").Editor;

exports.PackageEditor = Montage.create(Editor, {

    constructor: {
        value: function PackageEditor () {
            this.super();
        }
    }

});
