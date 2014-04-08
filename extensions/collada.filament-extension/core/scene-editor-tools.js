/*global module*/
/*jshint -W092*/

var SceneEditorTools = {};

SceneEditorTools.isMaterialProxy = function (proxyId) {
    return /mjs-volume\/runtime\/material/.test(proxyId);
};


SceneEditorTools.isNodeProxy = function (proxyId) {
    return /mjs-volume\/runtime\/node/.test(proxyId);
};


SceneEditorTools.isSupportedProxy = function (proxyId) {
    return /mjs-volume\/runtime\/(?:node|material)/.test(proxyId);
};

module.exports = SceneEditorTools;

/*jshint +W092*/
