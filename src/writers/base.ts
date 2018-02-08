
import {
  INamedWidget, Parser
} from '../core';

import * as fs from 'fs-extra';

export
interface IWriterConstructor {
  new (output: string): Writer;
}

export
abstract class Writer {
  constructor(output: string) {
    this.output = output;
    this.outputMultiple = fs.statSync(output).isDirectory();
    this.firstOutput = true;
  }

  abstract onWidget(sender: Parser, args: INamedWidget): void;

  finalize(): void {
  };

  protected output: string;
  protected outputMultiple: boolean;
  protected firstOutput: boolean;
}

