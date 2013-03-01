/**
 @module "./viewer.reel"
 @requires montage
 @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    ImageDocument = require("core/image-document").ImageDocument,
    Promise = require("montage/core/promise").Promise,
    Editor = require("palette/ui/editor.reel").Editor;

/**
 Description TODO
 @class module:"./viewer.reel".Viewer
 @extends module:palette/ui/editor.reel.Editor
 */
exports.Viewer = Montage.create(Editor, /** @lends module:"./viewer.reel".Viewer# */ {

    /*
     * Create and load the document.<br/>
     * <b>Note:</> This must be overwritten by sub classes
     * @returns By default a rejected promise.
     */
    loadDocument:{
        value:function (fileUrl, packageUrl) {
            return Promise.resolve(ImageDocument.create().init(fileUrl, packageUrl));
        }
    }

});
