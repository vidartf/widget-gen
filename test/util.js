const path = require('path');

const fs = require('fs-extra');

const os = require('os');

const spawnSync = require('child_process').spawnSync;

function mkdtemp(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/**
 * Test that modules can be imported, and widgets instantiated
 */
function instantiatePythonWidgets(outdir) {
  const cmd = [
    `MODULE_PATH = ${JSON.stringify(path.join(outdir, '__init__.py'))}`,
    `MODULE_NAME = 'module_under_test'`,
    `import importlib`,
    `import sys`,
    `spec = importlib.util.spec_from_file_location(MODULE_NAME, MODULE_PATH)`,
    `module = importlib.util.module_from_spec(spec)`,
    `sys.modules[spec.name] = module`,
    `spec.loader.exec_module(module)`,
    `for w in dir(module):`,
    `    if not w.startswith('_'):`,
    `        getattr(module, w)()`,
  ];
  const res = spawnSync('python', ['-c', cmd.join('\n')], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(res.stdout.toString() + res.stderr.toString());
  }
}

module.exports = {
  mkdtemp: mkdtemp,
  instantiatePythonWidgets: instantiatePythonWidgets,
};
