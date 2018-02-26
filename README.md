# widget-gen


[![Npm version](https://img.shields.io/npm/v/widget-gen.svg)](https://www.npmjs.com/package/widget-gen)
[![Travis build status](https://travis-ci.org/vidartf/widget-gen.svg?branch=master)](https://travis-ci.org/vidartf/widget-gen)
[![codecov](https://codecov.io/gh/vidartf/widget-gen/branch/master/graph/badge.svg)](https://codecov.io/gh/vidartf/widget-gen)


This is a utility library for auto-generating jupyter widget definitions
based on the synchronization state. Any bussiness logic will have to be
added on top, but this utility can help with:

- Bootstrapping development
- Keeping the different sides (kernels + frontend) in sync

The last point is best accomplished by using the auto-generated definitions
as base classes for the classes that actually add the business logic.

It can read (parse) widget definitions from:

- A custom JSON schema-like format
- Python widgets based on ipywidgets

And then output corresponding code in the following languages:

- Python
- ES5 Javascript
- ES6 Javascript
- Typescript


## Installation

```bash
npm install [-g] widget-gen
```

## Usage

```bash
> widgetgen --help
  Usage: main [options] <file> [languages...]

  Options:

    -V, --version                output the version number
    -p, --parser [parser]        The name of the parser to use, either "json" or "python".
    -o, --outputdir [outputdir]  The output directory.
    -t, --template [template]    a template file to use.
    -e, --extension [extension]  The file extension to use for the output.
    -h, --help                   output usage information
```


## Extending language support

To add support for other output languages, you need to add another Writer class. You can either
do this by inherting the base `Writer` class, having full control of the process, or you can
inherit the `TemplateWriter` class that will use [Nunjucks templates](https://mozilla.github.io/nunjucks/templating.html) for creating output.
