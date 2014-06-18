/**
    module:"ui/widgets/textarea.reel"
*/
/*global require,exports */
var AbstractTextArea = require("montage/ui/base/abstract-text-area").AbstractTextArea;

/**
 * Textarea
 * @class module:"ui/widgets/textarea.reel".Textarea
 * @lends module:"native/ui/textarea.reel".Textarea
 */
exports.Textarea = AbstractTextArea.specialize(/** @lends module:"ui/widgets/textarea.reel".Textarea */ {

    hasTemplate: {value: true},

    constructor: {
        value: function Textarea() {
            this.super();
            this.classList.add("Textarea");
        }
    }
});
