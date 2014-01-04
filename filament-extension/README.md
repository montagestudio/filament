Filament Extensions
===================

A Filament Extension adds or modifies features of the Filament application
using APIs that readily accommodate such alterations.

Each extension is a valid npm package directory and is recognized by Filament
by its file extension, "filament-extension"

At a minimum an extension should implement valid `activate` and `deactivate`
methods, typically as inverses of each other, that are called on demand
by Filament with several portions of the Filament system provided as arguments.

In the future, the arguments received upon activation may be intentionally limited
in the capabilities they expose to these extensions.

Directory Layout
================

- extension.js
- package.json
- assets
    - object-icons
- library-items
