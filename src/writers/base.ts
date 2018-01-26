
import {
  INamedWidget, Parser
} from '../core';


export
interface IWriterConstructor {
  new (directory: string): Writer;
}

export
abstract class Writer {
  constructor(directory: string) {
    this.directory = directory;
  }

  abstract onWidget(sender: Parser, args: INamedWidget): void;

  finalize(): void {
  };

  protected directory: string;
}

