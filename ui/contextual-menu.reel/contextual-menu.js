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

    menuElement: {
        value: null
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
                this.templateObjects.contextualMenuOverlay.show();
            }
        }
    },

    hide: {
        value: function () {
            this.menuModel = null;
            this.templateObjects.contextualMenuOverlay.hide();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {return;}

            // TODO because of the way the overlays works, we can not listen on element, context-menu should extend overlay
            this.menuElement.addEventListener("contextmenu", this, false);
        }
    },

    surrendersActiveTarget: {
        value: function () {
            this.menuModel = null;
            return true;
        }
    },

    willPositionOverlay: {
        value: function (overlay, calculatedPosition) {
            return this.position;
        }
    },

    shouldDismissOverlay: {
        value: function (overlay, target, evt) {
            this.menuModel = null;
            return true;
        }
    },

    handleContextmenu: {
        value: function (evt) {
            evt.stop();
        }
    },

    // Event fired from a sub-menu asking for it's closure
    // Typical use is to dismiss a menu after firing a menu event
    handleDismissContextualMenu: {
        value: function (evt) {
            this.hide();
        }
    },

});
