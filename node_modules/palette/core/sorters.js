/*jshint node:true,strict:false */

/**
 * Creates a comparator function (i.e. for [].sort()) that sorts strings that
 * are in the `strings` array in the order given, and sorts other strings
 * alphabetically.
 * @param  {Array<string>} properties An array of strings, in the order you
 * want them sorted.
 * @return {Function} A comparator function.
 */
exports.makeSortedStringComparator = sortedStringComparator;
function sortedStringComparator(strings) {
    return function (a, b) {
        var aIndex = strings.indexOf(a),
            bIndex = strings.indexOf(b);

        // Not found, do a regular compare
        if (aIndex === -1 && bIndex === -1) {
            return a.localeCompare(b);
        }
        // a not found, a goes after
        if (aIndex === -1) {
            return 1;
        }
        // b not found, a goes before
        if (bIndex === -1) {
            return -1;
        }
        // order as in the strings array
        return aIndex - bIndex;
    };
}

/**
 * Creates a sorter function that takes an object and a property name, and
 * returns a new object with the properties in the order created by sorting
 * the keys with comparator.
 * @param  {Function} comparator A comparator function.
 * @param  {Function} [sort]     A function to sort object properties with.
 * @return {Function}
 */
exports.makeObjectPropertySorter = objectPropertySorter;
function objectPropertySorter(comparator, sort) {
    return function (object, name) {
        if (Array.isArray(object) || typeof object !== "object") {
            return object;
        }
        var newObject = {};
        Object.keys(object).sort(comparator).forEach(function (name) {
            newObject[name] = sort ? sort(object[name], name) : object[name];
        });
        return newObject;
    };
}

var alphabeticSorter = exports.alphabeticSorter = objectPropertySorter(
    String.prototype.localeCompare.call.bind(String.prototype.localeCompare)
);

var propertiesComparator = exports.propertiesComparator = sortedStringComparator(["element"]);
var propertiesSorter = exports.propertiesSorter = objectPropertySorter(propertiesComparator);

var unitComparator = exports.unitComparator = sortedStringComparator(["prototype", "object", "module", "name", "properties"]);
var unitSorter = exports.unitSorter = objectPropertySorter(unitComparator, function (object, name) {
    if (name === "properties") {
        return propertiesSorter(object, name);
    } else {
        return alphabeticSorter(object, name);
    }
});

var labelComparator = exports.labelComparator = sortedStringComparator(["owner", "application"]);
exports.labelSorter = objectPropertySorter(labelComparator, unitSorter);
