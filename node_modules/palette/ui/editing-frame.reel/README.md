EditingFrame
============

The EditingFrame is the lowest level component that an editor should need to interact with.

By default, and perhaps permanently, the EditingFrame content is shielded from direct user input.
While preventing direct interaction with the content within the EditingFrame does expose
the ```selectedObjects```. Only single selection is currently enabled.

Loading a Component
-------------------
 ```javascript
 editingFrame.load("http://localhost/my-app/ui/my-component.reel")
 ```

 The ```load``` method promises to resolve an EditingDocument.