var MessageFormat = require("montage/core/messageformat");

var alphaRe = /[a-z]/gi;
var lookup = {
    // Lower case
    "a": "àæ",
    "b": "ß",
    "c": "çć",

    "e": "éë",

    "i": "ïî",

    "l": "ł",

    "n": "ñ",
    "o": "ôœõ",

    "s": "ś",

    "u": "üúū",

    "y": "ÿ",
    "z": "žż",

    // Upper case
    "A": "ÆĀ",

    "C": "ÇČ",

    "E": "ĘË",

    "I": "ÏÎ",

    "L": "Ł",

    "N": "Ñ",
    "O": "ŒÔØ",

    "S": "Š",

    "U": "ÜŪÙ",

    "Y": "Ÿ",
    "Z": "ŽŹ"
};

var messageFormat = new MessageFormat("en-x-test");
var original = require("../en/messages.json");

//jshint -W089
for (var key in original) {
    var message = original[key].message || original[key];
    exports[key] = translate(message);
}

function translate(message) {
    var ast = messageFormat.parse(message);

    visit(ast, function (node) {
        if (node.type === "string") {
            node.val = node.val.replace(alphaRe, function (match) {
                return lookup[match] || match;
            });
        }
    });

    //jshint -W054
    return (new Function( 'MessageFormat',
      'return ' + messageFormat.precompile(ast)
    ))(MessageFormat);
}

function visit(tree, visitor) {
    // only visit syntax nodes
    if ("type" in tree) {
        visitor(tree);
    }

    for (var key in tree) {
        var child = tree[key];
        if (typeof child === "object") {
            visit(tree[key], visitor);
        }
    }
}
