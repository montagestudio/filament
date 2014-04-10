EditingFrame
============

The EditingFrame is the lowest level component that an editor should need to interact with.

By default, and perhaps permanently, the EditingFrame content is shielded from direct user input.
While preventing direct interaction with the content within the EditingFrame does expose
the ```selectedObjects```. Only single selection is currently enabled.

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
