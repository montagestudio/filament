require.inject("filament/adaptor/client/core/file-descriptor", require("mocks/file-descriptor-mocks"));

// More of these specs should be able to run under node
module.exports = require("montage-testing").run(require, [
    // Please keep in alphabetical order
    {name: "filament/extensions/package-manager.filament-extension/test/package-document-spec", node: false},
    "filament/extensions/package-manager.filament-extension/test/package-tools-spec",
    {name: "core/asset-manager-spec", node: false},
    {name: "core/code-editor-document-spec", node: false},
    {name: "core/document-data-source-spec", node: false},
    {name: "core/node-proxy-spec", node: false},
    // "core/object-references-spec", // TODO: Broken. Investigate collections/set
    {name: "core/project-controller-extensions-spec", node: false},
    {name: "core/project-controller-file-spec", node: false},
    {name: "core/project-controller-filesystem-spec", node: false},
    {name: "core/project-controller-spec", node: false},
    {name: "core/reel-blueprint-editing-spec", node: false},
    {name: "core/reel-context-spec", node: false},
    {name: "core/reel-document-selected-elements-spec", node: false},
    {name: "core/reel-document-spec", node: false},
    {name: "core/reel-proxy-spec", node: false},
    "core/tree-controller-spec",
    "core/url-spec",
    {name: "services/file-sync-spec", karma: false},
    {name: "ui/template-explorer/content/edit-properties-spec", node: false}

    // TODO: Specs broken due to some issue with Montage serialization visitors
    // "core/reel-document-headless-editing-spec",
    // "core/reel-document-listener-editing-spec",
    // "core/reel-document-proxy-serialization-spec",
    // "core/reel-document-saving-spec",
    // "core/reel-document-template-editing-spec",
]);
