var Montage = require("montage").Montage,
    Editor = require("palette/ui/editor.reel").Editor;

exports.Editor = Montage.create(Editor, {

    allowedTagNames: {
        value: ["h1", "h2", "h3", "h4", "h5", "h6", "div", "span", "p", "ul", "li", "ol", "code", "pre", "img", "a", "hr", "em", "strong"]
    }

});
