
import {
  Parser
} from '../parsers';

import {
  IWidget
} from '../core';

import * as fs from 'fs-extra';


/**
 * Interface definition for constructor
 */
export
interface IWriterConstructor {
  /**
   * Create a code writer.
   *
   * @param output The output path to write to. Either an existing directory, or a file path
   */
  new (output: string): Writer;
}


/**
 * Base class for all code writers.
 *
 * Defines a common constructor signature, and slots/hooks that
 * will be called at the appropriate times during processing.
 */
export
abstract class Writer {
  /**
   * Create a code writer.
   *
   * @param output {string} The output path to write to. Either an existing directory, or a file path
   */
  constructor(output: string) {
    this.output = output;
    this.outputMultiple = fs.existsSync(output) && fs.statSync(output).isDirectory();
  }

  /**
   * Slot/hook to be called when processing a new widget.
   *
   * This should be extended in sub-classes to turn the definition
   * into a widget definition in its corresponding language.
   *
   * @abstract
   * @param {Parser} sender The parser producing the widget definition.
   * @param {IWidget} widget The widget definition
   * @memberof Writer
   */
  abstract onWidget(sender: Parser, widget: IWidget): void;

  /**
   * Slot/hook to be called when all widgets have been processed.
   *
   * The default implementation is a no-op.
   *
   * @memberof Writer
   */
  finalize(): void {
  };

  /**
   * The output path to be used by the writer
   */
  protected output: string;

  /**
   * Hint about whether the writer is expected to produce one file
   * per widget, or to put all widget definitions in one file.
   */
  protected outputMultiple: boolean;

  /**
   * Helper for single output processing, indicating whether the first
   * widget is being processed. Sub-classes should set this to false
   * after the first time onWidget is called.
   */
  protected firstWidget: boolean = true;
}

