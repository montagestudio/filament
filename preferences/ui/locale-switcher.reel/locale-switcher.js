/**
    @module "ui/locale-switcher.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController,
    Promise = require("montage/core/promise").Promise,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer;

/**
    Description TODO
    @class module:"ui/locale-switcher.reel".LocaleSwitcher
    @extends module:montage/ui/component.Component
*/
exports.LocaleSwitcher = Montage.create(Component, /** @lends module:"ui/locale-switcher.reel".LocaleSwitcher# */ {

    didCreate: {
        value: function() {
            var self = this;

            Object.defineBinding(self, "locale", {
                boundObject: defaultLocalizer,
                boundObjectPropertyPath: "locale",
                oneway: false
            });

            defaultLocalizer.availableLocales.then(function (locales) {
                // Get the name of each locale
                return locales.map(function (locale) {
                    var deferred = Promise.defer();
                    defaultLocalizer.localize(locale).then(function (name) {
                        var locale_name = {locale: locale, name: name()};
                        deferred.resolve(locale_name);
                    }).done();
                    return deferred.promise;
                });
            }).all().then(function (locales) {
                self.locales = ArrayController.create().initWithContent(locales);
            }).done();
        }
    },

    locale: {
        value: null
    },

    locales: {
        value: null
    }

});
