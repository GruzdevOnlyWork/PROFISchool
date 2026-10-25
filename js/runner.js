const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

const HARNESS_PY = `
import sys, io, json, traceback

def __run(code, stdin):
    out = io.StringIO()
    old_in, old_out = sys.stdin, sys.stdout
    sys.stdin = io.StringIO(stdin)
    sys.stdout = out
    error = ''
    try:
        exec(compile(code, '<код>', 'exec'), {'__name__': '__main__'})
    except SystemExit:
        pass
    except SyntaxError as e:
        error = f'Строка {e.lineno}: {type(e).__name__}: {e.msg}'
    except BaseException as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == '<код>']
        where = f'Строка {frames[-1].lineno}: ' if frames else ''
        error = f'{where}{type(e).__name__}: {e}'
    finally:
        sys.stdin, sys.stdout = old_in, old_out
    return json.dumps({'stdout': out.getvalue(), 'error': error}, ensure_ascii=False)
`;

const WORKER_SRC = `
importScripts('${PYODIDE_URL}pyodide.js');
let py = null;
(async () => {
  try {
    py = await loadPyodide({ indexURL: '${PYODIDE_URL}' });
    py.runPython(${JSON.stringify(HARNESS_PY)});
    self.postMessage({ type: 'ready' });
  } catch (e) {
    self.postMessage({ type: 'fatal', error: String(e) });
  }
})();
self.onmessage = (e) => {
  const { id, code, input } = e.data;
  try {
    const run = py.globals.get('__run');
    const res = JSON.parse(run(code, input));
    run.destroy();
    self.postMessage({ type: 'result', id, stdout: res.stdout, error: res.error });
  } catch (err) {
    self.postMessage({ type: 'result', id, stdout: '', error: String(err) });
  }
};
`;

class PyRunner {
  constructor(onStatus) {
    this.onStatus = onStatus;
    this.seq = 0;
    this.workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'application/javascript' }));
    this._spawn();
  }

  _spawn() {
    this.onStatus('loading');
    this.pending = null;
    this.ready = new Promise((resolve, reject) => {
      this.worker = new Worker(this.workerUrl);
      this.worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'ready') {
          this.onStatus('ready');
          resolve();
        } else if (m.type === 'fatal') {
          this.onStatus('error');
          reject(new Error(m.error));
        } else if (m.type === 'result' && this.pending && this.pending.id === m.id) {
          const p = this.pending;
          this.pending = null;
          clearTimeout(p.timer);
          p.resolve({ stdout: m.stdout, error: m.error, timeout: false });
        }
      };
      this.worker.onerror = (e) => {
        this.onStatus('error');
        reject(new Error(e.message || 'Не удалось запустить Python'));
      };
    });
  }

  async run(code, input, timeoutMs = 4000) {
    await this.ready;
    const id = ++this.seq;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending = null;
        this.worker.terminate();
        this._spawn();
        resolve({ stdout: '', error: '', timeout: true });
      }, timeoutMs);
      this.pending = { id, resolve, timer };
      this.worker.postMessage({ id, code, input });
    });
  }
}
