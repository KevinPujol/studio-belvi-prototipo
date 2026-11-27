// Publishing status for the editors, shown as a small pill in the back office (bottom left).
// Reads GitHub's public API: the latest "Deploy" run on main, and the "check" result of open drafts (pull requests).
// Uses the editor's GitHub token from Sveltia when available (higher rate limit), otherwise anonymous requests.
(() => {
  const POLL_MS = 120000; // every 2 minutes, only while the tab is visible
  const pill = document.createElement('div');
  pill.setAttribute('role', 'status');
  pill.setAttribute('aria-live', 'polite');
  pill.style.cssText = [
    'position:fixed', 'left:12px', 'bottom:12px', 'z-index:2147483000', 'max-width:min(420px,calc(100vw - 24px))',
    'padding:8px 14px', 'border-radius:999px', 'font:500 13px/1.35 system-ui,-apple-system,Segoe UI,sans-serif',
    'box-shadow:0 6px 20px rgba(0,0,0,.15)', 'display:none', 'cursor:default',
  ].join(';');
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(pill));

  const STYLE = {
    ok: 'background:#e8f3ea;color:#1d4d2b',
    busy: 'background:#fff4d6;color:#5c4400',
    error: 'background:#fbe3e3;color:#7a1515',
  };
  function show(kind, text) {
    pill.style.cssText = pill.style.cssText.replace(/background:[^;]+;color:[^;]+/, '') + ';' + STYLE[kind];
    pill.textContent = text;
    pill.style.display = 'block';
  }

  const ago = (iso) => {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
  };

  function token() {
    try {
      for (const k of Object.keys(localStorage)) {
        if (!k.startsWith('sveltia-cms')) continue;
        const v = JSON.parse(localStorage.getItem(k) || 'null');
        if (v && typeof v === 'object' && typeof v.token === 'string') return v.token;
      }
    } catch (e) {}
    return null;
  }
  async function gh(path) {
    const headers = { Accept: 'application/vnd.github+json' };
    const t = token();
    if (t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch(`https://api.github.com${path}`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  let repo = null;
  async function getRepo() {
    if (repo) return repo;
    const cfg = await (await fetch('config.yml', { cache: 'no-store' })).text();
    const m = cfg.match(/^\s+repo:\s*([\w.-]+\/[\w.-]+)\s*$/m);
    repo = m ? m[1] : null;
    return repo;
  }

  async function refresh() {
    if (document.hidden) return;
    try {
      const r = await getRepo();
      if (!r) return;
      // 1. Latest publication (Deploy workflow on main)
      const runs = await gh(`/repos/${r}/actions/workflows/deploy.yml/runs?branch=main&per_page=1`);
      const run = runs.workflow_runs && runs.workflow_runs[0];
      // 2. Drafts whose check failed (they can't be published until fixed)
      let badDrafts = 0;
      try {
        const pulls = await gh(`/repos/${r}/pulls?state=open&per_page=20`);
        for (const p of pulls.filter((p) => (p.head.ref || '').startsWith('cms/'))) {
          const checks = await gh(`/repos/${r}/commits/${p.head.sha}/check-runs?per_page=20`);
          if ((checks.check_runs || []).some((c) => c.conclusion === 'failure')) badDrafts++;
        }
      } catch (e) {}

      if (run && run.status !== 'completed') return show('busy', 'Publicando cambios… La web se actualiza en 1 o 2 minutos.');
      if (run && run.conclusion === 'failure') return show('error', 'La última publicación ha fallado. La web sigue con la versión anterior. Avisa a Kevin.');
      if (badDrafts) return show('error', badDrafts === 1
        ? 'Hay un borrador con errores (por ejemplo, un precio sin importe). Revísalo antes de publicarlo.'
        : `Hay ${badDrafts} borradores con errores (por ejemplo, un precio sin importe). Revísalos antes de publicarlos.`);
      if (run) return show('ok', `Web al día · última publicación ${ago(run.updated_at)}`);
    } catch (e) {
      // Network or rate limit: keep the last state, try again later.
    }
  }

  refresh();
  setInterval(refresh, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
