/* global DOMStringList: false */
var Promise = require("montage/core/promise").Promise;

// Firefox uses DOMStringList for dataTransfer.types
if (typeof DOMStringList === "object") {
    DOMStringList.prototype.indexOf = Array.prototype.indexOf;
    DOMStringList.prototype.has = Array.prototype.has;
    DOMStringList.prototype.find = Array.prototype.find;
    DOMStringList.prototype.forEach = Array.prototype.forEach;
}

/**
 * Because a text field takes the text/plain data from a drop event, we need to
 * go in afterwards and instead use the content we want.
 *
 * NOTE: This only works in Webkit!
 *
 * This should be used as follows:
 *
 *      handleDrop: {
 *          value: function (event) {
 *              var element = this.inputEl;
 *              var plain = event.dataTransfer.getData("text/plain");
 *              var rich = event.dataTransfer.getData(YOUR_MIME_TYPE);
 *              replaceDroppedTextPlain(plain, rich, inputEl);
 *          }
 *      }
 *
 * @param  {string} plain   The plain text to replace
 * @param  {string} rich    The "rich" text to replace it with
 * @param  {HTMLElement} element The input element that the drop is happening on.
 */
exports.replaceDroppedTextPlain = function (plain, rich, element) {
    var inputHandler = function (event) {
        element.removeEventListener("input", inputHandler, false);

        var point = element.selectionStart;
        // Text before the plain insertion
        var before = element.value.substr(0, point);
        // Text after the plain insertion
        var after = element.value.substr(point + plain.length);

        // Replace the plain text with the "rich" text
        element.value = before + rich + after;

        // HACK: The actual selection happens after the input event, even
        // though no selection event is fired. So this waits for the next tick
        // and changes the selection then.
        //Benoit: Replaces Promise.nextTick(..) Not ideal as it creates a useless promise
        Promise.resolve().then(function () {
            element.setSelectionRange(point, point + rich.length);
        });
    };

    element.addEventListener("input", inputHandler, false);
};
