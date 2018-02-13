# widget-gen

This is a utility library for auto-generating jupyter widget definitions
based on the synchronization state. Any bussiness logic will have to be
added on top, but this utility can help with:

- Bootstrapping development
- Keeping the different sides (kernels + frontend) in sync

The last point is best accomplished by using the auto-generated definitions
as base classes for the classes that actually add the business logic.

Currently it speaks the following languages:

- Python
- ES5 Javascript
- ES6 Javascript
- Typescript

It can read (parse) the widget definitions from:

- A custom JSON schema-like format
- Python widgets based on ipywidgets
