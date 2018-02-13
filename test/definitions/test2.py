
from ipywidgets import Widget, DOMWidget, widget_serialization

from traitlets import Unicode, Instance, Union, List, Tuple, Dict, Int, CFloat, Bool, Undefined


class A(Widget):
    _model_name = Unicode('A').tag(sync=True)
    _model_module = 'test2'

    string = Unicode(None, allow_none=True).tag(sync=True)
    boolean = Bool(True).tag(sync=True)
    list = List(Int(), [1,2,3]).tag(sync=True)
    tuple = Tuple((Int(), Unicode(), CFloat()), default_value=(3, 'foo', '4.5')).tag(sync=True)
    dict = Dict().tag(sync=True)

    not_synced = Unicode()


class B(A):
    _model_name = Unicode('B').tag(sync=True)

    ref = Instance(A).tag(sync=True)


__all__ = ['A', 'B']
