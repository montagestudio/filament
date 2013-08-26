var VALID_PERSON_PROPERTIES = [
    'name',
    'email',
    'url'
];

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
            return (typeof url === 'string') ? (/^git(\+https?|\+ssh)?:\/\/([\w\-\.~]+@)?[\/\w\.\-:~\?]*\/([0-9a-zA-Z~][\w\-\.~]*)\.git(#[\w\-\.~]*)?$/).exec(url) : null;
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
     * Checks if two Person objects are equal.
     * @function
     * @param {Object} a, person A.
     * @param {Object} b, person B.
     * @return {Boolean}
     */
    isPersonEqual: {
        value: function (a, b) {
            if (a && b && typeof a === 'object' && typeof b === 'object') {
                for (var i = 0, length = VALID_PERSON_PROPERTIES.length; i < length; i++) {
                    if (a[VALID_PERSON_PROPERTIES[i]] !== b[VALID_PERSON_PROPERTIES[i]]) {
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
            }
        },
        install: {
            codes: {
                dependencyNotFound: 2000,
                versionNotFound: 2001,
                requestInvalid: 2002,
                wrongRequestFormat: 2003
            }
        },
        view: {
            codes: {
                dependencyNotFound: 3000,
                requestInvalid: 3001,
                wrongRequestFormat: 3002
            }
        },
        remove: {
            codes: {
                nameInvalid: 4000,
                pathInvalid: 4001,
                fsErrors: 4002,
                dependencyMissing: 4003
            }
        },
        search: {
            codes: {
                requestType: 5000,
                requestInvalid: 5001
            }
        }
    }
};

exports.DependencyNames = {
    dependencies: 'dependencies',
    optionalDependencies: 'optionalDependencies',
    devDependencies: 'devDependencies'
};
