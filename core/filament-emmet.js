var emmet = require("./emmet");

var r = emmet.require;

exports.expandAbbreviation = function(abbr) {
    if (!abbr) {
        return '';
    }

    var syntax = "html";

    var filters = r('filters');
    var parser = r('abbreviationParser');

    var profile = "plain";
    r('tabStops').resetTabstopIndex();

    var data = filters.extractFromAbbreviation(abbr);
    var outputTree = parser.parse(data[0], {
        syntax: syntax
    });
    // data[1] contains user added filters http://docs.emmet.io/filters/
    // the original code passes them into filtersList.composeList, but we
    // discard them as they are only going to cause problems

    sanitize(outputTree);

    var filtersList = filters.composeList(syntax, profile);
    filters.apply(outputTree, filtersList, profile);
    return outputTree.valueOf();
};

/**
 * Trims emmet features that we don't want from the tree
 * @param  {[type]} tree [description]
 * @return {[type]}      [description]
 */
function sanitize(tree) {
    // only want one child
    tree.children.length = 1;

    var child = tree.children[0];

    // make the tag#id syntax insert montage IDs
    var id = child.attribute("id");
    if (id) {
        child.attribute("data-montage-id", id);
        // Sadly there's no API to delete an attribute, so we've got to poke
        // inside
        var attributes = child._attributes;
        for (var i = 0, len = attributes.length; i < len; i++) {
            if (attributes[i].name === "id") {
                break;
            }
        }
        if (i !== len) {
            attributes.splice(i, 1);
        }
    }

    // remove all children
    child.children = [];
}
