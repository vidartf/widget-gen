

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
  widgets: IWidget[],
  [key: string]: any,
}


export
class TemplateWriter extends Writer {
  /**
   *
   */
  constructor(output: string, options?: Partial<TemplateWriter.IOptions>) {
    super(output);
    if (options && options.template) {
      this.templateFile = options.template;
    }
    if (options && options.fileExt) {
      this.fileExt = options.fileExt;
    }
  }

  static
  compileTemplate(templatePath: string) {
    return compile(fs.readFileSync(templatePath, {
      encoding: 'utf-8'
    }), NUNJUCKS_ENV);
  }

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
  filenameForWidget(widget: IWidget): string {
    if (this.fileExt) {
      return path.join(this.output, `${widget.name}.${this.fileExt}`);
    }
    return  path.join(this.output, widget.name);
  }

  get template(): Template {
    if (!this._template) {
      if (!this.templateFile) {
        throw new Error('No template file set!');
      }
      this._template = TemplateWriter.compileTemplate(this.templateFile);
    }
    return this._template;
  }

  modules: string[] = [];

  state: IWidget[] = [];

  templateFile?: string;

  fileExt?: string;

  protected _template?: Template;
}


export
namespace TemplateWriter {
    export
    interface IOptions {
        template: string;
        fileExt: string;
    }
}
