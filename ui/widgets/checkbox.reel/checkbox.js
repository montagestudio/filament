/**
 * @module "ui/widgets/checkbox.reel"
 */
var AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox;
/**
 * @class Checkbox
 * @extends external:AbstractCheckbox
 */
exports.Checkbox = AbstractCheckbox.specialize(/** @lends Checkbox */{
    constructor: {
        value: function Checkbox() {
            this.super();
        }
    }
});