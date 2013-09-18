var LumieresDB = require("./lumieres_database").LumieresDB,
    npm = require("npm"),
    Q = require('q'),
    TIMEOUT_BEFORE_NEW_REQUEST = 900; // seconds

var PackageManagerRegistry = Object.create(Object.prototype, {

    _getLastUpdate: {
        value: function () {
            if (!this.lastUpdate) {
                var self = this;

                return LumieresDB.open().then(function (instance) {
                    return Q.ninvoke(instance, "get", "SELECT KEY_VALUE AS lastUpdate " +
                            "FROM PACKAGE_MANAGER_DATA " +
                            "WHERE KEY_NAME = 'REGISTRY_CACHE'")
                        .then(function (row) {
                            return LumieresDB.close().then(function () {
                                self.lastUpdate = Number(row ? row.lastUpdate : 0);
                                return self.lastUpdate;
                            });
                        });
                });
            }

            return Q(this.lastUpdate);
        }
    },

    lastUpdate: {
        value: null,
        writable: true
    },

    _needUpdate: {
        value: function () {
            return this._getLastUpdate().then(function (lastUpdate) {
                return (Date.now() - lastUpdate) >= (TIMEOUT_BEFORE_NEW_REQUEST * 1000);
            });
        }
    },

    update: {
        value: function (all) {
            var self = this;

            return this._needUpdate().then(function (needed) {
                if (needed) {
                    return self._performUpdate(all);
                }
                return Q(true);
            });
        }
    },

    _performUpdate: {
        value: function (all) {
            // Request for the npm registry
            var request = (!!all || this.lastUpdate === 0) ?
                    "/-/all" : "/-/all/since?stale=update_after&startkey=" + this.lastUpdate,
                self = this;

            return LumieresDB.open().then(function (instance) {
                if (!npm.config.loaded) {
                    throw new Error("NPM should be loaded first");
                }

                return Q.ninvoke(npm.registry, "get", request, TIMEOUT_BEFORE_NEW_REQUEST, false, true).then(function (modules) {
                    return Q.ninvoke(instance, "serialize").then(function () {
                        return Q.ninvoke(instance, "run", "BEGIN").then(function () {
                            var keys = Object.keys(modules),
                                stmt = instance.prepare(
                                    "INSERT INTO " +
                                        "PACKAGE_MANAGER_REGISTRY (NAME, VERSION, KEYWORDS, AUTHOR, DESCRIPTION) " +
                                        "VALUES (?, ?, ?, ?, ?)"
                                );

                            for (var i = 0, length = keys.length; i < length; i++) {
                                var module = modules[keys[i]],
                                    version = (module.versions && typeof module.versions === "object") ?
                                        Object.keys(module.versions)[0] : null;

                                if (module.name && version) {
                                    stmt.run(
                                        module.name,
                                        version,
                                        JSON.stringify(module.keywords),
                                        module.author ? module.author.name : null,
                                        module.description
                                    );
                                }
                            }

                            return Q.ninvoke(stmt, "finalize").then(function () {
                                return Q.ninvoke(instance, "run", "COMMIT").then(function () {
                                    var updated = Date.now();

                                    return Q.ninvoke(instance, "run", "UPDATE PACKAGE_MANAGER_DATA " +
                                            "SET KEY_VALUE = ? " +
                                            "WHERE KEY_NAME = 'REGISTRY_CACHE'", updated)
                                        .then(function () {
                                            self.lastUpdate = updated;
                                            return LumieresDB.close();
                                        });
                                });
                            });
                        });
                    });
                });
            });
        }
    }

});

exports.PackageManagerRegistry = PackageManagerRegistry;
