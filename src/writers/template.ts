

import * as fs from 'fs-extra';

import {
  compile
} from 'handlebars';

import {
  Writer
} from './base';

import {
  Parser
} from '../parsers';

import {
  IWidget
} from '../core';


export
type TemplateState = {
  widgets: IWidget[],
  [key: string]: any,
}


export
abstract class TemplateWriter extends Writer {
  /**
   *
   */
  constructor(output: string, options?: Partial<TemplateWriter.IOptions>) {
    super(output);
    if (options && options.template) {
      this.template = TemplateWriter.compileTemplate(options.template);
    }
  }

  static
  compileTemplate(templatePath: string) {
    return compile(fs.readFileSync(templatePath, {
      encoding: 'utf-8'
    }));
  }

  write(filename: string, widgets: IWidget[]): void {
    const data = this.transformState({widgets: widgets.slice()});
    if (!this.template) {
      throw new Error('Template not set!');
    }
    const output = this.template(data);
    fs.outputFileSync(filename, output);
  }

  transformState(data: TemplateState): TemplateState {
    return {
      ...data,
      outputMultiple: this.outputMultiple,
    };
  }

  onWidget(sender: Parser, data: IWidget): void {
    let {name} = data;
    data = {...data};

    if (this.outputMultiple) {
      this.modules.push(name);
      this.write(this.filenameForWidget(data), [data]);
      return;
    }
    this.state.push(data);
  }


  finalize(): Promise<void> {
    if (!this.outputMultiple) {
      return Promise.resolve().then(() => {
        return this.write(this.output, this.state);
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
  abstract filenameForWidget(widget: IWidget): string;

  modules: string[] = [];

  state: IWidget[] = [];

  template?: (data: TemplateState) => string;
}


export
namespace TemplateWriter {
    export
    interface IOptions {
        template: string;
    }
}
