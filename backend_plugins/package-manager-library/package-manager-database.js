/*global __dirname */
var sqlite3 = require('sqlite3'),
    FS = require("q-io/fs"),
    path = require('path'),
    Q = require('q'),
    INIT_FILENAME = 'init-database.sql',
    DATABASE_NAME = 'package-manager.db';

var PackageManagerDB = Object.create(Object.prototype, {

    init: {
        value: function () {
            var self = this;

            return FS.read(path.join(__dirname, INIT_FILENAME)).then(function (file) {
                return Q.ninvoke(self.database, "exec", file).then(function () {
                    return self.database;
                });
            });
        }
    },

    load: {
        value: function (url) {
            if (typeof url === "string" && url.length > 0) {
                this.url = path.join(url, DATABASE_NAME);
                return this._getInstance();
            }

            return Q.reject(new Error("The Database path is incorrect"));
        }
    },

    _getInstance: {
        value: function () {
            var self = this;

            return FS.exists(this.url).then(function (exist) {
                return Q.fcall(function () {
                    self.database = new sqlite3.Database(self.url);

                    if (!exist) {
                        return self.init();
                    }
                    return self.database;
                });
            });
        }
    },

    open: {
        value: function () {
            if (!this.url) {
                throw new Error("PackageManagerDB should be loaded first");
            }

            if (!this.database || !this.database.open) {
                return this._getInstance();
            }
            return Q(this.database); // already opened
        }
    },

    close: {
        value: function () {
            return Q.ninvoke(this.database, "close");
        }
    },

    database: {
        value: null,
        writable: true
    },

    url: {
        value: null,
        writable: true
    },

    opened: {
        get: function () {
            return (this.database && this.database.open);
        }
    }

});

exports.PackageManagerDB = PackageManagerDB;
