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
workbench.load("http://localhost/my-app/ui/my-component.reel")
```

The ```load``` method promises to resolve an EditingDocument.