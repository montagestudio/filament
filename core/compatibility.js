/* global DOMStringList */

// Firefox uses DOMStringList for dataTransfer.types
if (typeof DOMStringList === "object") {
    DOMStringList.prototype.indexOf = Array.prototype.indexOf;
    DOMStringList.prototype.has = Array.prototype.has;
    DOMStringList.prototype.find = Array.prototype.find;
    DOMStringList.prototype.forEach = Array.prototype.forEach;
}
