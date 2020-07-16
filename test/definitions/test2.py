from ipywidgets import DOMWidget, Widget, widget_serialization
from traitlets import (
    Any,
    Bool,
    CFloat,
    Dict,
    Enum,
    Float,
    Instance,
    Int,
    List,
    Tuple,
    Undefined,
    Unicode,
    Union,
)


class A(Widget):
    _model_name = Unicode("A").tag(sync=True)
    _model_module = Unicode("test2").tag(sync=True)

    string = Unicode(None, allow_none=True, help="a string").tag(sync=True)
    boolean = Bool(True, help="a boolean value").tag(sync=True)
    list = List(Int(), [1, 2, 3], help="a list").tag(sync=True)
    tuple = Tuple(Int(), Unicode(), CFloat(), default_value=(3, "foo", 4.5), help="a tuple").tag(
        sync=True
    )
    dict = Dict(help="a dict").tag(sync=True)
    ddict = Dict(default_value={"foo": "bar"}, help="a dict").tag(sync=True)
    enum = Enum(("foo", "bar"), default_value="bar", help="an enum value").tag(sync=True)
    enum_none = Enum(("foo", "bar"), default_value=None, allow_none=True, help="an enum value").tag(sync=True)
    any = Any(42, help="any value").tag(sync=True)

    not_synced = Unicode(help="an unsynced value")

    union_defA = Union((Float(), Unicode()), default_value=None, allow_none=True, help="a union").tag(sync=True)
    union_defB = Union((Float(5.5), Unicode('4.3')), help="a union").tag(sync=True)

    union_enum = Union((
        Float(),
        Enum(("foo", "bar"), default_value=None, allow_none=True, help="a union enum")
    ), default_value=None, allow_none=True).tag(sync=True)



class B(A):
    _model_name = Unicode("B").tag(sync=True)

    ref = Instance(A, allow_none=True).tag(sync=True, **widget_serialization)


__all__ = ["A", "B"]
