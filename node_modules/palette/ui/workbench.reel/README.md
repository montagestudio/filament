Workbench
=========
While a perfectly reasonable editor could be built with the EditingFrame alone,
the Workbench provides a layer above the EditingFrame itself to render contextual
editing tools, guides, etc.

The workbench forwards most of its useful API to its internal EditingFrame,
giving users the choice of either using a Workbench or an EditingFrame almost
interchangeably.

Loading a Component
-------------------
```javascript
var module = "http://localhost/my-app/ui/my-component.reel";
editingFrame.loadTemplate(module)
aRequire.async("http://localhost/my-app/ui/my-component.reel").then(function (component) {
    return component.MyComponent._loadTemplate();
}).then(function (template) {
    return workbench.loadTemplate(template, module);
});
```

The ```loadTemplate``` method promises to resolve an EditingDocument.
