var listCommand = require('./list-command').listCommand,
    Q = require("q");


exports.listDependencies = function (where) {
    return Q.invoke(listCommand, "read", where, true);
};
