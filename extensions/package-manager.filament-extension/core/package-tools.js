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
            return (typeof name === 'string') ?
                (/^(?!(js|node|node_modules|favicon\.ico)$)(?=([0-9a-zA-Z~]([\w-\.~]){0,})$)/i).test(name) : false;
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
            return (typeof version === 'string') ? (/^v?([0-9]+\.){2}[0-9]+(-?[a-zA-Z0-9])*$/).test(version) : false;
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
            return (typeof url === 'string') ?
                (/^(https?:\/\/)?([\da-z\.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/).test(url) : false;
        }
    },

    /**
     * Checks if a string is a GitHub url.
     * @function
     * @param {String} gitUrl.
     * @return {Boolean}
     */
    isGitUrl : {
        value: function (gitUrl) {
            var response = false;

            if (typeof gitUrl === 'string') {
                var result = /^(?:(git|https?|ssh)?:\/\/|[\w-.~]+@)/.exec(gitUrl);

                if (Array.isArray(result) && result.length > 1) {
                    var protocol = result[1];

                    if (protocol === "https" || protocol === "http") { // http[s]:// case
                        response = this.isHttpGitUrl(gitUrl);

                    } else if (protocol === "ssh") { // ssh:// case
                        response = this.isSecureShellGitUrl(gitUrl);

                    } else { // git:// or git@github.com case
                        response = /^(?:git:\/\/(?:[\w-.~]+@)?|[\w-.~]+@)github\.com(?:\/|:)[\/\w.-:~\?]*\/(?:[0-9a-zA-Z~][\w-.~]*)\.git(?:#[\w-.~]*)?$/.test(gitUrl);
                    }
                }
            }

            return response;
        }
    },

    isSecureShellGitUrl: {
        value: function (url) {
            return typeof url === 'string' ?
                /^(?:ssh:\/\/)?[\w-.~]+@github\.com:[\/\w.-:~\?]*\/(?:[0-9a-zA-Z~][\w-.~]*)\.git(?:#[\w-.~]*)?$/.test(url) : false;
        }
    },

    isHttpGitUrl: {
        value: function (url) {
            return typeof url === 'string' ?
                /^https?:\/\/(?:[\w-.~]+@)?github\.com\/[\/\w.-:~\?]*\/(?:[0-9a-zA-Z~][\w-.~]*)\.git(?:#[\w-.~]*)?$/.test(url) : false;
        }
    },

    isNpmCompatibleGitUrl:{
        value: function (gitUrl) {
            var response = false;

            if (typeof gitUrl === 'string' && /^git(?:\+https?|\+ssh)?:\/\//.test(gitUrl)) { // npm compatible git url
                var url = gitUrl.replace(/^git\+/, "");
                response = this.isGitUrl(url);
            }

            return response;
        }
    },

    transformGitUrlToNpmHttpGitUrl: {
        value: function (url, secure) {
            var httpsUrl = this.transformGitUrlToHttpGitUrl(url, secure);

            if (httpsUrl) {
                return "git+" + httpsUrl;
            }
        }
    },

    transformGitUrlToHttpGitUrl: {
        value: function (gitUrl, secure) {
            var urlTransformed = null;

            if (typeof gitUrl === 'string') {
                var url = null;

                if (this.isNpmCompatibleGitUrl(gitUrl)) {
                    url = gitUrl.replace(/^git\+/, "");

                } else if (this.isGitUrl(gitUrl)) {
                    url = gitUrl;
                }

                if (url) {
                    var patternProtocol = (secure || typeof secure === "undefined") ? 'https://' : 'http://';

                    if (/github.com:/.test(url)) {
                        url = url.replace(/github\.com:/, "github.com/");
                    }

                    urlTransformed = url.replace(/^(?:(?:https?|ssh|git):\/\/(?:.*@)?|[\w-.~]+@)/, patternProtocol);
                }
            }

            return urlTransformed;
        }
    },

    isDependency: {
        value: function (module) {
            return (module && typeof module === "object" &&
                module.hasOwnProperty("name") && typeof module.name === "string" && module.name.length > 0);
        }
    },

    findModuleNameFormGitUrl: {
        value: function  (url) {
            if (this.isNpmCompatibleGitUrl(url) || this.isGitUrl(url)) {
                var resultRegExp = /([0-9a-zA-Z~][\w-.~]*)\.git/.exec(url);

                if (Array.isArray(resultRegExp) && resultRegExp.length > 1) {
                    return resultRegExp[1];
                }
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
            return (typeof email === 'string') ?
                (/^([a-z0-9_\.\-\+!#$%&'/=?^_`{|}~]+)@([\da-z.-]+)\.([a-z.]{2,6})$/).test(email) : false;
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
                module.dataParsed = [name, version];

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
            if (person && typeof person === 'object' && person.hasOwnProperty('name') && typeof person.name === 'string') {
                return {
                    name: person.name,
                    email: (typeof person.email === 'string' && this.isEmailValid(person.email)) ? person.email : '',
                    url: (typeof person.url === 'string' && this.isUrlValid(person.url)) ? person.url : ''
                };
            }
            return null;
        }
    },

    getValidRequestFromModule: {
        value: function (module) {
            if (this.isDependency(module)) {
                var version = this.isVersionValid(module.version) ? module.version : null;
                return this.isNpmCompatibleGitUrl(module.version) ? module.version : version ? module.name + '@' + version : module.name;
            }
            return null;
        }
    },

    isPersonObjectEmpty: {
        value: function (object) {
            if (object && typeof object === "object") {
                var propertiesCount = VALID_PERSON_PROPERTIES.reduce(function (propertiesCount, key) {
                        return object[key] ? propertiesCount : propertiesCount - 1;
                    }, VALID_PERSON_PROPERTIES.length);
                return !propertiesCount;
            }
            return false;
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
                wrongRequestFormat: 2002,
                unknown: 2003
            }
        },
        view: {
            codes: {
                dependencyNotFound: 3000,
                requestInvalid: 3001
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
                requestInvalid: 5000
            }
        }
    }
};

exports.DependencyNames = {
    regular: 'dependencies',
    optional: 'optionalDependencies',
    dev: 'devDependencies'
};
