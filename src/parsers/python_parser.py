
import argparse
import inspect
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
        args = sys.argv[1:]
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
        if inspect.isclass(candidate) and issubclass(candidate, Widget):
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
        definition['inherits'] = [base.__name__ for base in cls.__bases__]

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


def get_trait_default(trait):
    if isinstance(trait, (traitlets.List, traitlets.Tuple)):
        return trait.make_dynamic_default()
    else:
        return trait.default_value


def convertTrait(trait):
    definition = {}
    if trait.allow_none is not traitlets.Undefined:
        definition['allowNull'] = trait.allow_none
    if trait.help not in (traitlets.Undefined, '', None):
        definition['help'] = trait.help

    default = get_trait_default(trait)
    if default is not trait.__class__.default_value:
        if isinstance(trait, DataUnion):
            # TODO: Extract shape and dtype constraints, and convert default value to list
            pass
        elif not isinstance(trait, traitlets.Union):
            definition['default'] = default

    for tt, type_name in trait_to_type.items():
        if isinstance(trait, tt):
            definition['type'] = type_name
            if type_name == 'array':
                subtraits = getattr(trait, '_traits', None)
                subtrait = getattr(trait, '_trait', None)
                if subtraits not in (None, traitlets.Undefined):
                    definition['items'] = [convertTrait(subtt) for subtt in subtraits]
                elif subtrait:
                    definition['items'] = convertTrait(subtrait)
            if type_name == 'widgetRef':
                if inspect.isclass(trait.klass):
                    definition['widgetType'] = trait.klass.__name__
                else:
                    definition['widgetType'] = trait.klass
            break
    else:
        if isinstance(trait, traitlets.Union):
            definition['oneOf'] = [convertTrait(subtt) for subtt in trait.trait_types]

    return definition

if __name__ == '__main__':
    sys.exit(main())
