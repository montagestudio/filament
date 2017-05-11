var Esprima = require("esprima");

exports.injectMethod = function (input, name, methodName) {
    var argNames = Array.prototype.slice.call(arguments, 3);
    var injection = "\n\n    " + methodName + ": {\n        value: function (" + argNames.join(", ") + ") {\n        }\n    }\n\n";
    var syntax = Esprima.parse(input, {
        comment: true,
        loc: true,
        range: true
    });
    var declaration = findDeclaration(syntax, name);
    if (!declaration) {
        throw new Error("Can't find a declaration of " + name);
    }

    if (alreadyHasEntry(declaration, methodName)) {
        return input;
    }

    var lastEntry = findLastEntry(declaration);
    var betweenStart;
    var comma = "";
    if (lastEntry) {
        betweenStart = lastEntry.range[1];
        comma = ",";
    } else {
        betweenStart = declaration.range[0];
    }

    var declarationAt = declaration.range[1];
    var between = input.slice(betweenStart, declarationAt - 1).trimRight();
    var leader = input.slice(0, betweenStart);
    var follower = input.slice(declarationAt - 1);
    return leader + comma + between + injection + follower;
};

exports.removeMethod = function (input, name, methodName) {
    var syntax = Esprima.parse(input, {
        comment: true,
        loc: true,
        range: true
    });
    var declaration = findDeclaration(syntax, name);
    if (!declaration) {
        throw new Error("Can't find a declaration of " + name);
    }

    var entry = findEntry(declaration, methodName);
    if (!entry) {
        return input;
    }

    var lastEntry = findLastEntry(declaration);

    var leader = input.slice(0, entry.range[0]).trimRight();
    var follower = input.slice(entry.range[1]);

    if (entry === lastEntry) {
        // remove trailing comma
        leader = leader.replace(/,$/, "");
    } else {
        // remove leading comma
        follower = follower.replace(/^,/, "");
    }

    return leader + follower;
};

// TODO: Extend parsing to non-literal properties
exports.getProperties = function (input, exportName) {
    var syntax,
        nodes,
        properties = {};

    try {
        syntax = Esprima.parse(input, {
            comment: true,
            loc: true,
            range: true
        });
    } catch (e) {
        return properties;
    }

    nodes = getSpecializeProperties(syntax, exportName);
    for (var i = 0, length = nodes.length; i < length; i++) {
        var node = nodes[i];
        if (node.type === "Property" && node.value.type === "ObjectExpression") {
            for (var j = 0, jl = node.value.properties.length; j < jl; j++) {
                var objectProperty = node.value.properties[j];
                if (objectProperty.value.type === "Identifier" ||
                    objectProperty.value.type === "Literal") {
                    properties[node.key.name] = objectProperty.value.value;
                }
            }
        }
    }
    return properties;
};

// TODO: Parse contents of function body
exports.getFunctions = function (input, exportName) {
    var syntax,
        nodes,
        functions = {};

    try {
        syntax = Esprima.parse(input, {
            comment: true,
            loc: true,
            range: true
        });
    } catch (e) {
        return functions;
    }

    nodes = getSpecializeProperties(syntax, exportName);
    for (var i = 0, length = nodes.length; i < length; i++) {
        var node = nodes[i];
        if (node.type === "Property" && node.value.type === "ObjectExpression") {
            for (var j = 0, jl = node.value.properties.length; j < jl; j++) {
                var objectProperty = node.value.properties[j];
                if (objectProperty.value.type === "FunctionExpression") {
                    functions[node.key.name] = null;
                }
            }
        }
    }
    return functions;
};

function getExportDefinition(syntax, exportName) {
    var nodes = syntax.body;
    for (var index = 0, length = nodes.length; index < length; index++) {
        var node = nodes[index];
        if (node.type === "ExpressionStatement") {
            var expression = node.expression;
            if (expression.type === "AssignmentExpression" && expression.operator === "=") {
                var left = expression.left;
                if (!doesExport(left, exportName)) {
                    continue;
                }
                return expression.right;
            }
        }
    }
}

function getSpecializeProperties(syntax, exportName) {
    var export_ = getExportDefinition(syntax, exportName);
    if (export_ && export_.arguments[0]) {
        return export_.arguments[0].properties;
    }
    return [];
}

function findDeclaration(syntax, name) {
    var nodes = syntax.body;
    for (var index = 0, length = nodes.length; index < length; index++) {
        var node = nodes[index];
        if (node.type === "ExpressionStatement") {
            var expression = node.expression;
            if (expression.type === "AssignmentExpression" && expression.operator === "=") {
                var left = expression.left;
                if (!doesExport(left, name)) {
                    continue;
                }
                var right = expression.right;
                return getPropertyDeclaration(right);
            }
        }
    }
}

function findLastEntry(declaration) {
    var properties = declaration.properties;
    if (!properties.length) {
        return 0;
    }
    return properties[properties.length - 1];
}

function alreadyHasEntry(declaration, name) {
    return !!findEntry(declaration, name);
}

function findEntry(declaration, name) {
    var properties = declaration.properties;
    for (var index = 0; index < properties.length; index++) {
        var property = properties[index];
        if (property.key.type === "Identifier" && property.key.name === name) {
            return property;
        }
    }
    return false;
}

function doesExport(syntax, name) {
    return (
        syntax.type === "MemberExpression" &&
        !syntax.computed &&
        syntax.object.type === "Identifier" &&
        syntax.object.name === "exports" &&
        syntax.property.type === "Identifier" &&
        syntax.property.name === name
    );
}

function getPropertyDeclaration(syntax) {
    if (
        syntax.type === "CallExpression" &&
        syntax.callee.type === "MemberExpression" &&
        syntax.callee.property.type === "Identifier" &&
        syntax.callee.property.name === "specialize" &&
        syntax.arguments.length > 0 &&
        syntax.arguments[0].type === "ObjectExpression"
    ) {
        return syntax.arguments[0];
    }
}
