var WeakMap = require("montage/collections/weak-map");

exports.SideDataConverter = SideDataConverter;
/**
 * Use as a converter in a binding to store extra data about an object, without
 * having to store the information directly on it.
 *
 * The converter creates a WeakMap, and then for each object that it sees
 * creates another object in which you can store extra data.
 * @example
 * this.defineBinding("objectInfo", {"<-": "object", converter: new SideDataConverter()});
 *
 */
function SideDataConverter () {
    this._weakmap = new WeakMap();
}

SideDataConverter.prototype.convert = function (value) {
    if (value) {
        var weakmap = this._weakmap;
        if (!weakmap.has(value)) {
            weakmap.set(value, {});
        }
        return weakmap.get(value);
    } else {
        return null;
    }
};
