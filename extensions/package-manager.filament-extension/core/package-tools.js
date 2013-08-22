exports.ToolsBox = Object.create(Object.prototype, {

    /**
     * Checks if a package name is valid.
     * @function
     * @param {String} name
     * @return {Boolean}
     */
    isNameValid: {
        value: function (name) {
            return (typeof name === 'string') ? (/^(?!(js|node|node_modules|favicon\.ico)$)(?=([0-9a-zA-Z~]([\w\-\.~]){0,})$)/i).test(name) : false;
        }
    },

    /**
     * Checks if a package version is valid.
     * @function
     * @param {String} version
     * @return {Boolean}
     */
    isVersionValid: {
        value: function (version) {
            return (typeof version === 'string') ? (/^v?([0-9]+\.){2}[0-9]+(\-?[a-zA-Z0-9])*$/).test(version) : false;
        }
    },

    /**
     * Checks if an url is valid.
     * @function
     * @param {String} url
     * @return {Boolean}
     */
    isUrlValid: {
        value: function (url) {
            return (typeof url === 'string') ? (/^(https?:\/\/)?([\da-z\.\-]+)\.([a-z\.]{2,6})([\/\w\.\-]*)*\/?$/).test(url) : false;
        }
    },

    isGitUrl: {
        value: function (url) {
            return (typeof url === 'string') ? (/^git(\+https?|\+ssh)?:\/\/([\w\-\.~]+@)?[\/\w\.\-:~\?]*\/([\w\-\.~]+){1}\.git(#[\w\-\.~]*)?$/).exec(url) : false;
        }
    },

    findModuleNameFormGitUrl: {
        value: function  (url) {
            var results = this.isGitUrl(url);

            if (Array.isArray(results) && results.length > 0) {
                return results[3];
            }
        }
    },

    /**
     * Checks if an email is valid.
     * @function
     * @param {String} email
     * @return {Boolean}
     */
    isEmailValid: {
        value: function (email) {
            return (typeof email === 'string') ? (/^([a-z0-9_\.\-\+!#$%&'/=?^_`{|}~]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/).test(email) : false;
        }
    },

    /**
     * Returns a module Object with its name and eventually its version from a string,
     * which respects the following format "name[@version]"
     * @function
     * @param {String} string.
     * @return {Object}
     */
    getModuleFromString: {
        value: function (string) {
            if (typeof string === 'string' && string.length > 0) {
                var module = {},
                    tmp = string.trim().split('@'),
                    name = tmp[0],
                    version = tmp[1];

                module.name = (this.isNameValid(name)) ? name : '';
                module.version = (this.isVersionValid(version)) ? version : null;

                return module;
            }
            return null;
        }
    },

    /**
     * Returns the allowed Person properties.
     * @type {Array}
     * @default allowed Person properties.
     * @private
     */
    _validPersonProperties: {
        get: function () {
            return [
                'name',
                'email',
                'url'
            ];
        }
    },

    /**
     * Checks if two Person objects are equal.
     * @function
     * @param {Object} a, person A.
     * @param {Object} b, person B.
     * @return {Boolean}
     */
    isPersonEqual: {
        value: function (a, b) {
            if (a && b && typeof a === 'object' && typeof b === 'object') {
                var properties = this._validPersonProperties;

                for (var i = 0, length = properties.length; i < length; i++) {
                    if (a[properties[i]] !== b[properties[i]]) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    },

    /**
     * Returns a valid Person object.
     * @function
     * @param {Object} a, person A.
     * @param {Object} b, person B.
     * @return {Object}
     */
    getValidPerson: {
        value: function (person) {
            if (person && typeof person === 'object' && person.hasOwnProperty('name') && typeof person.name === 'string' && person.name.length > 0) {

                return {
                    name: person.name,
                    email: (typeof person.email === 'string' && this.isEmailValid(person.email)) ? person.email : '',
                    url: (typeof person.url === 'string' && this.isUrlValid(person.url)) ? person.url : ''
                };
            }
            return null;
        }
    }

});

exports.Errors = {
    commands: {
        list: {
            codes: {
                missing: 1000,
                versionInvalid: 1001,
                fileErrors: 1002,
                extraneous: 1003,
                projectFileErrors: 1004,
                pathMissing: 1005
            },
            messages: {
                1000: 'dependency missing',
                1001: 'version not valid',
                1002: 'package json file shows errors',
                1003: 'dependency is extraneous',
                1004: 'project package.json file shows errors',
                1005: 'the project path is missing'
            }
        },
        install: {
            codes: {
                dependencyNotFound: 2000,
                versionNotFound: 2001,
                requestInvalid: 2002,
                wrongRequestFormat: 2003
            },
            messages: {
                2000: 'dependency not found',
                2001: 'version not found',
                2002: 'request invalid',
                2003: 'wrong format, should respect the following format: name[@version] | or a git url'
            }
        },
        view: {
            codes: {
                dependencyNotFound: 3000,
                requestInvalid: 3001,
                wrongRequestFormat: 3002
            },
            messages: {
                3000: 'dependency not found',
                3001: 'request invalid',
                3002: 'wrong format, should respect the following format: name[@version].'
            }
        },
        remove: {
            codes: {
                nameInvalid: 4000,
                pathInvalid: 4001,
                fsErrors: 4002,
                dependencyMissing: 4003
            },
            messages: {
                4000: 'dependency name invalid',
                4001: 'dependency path invalid',
                4002: 'error filesystem permissions',
                4003: 'dependency missing'
            }
        }
    }
};

exports.DependencyNames = {
    dependencies: 'dependencies',
    optionalDependencies: 'optionalDependencies',
    devDependencies: 'devDependencies'
};
