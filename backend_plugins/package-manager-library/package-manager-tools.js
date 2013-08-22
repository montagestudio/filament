exports.PackageManagerTools = Object.create(Object.prototype, {

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

    isGitUrl: {
        value: function (url) {
            return (typeof url === 'string') ? (/^git(\+https?|\+ssh)?:\/\/([\w\-\.~]+@)?[\/\w\.\-:~\?]*\/([0-9a-zA-Z~][\w\-\.~]*)\.git(#[\w\-\.~]*)?$/).exec(url) : null;
        }
    },

    /**
     * Checks if a string respects the following format: "name[@version]".
     * @function
     * @param {String} name, the dependency name to search.
     * @return {Boolean}
     */
    isRequestValid: {
        value: function (request) {
            if (this.isGitUrl(request)) {
                return true;
            }

            if (typeof request === 'string') {

                var data = request.split('@'),
                    version = data[1];

                return (data.length > 0 && data.length < 3 && (this.isNameValid(data[0])) && (typeof version === 'undefined' || (typeof version !== 'undefined' && this.isVersionValid(version))));
            }
            return false;
        }
    },

    /**
     * Returns a module Object with its name and eventually its version from a string respecting the following format "name[@version]".
     * @function
     * @param {String} string.
     * @return {Object} Module Object.
     */
    getModuleFromString: {
        value: function (string) {
            if (typeof string === 'string' && string.length > 0) {
                var module = {},
                    tmp = string.trim().split('@'),
                    name = tmp[0],
                    version = tmp[1];

                module.name = (this.isNameValid(name)) ? name : null;
                module.version = (this.isVersionValid(version) && module.name) ? version : null;

                return module;
            }
            return null;
        }
    },

    /**
     * Returns a Person Object from a string.
     * Which respect the following format "bob dylan <bob.dylan@declarativ.com> (declarativ.com)"
     * @function
     * @param {String} person
     * @return {Object} Person Object.
     */
    formatPersonFromString: {
        value: function (person) {
            if (typeof person === "string" && person.length > 0) {
                /*
                 \u0020 => space unicode
                 \u00A1 (Latin-1 Supplement) to \uFFFF (Specials)
                 */
                var personName = (/([\w\-\.\u0020\u00A1-\uFFFF]+)/).exec(person);

                if (personName) {
                    var personEmail = (/<(.+)>/).exec(person);
                    personEmail = (personEmail) ? personEmail[1] : '';

                    var personUrl = (/\((.+)\)/).exec(person);
                    personUrl = (personUrl) ? personUrl[1] : '';

                    return {
                        name: personName[1].trim(),
                        email: personEmail,
                        url: personUrl
                    };
                }
            }
        }
    },

    /**
     * Formats a string with the following format "bob dylan <bob.dylan@declarativ.com> (declarativ.com)",
     * or an object which contains several strings respecting the above format.
     * @function
     * @param {String|Object} personsContainer, a container of Person Objects or a string.
     * @return {Array} array of Person Objects.
     */
    formatPersonsContainer: {
        value: function (personsContainer) {
            if (personsContainer) {
                if (typeof personsContainer === "string") {
                    var person = this.formatPersonFromString(personsContainer);
                    personsContainer = (person) ? [person] : [];
                } else if (typeof personsContainer === "object") { // Contains several person Objects or Strings.
                    var persons = [],
                        self = this,
                        keys = Object.keys(personsContainer);

                    for (var i = 0, length = keys.length; i < length; i++) {
                        var element = personsContainer[keys[i]];

                        if (typeof element === "string") { // Needs to transform the string into an Person Object.
                            element = self.formatPersonFromString(element);

                            if (element && typeof element === "object") {
                                persons.push(element);
                            }
                        } else if (element && typeof element === "object" && element.hasOwnProperty('name')) { // Already an Object.
                            persons.push(element);
                        }
                    }

                    personsContainer = persons;
                }
            } else {
                personsContainer = [];
            }
            return personsContainer;
        }
    }

});
