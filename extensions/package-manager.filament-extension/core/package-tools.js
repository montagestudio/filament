exports.PackageTools = Object.create(Object.prototype, {

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
