/**
    @module "ui/locale-switcher.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController,
    Promise = require("montage/core/promise").Promise,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer;

/**
    Description TODO
    @class module:"ui/locale-switcher.reel".LocaleSwitcher
    @extends module:montage/ui/component.Component
*/
exports.LocaleSwitcher = Component.specialize(/** @lends module:"ui/locale-switcher.reel".LocaleSwitcher# */ {

    constructor: {
        value: function LocaleSwitcher() {
            this.super();
            var self = this;

            this.defineBinding("locale", {"<->": "locale", source: defaultLocalizer});

            defaultLocalizer.availableLocales.then(function (locales) {
                // Get the name of each locale
                return locales.map(function (locale) {
                    var deferred = Promise.defer();
                    defaultLocalizer.localize(locale).then(function (name) {
                        deferred.resolve({locale: locale, name: name()});
                    }).done();
                    return deferred.promise;
                });
            }).all().then(function (locales) {
                self.locales = new RangeController().initWithContent(locales);
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
