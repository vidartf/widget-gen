

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  compile, Template, configure
} from 'nunjucks';

import {
  Writer
} from './base';

import {
  Parser
} from '../parsers';

import {
  IWidget
} from '../core';


const NUNJUCKS_ENV = configure(path.resolve(__dirname, '../../templates'), {
  autoescape: false,
  throwOnUndefined: true,
  trimBlocks: true,
  lstripBlocks: true,
})


export
type TemplateState = {
  widgets: ReadonlyArray<IWidget>,
  [key: string]: any,
}


/**
 * Base class for template based writers.
 *
 * Typical extension points when subclassing:
 * - Constructor: Pass in template and file extension for saving in options.
 * - transformState: Add any extra data needed to the state passed to the
 *   template engine.
 * - finalize: Add any finalization steps needed, e.g. writing an index file.
 *
 * @export
 * @class TemplateWriter
 * @extends {Writer}
 */
export
class TemplateWriter extends Writer {
  /**
   *
   */
  constructor(output: string, options: TemplateWriter.IOptions) {
    super(output, options);
    this.templateFile = options.template;
    this.fileExt = options.fileExt;
  }

  /**
   * Write out a sequence of widget definitions to disk.
   *
   * @param filename The filename to save to.
   * @param widgets The widget definitions to write.
   */
  write(filename: string, widgets: IWidget[]): void {
    const data = this.transformState({
      widgets: widgets.slice(),
    });
    if (!this.template) {
      throw new Error('Template not set!');
    }
    const output = this.template.render(data);
    fs.outputFileSync(filename, output);
  }

  /**
   * Hook that allows for modifying the state passed to the template engine.
   *
   * When overriding, take care not to modify the object in-place, as this
   * might affect the state of other writers. Instead create a copy with
   * the needed changes, and return that.
   *
   * @param data The current state that will be sent to the template engine.
   * @returns The modified state.
   */
  transformState(data: TemplateState): TemplateState {
    return {
      ...data,
      modules: this._modules,
      outputMultiple: this.outputMultiple,
    };
  }

  /**
   * The handler of widget data.
   *
   * Subclasses should normally not need to override this.
   *
   * @param {Parser} sender The parser producing the widget definition.
   * @param {IWidget} widget The widget definition
   */
  onWidget(sender: Parser, data: IWidget): void {
    let {name} = data;
    data = {...data};

    if (this.outputMultiple) {
      this._modules.push(name);
      this.write(this.filenameForWidget(data), [data]);
      return;
    }
    this._state.push(data);
  }

  /**
   * Called when the parser has finished processing all widgets.
   */
  finalize(): Promise<void> {
    if (!this.outputMultiple) {
      return Promise.resolve().then(() => {
        return this.write(this.output, this._state);
      });
    }
    return Promise.resolve();
  }

  /**
   * If outputting multiple widgets, this function will
   * be called to determine the filename to use for a
   * given widget definition. The implementer is resonsible
   * for taking `this.output` into account.
   *
   * @param widget The widget definition that will be saved
   */
  filenameForWidget(widget: IWidget): string {
    if (this.fileExt) {
      return path.join(this.output, `${widget.name}.${this.fileExt}`);
    }
    return path.join(this.output, widget.name);
  }

  /**
   * Get the compiled template to use to render the widget data.
   *
   * @readonly
   * @type {Template}
   */
  get template(): Template {
    if (!this._template) {
      if (!this.templateFile) {
        throw new Error('No template file set!');
      }
      this._template = TemplateWriter.compileTemplate(this.templateFile);
    }
    return this._template;
  }

  get modules(): ReadonlyArray<string> {
    return this._modules;
  }

  /**
   * The file to use as a template.
   *
   * This needs to be set before the first call to `write()`,
   * at which point it will be used to populate `template`.
   *
   * @protected
   * @type {string}
   */
  protected templateFile?: string;

  /**
   * The file extension to use for the output files.
   *
   * @protected
   * @type {string}
   */
  protected fileExt?: string;

  /**
   * The internal store used by `template` property
   *
   * @protected
   * @type {Template}
   */
  protected _template?: Template;

  /**
   * If writing several files, this will contain the widget names
   * that define each module.
   */
  private _modules: string[] = [];

  /**
   * Internal working store of the widget state collected.
   */
  private _state: IWidget[] = [];
}


export
namespace TemplateWriter {
  export
  interface IOptions extends Writer.IOptions {
      template: string;
      fileExt: string;
  }

  /**
   * Utility function for reading and compiling a template from file.
   *
   * @param templatePath The path to the template file.
   */
  export
  function compileTemplate(templatePath: string) {
    return compile(fs.readFileSync(templatePath, {
      encoding: 'utf-8'
    }), NUNJUCKS_ENV);
  }
}
