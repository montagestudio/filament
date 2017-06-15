require.inject("filament/adaptor/client/core/file-descriptor", require("mocks/file-descriptor-mocks"));

// More of these specs should be able to run under node
module.exports = require("montage-testing").run(require, [
    // Please keep in alphabetical order
    {name: "filament/extensions/package-manager.filament-extension/test/package-document-spec", node: false},
    "filament/extensions/package-manager.filament-extension/test/package-tools-spec",
    {name: "spec/core/asset-manager-spec", node: false},
    {name: "spec/core/code-editor-document-spec", node: false},
    {name: "spec/core/document-data-source-spec", node: false},
    {name: "spec/core/node-proxy-spec", node: false},
    // "core/object-references-spec", // TODO: Broken. Investigate collections/set
    {name: "spec/core/project-controller-extensions-spec", node: false},
    {name: "spec/core/project-controller-file-spec", node: false},
    {name: "spec/core/project-controller-filesystem-spec", node: false},
    {name: "spec/core/project-controller-spec", node: false},
    {name: "spec/core/reel-blueprint-editing-spec", node: false},
    {name: "spec/core/reel-context-spec", node: false},
    {name: "spec/core/reel-document-selected-elements-spec", node: false},
    {name: "spec/core/reel-document-spec", node: false},
    {name: "spec/core/reel-proxy-spec", node: false},
    "spec/core/tree-controller-spec",
    "spec/core/url-spec",
    {name: "spec/services/file-sync-spec", karma: false},
    {name: "spec/ui/template-explorer/content/edit-properties-spec", node: false}

    // TODO: Specs broken due to some issue with Montage serialization visitors
    // "core/reel-document-headless-editing-spec",
    // "core/reel-document-listener-editing-spec",
    // "core/reel-document-proxy-serialization-spec",
    // "core/reel-document-saving-spec",
    // "core/reel-document-template-editing-spec",
]);
