import { Signal, ISignal } from '@lumino/signaling';

import { IWidget, getWidgetRefs, Attributes } from '../core';

import { MSet } from '../setMethods';

export interface IParserConstructor {
  new (filename: string): Parser;
}

/**
 * The base parser class.
 *
 * A parser is something that generates widget definitions.
 * The pattern of use is as follows:
 *  - Instantiate the parser with a filename.
 *  - Connect consumers of widget definitions to the newWidget
 *    signal.
 *  - Call the start() method. Its promise will resolve once
 *    a signal has been emitted for all found widgets. Note
 *    that this does not entail that all consumers have finished
 *    processing *if they perform async processing*.
 */
export abstract class Parser {
  /**
   * Initialize the parser.
   *
   * @param input String input to the parser, typically a filename
   */
  constructor(protected input: string) {}

  /**
   * Start generating widget definitions.
   *
   * @returns {Promise<void>} A promise that will resolve once a
   *    signal has been emitted for all found widgets. Note
   *    that this does not entail that all consumers have finished
   *    processing *if they perform async processing*.
   */
  abstract start(): Promise<void>;

  /**
   * Find the names of all other *internal* widgets referenced by the
   * passed definition. Internal here means another widget that has/will
   * be parser by the parser. It should be valid to call before the
   * first time a newWidget signal is emitted.
   *
   * @param {IWidget} data The widget definition to inspect
   * @returns {MSet<string>} A set of widget names referenced
   */
  resolveInternalRefs(
    properties: Attributes.Properties | undefined
  ): MSet<string> {
    if (!properties) {
      return new MSet();
    }
    let refs: MSet<string> = new MSet();
    for (let propName of Object.keys(properties)) {
      let prop = properties[propName];
      refs = refs.union(getWidgetRefs(prop));
    }
    return this.widgetNames.intersection(refs);
  }

  /**
   * Signal emitted by parser when it finds a new widget definition.
   *
   * @readonly
   * @type {ISignal<this, IWidget>}
   */
  get newWidget(): ISignal<this, IWidget> {
    return this._newWidget;
  }

  /**
   * A set of all widget names this parser finds.
   *
   * Note: This should be set (completed) before the
   * first time a newWidget signal is emitted!
   *
   * @type {MSet<string>}
   */
  abstract readonly widgetNames: MSet<string>;

  protected _newWidget = new Signal<this, IWidget>(this);
}
