/**
 * @module ui/contextual-menu.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ContextualMenu
 * @extends Component
 */
exports.ContextualMenu = Component.specialize(/** @lends ContextualMenu# */ {
    constructor: {
        value: function ContextualMenu() {
            this.super();
        }
    },

    position: {
        value: null
    },

    projectController: {
        value: null
    },

    activePath: {
        value: []
    },

    menuModel: {
        value: null
    },

    dispatchTarget: {
        value: null
    },

    show: {
        value: function (position) {
            var target,
                element = document.elementFromPoint(position.left, position.top);

            while (element.parentElement && !(element.component && element.component.contextualMenu)) {
                element = element.parentElement;
            }

            if (!element.component) {
                return;
            }

            target = element.component;
            if (target.contextualMenu) {
                this.position = position;
                this.dispatchTarget = target;
                this.menuModel = target.contextualMenu;
                target.contextualMenu.items.forEach(function (item) {
                    target.dispatchEventNamed("contextualMenuValidate", true, true, item);
                });
                this.templateObjects.contextualMenuOverlay.show(this.position);
            }
        }
    },

    hide: {
        value: function () {
            this.menuModel = null;
            this.templateObjects.contextualMenuOverlay.hide();
        }
    },

    surrendersActiveTarget: {
        value: function () {
            this.menuModel = null;
            return true;
        }
    },

    // Event fired from a sub-menu asking for it's closure
    // Typical use is to dismiss a menu after firing a menu event
    handleDismissContextualMenu: {
        value: function (evt) {
            this.hide();
        }
    }

});
