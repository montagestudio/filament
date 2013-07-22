exports.PackageTools = Object.create(Object.prototype, {

    isNameValid: {
        value: function (name) {
            return (typeof name === 'string') ? (/^(?!(js|node)$)(?=([0-9a-zA-Z~]([\w\-\.~]){0,})$)/i).test(name) : false;
        }
    },

    isVersionValid: {
        value: function (version) {
            return (typeof version === 'string') ? (/^v?([0-9]+\.){2}[0-9]+(\-?[a-zA-Z0-9])*$/).test(version) : false;
        }
    },

    isUrlValid: {
        value: function (url) {
            return (typeof url === 'string') ? (/^(https?:\/\/)?([\da-z\.\-]+)\.([a-z\.]{2,6})([\/\w\.\-]*)*\/?$/).test(url) : false;
        }
    },

    isEmailValid: {
        value: function (email) {
            return (typeof email === 'string') ? (/^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/).test(email) : false;
        }
    },

    _validPersonProperties: {
        get: function () {
            return [
                'name',
                'email',
                'url'
            ];
        }
    },

    isPersonEqual: {
        value: function (a, b) {
            if (a && b && typeof a === 'object' && typeof b === 'object') {
                var properties = this._validPersonProperties;

                for (var i = 0; i < properties.length; i++) {
                    if (a[properties[i]] !== b[properties[i]]) {
                        return false;
                    }
                }

                return true;
            }
            return false;
        }
    },

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
