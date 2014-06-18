/**
 * @module "ui/widgets/button.reel"
 */
var AbstractButton = require("montage/ui/base/abstract-button").AbstractButton;
/**
 * @class Button
 * @extends external:AbstractButton
 * @classdesc
 */
exports.Button = AbstractButton.specialize( /** @lends Button# */ {

    hasTemplate: {value: true},

    constructor : {
        value: function Button() {
            this.super();

            this.classList.add("Button");
        }
    }
});
