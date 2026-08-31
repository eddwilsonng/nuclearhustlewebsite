import * as path from 'path';

/** True when this file was the tsx/node entrypoint (not imported by another script). */
export function invokedAsScript(filename: string): boolean {
  return process.argv.some((arg) => path.basename(arg) === filename);
}
