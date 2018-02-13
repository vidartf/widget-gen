
import argparse
import importlib
import importlib.util
import json
import sys

from ipywidgets import Widget
from ipydatawidgets import NDArray, DataUnion
import traitlets


def _build_arg_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument('filename')
    return parser


def main(args=None):
    if args is None:
        args = sys.argv
    arguments = _build_arg_parser().parse_args(args)
    definition = convert(arguments.filename)
    json.dump(definition, sys.stdout, indent=2)
    return 0


def find_widgets(filename=None, module_name=None, package=None):
    if filename is not None:
        spec = importlib.util.spec_from_file_location(module_name or '_widget_gen_import', filename)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    elif module_name is not None:
        mod = importlib.import_module(module_name, package=package)
    else:
        raise ValueError('Either filename or module_name need to be passed!')

    try:
        candidates = mod.__all__
    except AttributeError:
        candidates = dir(mod)

    for candidate_name in candidates:
        candidate = getattr(mod, candidate_name)
        if issubclass(candidate, Widget):
            yield (candidate_name, candidate)


def convert_module(module_name, package=None):
    """Convert widget definitions to JSON-able object"""
    widget_definitions = {}

    for (name, cls) in find_widgets(module_name=module_name, package=package):
        widget_definitions[name] = convertWidget(name, cls)

    return dict(widgets=widget_definitions)


def convert(filename):
    """Convert widget definitions to JSON-able object"""
    widget_definitions = {}

    for (name, cls) in find_widgets(filename=filename):
        widget_definitions[name] = convertWidget(name, cls)

    return dict(widgets=widget_definitions)


def convertWidget(name, cls):
    definition = {}

    if cls.__init__.__doc__:
        definition['help'] = cls.__init__.__doc__
    elif cls.__doc__:
        definition['help'] = cls.__doc__

    if cls.__bases__:
        definition['inherits'] = cls.__bases__

    properties = {}
    for name, trait in cls.class_own_traits(sync=True).items():
        properties[name] = convertTrait(trait)
    if properties:
        definition['properties'] = properties

    return definition


trait_to_type = {
    traitlets.Unicode: 'string',
    traitlets.Bool: 'boolean',
    traitlets.Int: 'int',
    traitlets.Float: 'float',
    traitlets.List: 'array',
    traitlets.Tuple: 'array',
    traitlets.Dict: 'object',
    traitlets.Instance: 'widgetRef',
    NDArray: 'ndarray',
    DataUnion: 'dataunion',
}


def convertTrait(trait):
    definition = {}
    if trait.allow_none is not trait.Undefined:
        definition['allowNull'] = trait.allow_none
    if trait.help not in (trait.Undefined, '', None):
        definition['help'] = trait.help

    if trait.default_value is not traitlets.Undefined:
        if isinstance(trait, DataUnion):
            # TODO: Extract shape and dtype constraints, and convert default value to list
            pass
        elif not isinstance(trait, traitlets.Union):
            definition['default'] = trait.default_value

    for tt, type_name in trait_to_type.items():
        if isinstance(trait, tt):
            definition['type'] = type_name
        elif isinstance(trait, traitlets.Union):
            definition['oneOf'] = [convertTrait(subtt) for subtt in trait.trait_types]

    return definition

if __name__ == '__main__':
    sys.exit(main())
