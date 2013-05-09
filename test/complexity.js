var cr = require('complexity-report'),
    Q = require("q"),
    FS = require("q-io/fs"),
    list = [];

// How many functions to show the complexity of
var TOP_COUNT = 5;
// The highest acceptable cyclomatic-complexity
var MAX_CYCLOMATIC = 10;

FS.listTree(".", function (path, stat) {
    if (/node_modules|test/.test(path)) {
        return null;
    }
    if (stat.isDirectory()) {
        return false;
    }

    return (/.js$/).test(path);
})
.then(function (tree) {
    return Q.all(tree.map(function (filename) {
        return FS.read(filename)
        .then(function (content) {
            cr.run(content).functions.forEach(function(entry) {
                list.push({
                    filename: filename,
                    line: entry.line,
                    name: entry.name,
                    value: entry.complexity.cyclomatic
                });
            });
        }).fail(function (error) {
            throw new Error("Can't analyse " + filename + " because: " + error.message);
        });
    }));
})
.then(function () {
    list.sort(function (x, y) {
        return y.value - x.value;
    });

    console.log('Most cyclomatic-complex functions:');
    list.slice(0, TOP_COUNT + 1).forEach(function (entry) {
        console.log(' ', entry.filename + ":" + entry.line, entry.name, entry.value);
    });

    if (list[0].value > MAX_CYCLOMATIC) {
        throw new Error("Maximum cyclomatic-complexity exceeded (" + MAX_CYCLOMATIC + ")");
    }
}).done();

