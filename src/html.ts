// Single-file HTML frontend for LoxeAI Pilot v2.
// Dark, monospace-accented, clinical. Sections: Home, Connect, Scan, Results,
// Report (locked behind blurred paywall), Gideon side panel.

export const FRONTEND_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>LoxeAI — SOC 2 Evidence Tracer (Pilot)</title>
<meta name="description" content="Audit-grade SOC 2 readiness in minutes. Read-only AWS scan, 12 controls analyzed, $29.99 report." />
<style>
:root {
  --bg: #07090c; --panel: #0e1218; --panel-2: #131922; --panel-3: #1b2331;
  --border: #1f2937; --border-hi: #2a3447;
  --text: #e6edf3; --muted: #8b96a3; --dim: #5b6776;
  --accent: #5eead4; --accent-2: #38bdf8; --accent-3: #c4b5fd;
  --warn: #f59e0b; --bad: #ef4444; --good: #22c55e; --partial: #eab308; --crit: #b91c1c;
  --mono: "JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace;
}
* { box-sizing: border-box; }
html, body { margin:0; padding:0; background: var(--bg); color: var(--text); font: 14.5px/1.55 -apple-system,"SF Pro Text","Inter",system-ui,sans-serif; -webkit-font-smoothing: antialiased; }
a { color: var(--accent-2); text-decoration: none; } a:hover { text-decoration: underline; }
.container { max-width: 1180px; margin: 0 auto; padding: 0 28px; }
header.nav { display:flex; align-items:center; justify-content:space-between; padding: 14px 28px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: rgba(7,9,12,0.85); backdrop-filter: blur(12px); z-index: 50; }
.brand { display:flex; align-items:center; gap:10px; font-weight: 700; letter-spacing: -.01em; }
.brand .dot { width:10px; height:10px; border-radius:2px; background: linear-gradient(135deg,var(--accent),var(--accent-2)); box-shadow: 0 0 18px var(--accent); }
.brand .sub { color: var(--muted); font-weight: 400; font-family: var(--mono); font-size: 12px; }
.meter { display:flex; align-items:center; gap:8px; font-family: var(--mono); font-size: 12px; color: var(--muted); }
.meter .dotsmall { width:6px; height:6px; border-radius:50%; background: var(--good); box-shadow: 0 0 8px var(--good); }
h1 { font: 600 56px/1.05 "SF Pro Display","Inter",sans-serif; letter-spacing: -.025em; margin: 0 0 14px; }
h1 em { color: var(--accent); font-style: normal; font-weight: 600; }
h2 { font: 600 24px/1.2 "SF Pro Display","Inter",sans-serif; letter-spacing: -.01em; margin: 36px 0 14px; }
h3 { font: 600 16px/1.3 "Inter",sans-serif; margin: 14px 0 6px; }
p.lede { color: var(--muted); font-size: 17.5px; max-width: 720px; margin: 0 0 22px; }
.eyebrow { display:inline-block; font: 600 11px/1 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--accent); padding: 6px 10px; border: 1px solid rgba(94,234,212,.25); border-radius: 999px; background: rgba(94,234,212,.06); margin-bottom: 16px; }

.grid { display: grid; gap: 14px; }
.grid-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
.grid-2 { grid-template-columns: 1.4fr 1fr; }
@media (max-width: 820px) { .grid-3, .grid-2 { grid-template-columns: 1fr; } }

.card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
.card.subtle { background: var(--panel-2); }
.card.tight { padding: 14px; }
.card h3 { margin-top: 0; }

.btn { display:inline-flex; align-items:center; gap:8px; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--panel-2); color: var(--text); font-weight: 600; cursor: pointer; font-size: 14px; font-family: inherit; transition: border-color .15s ease, background .15s ease; }
.btn:hover { border-color: var(--accent); }
.btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #07090c; border: 0; }
.btn.primary:hover { filter: brightness(1.08); }
.btn.ghost { background: transparent; }
.btn.sm { padding: 6px 10px; font-size: 12px; }
.input, textarea, select { width: 100%; padding: 11px 13px; border-radius: 8px; border: 1px solid var(--border); background: #0a0e13; color: var(--text); font: inherit; font-family: var(--mono); }
.input:focus, textarea:focus, select:focus { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; }
label { font-size: 12px; color: var(--muted); display:block; margin-bottom: 6px; font-family: var(--mono); text-transform: uppercase; letter-spacing: .08em; }
code, .mono { font-family: var(--mono); font-size: 12.5px; }
pre { background: #0a0e13; padding: 12px; border-radius: 8px; border: 1px solid var(--border); overflow:auto; font-size: 12px; font-family: var(--mono); }

.pill { display:inline-block; padding: 2px 9px; border-radius: 999px; font: 700 10.5px/1.6 var(--mono); letter-spacing: .06em; text-transform: uppercase; border: 1px solid var(--border); }
.pill.pass { color: var(--good); border-color: rgba(34,197,94,.3); background: rgba(34,197,94,.08); }
.pill.fail { color: var(--bad); border-color: rgba(239,68,68,.3); background: rgba(239,68,68,.08); }
.pill.partial { color: var(--partial); border-color: rgba(234,179,8,.3); background: rgba(234,179,8,.08); }
.pill.inconclusive { color: var(--muted); }
.pill.crit { color: #fff; background: var(--crit); border-color: var(--crit); }
.pill.high { color: #fff; background: #dc2626; border-color: #dc2626; }
.pill.med { color: #07090c; background: var(--warn); border-color: var(--warn); }
.pill.low { color: var(--muted); }

.progressbar { height: 6px; background: var(--panel-2); border-radius: 999px; overflow: hidden; }
.progressbar > span { display:block; height:100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); transition: width .4s ease; }

.ctrl-row { display:flex; align-items:center; justify-content:space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; background: var(--panel-2); cursor: pointer; transition: border-color .15s ease; }
.ctrl-row:hover { border-color: var(--border-hi); }
.ctrl-row.open { border-color: var(--accent); }
.ctrl-row .id { font-weight: 700; font-family: var(--mono); }
.ctrl-row .name { color: var(--muted); margin-left: 6px; font-size: 13px; }
.ctrl-row .summary { color: var(--muted); font-size: 13px; margin-top: 4px; }
.ctrl-row .scoreblock { display:flex; align-items:center; gap: 10px; flex-shrink: 0; }
.ctrl-row .score { font-family: var(--mono); font-weight: 700; font-size: 16px; min-width: 48px; text-align: right; }
.ctrl-row .barwrap { width: 80px; height: 4px; background: var(--panel-3); border-radius: 999px; overflow: hidden; }
.ctrl-row .barwrap > span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); }

.ctrl-detail { padding: 14px 18px; margin: -4px 0 12px; border: 1px solid var(--accent); border-top: 0; border-radius: 0 0 10px 10px; background: var(--panel); }

.finding { border: 1px solid var(--border); border-left: 3px solid var(--border-hi); border-radius: 0 8px 8px 0; padding: 10px 14px; margin: 8px 0; background: var(--panel-2); }
.finding.CRITICAL, .finding.HIGH { border-left-color: var(--bad); background: rgba(239,68,68,.06); }
.finding.MEDIUM { border-left-color: var(--warn); background: rgba(245,158,11,.05); }
.finding .head { display:flex; align-items:center; gap:8px; }
.finding .check { width:18px; height:18px; border-radius:4px; border:1px solid var(--border-hi); cursor:pointer; flex-shrink:0; appearance:none; }
.finding .check:checked { background: var(--good); border-color: var(--good); }
.finding.resolved { opacity: .55; }
.finding.resolved .title { text-decoration: line-through; }
.finding .title { font-weight: 600; }
.finding .desc { color: var(--muted); margin: 6px 0; font-size: 13.5px; }
.finding .cli { background: #050709; border:1px solid var(--border); padding: 9px 12px; border-radius: 6px; font: 12px/1.4 var(--mono); color: var(--accent); overflow-x:auto; }
.finding .editbar { margin-top: 8px; display:flex; gap:6px; align-items:center; }
.edited-badge { display:inline-block; background: rgba(245,158,11,.12); color: var(--warn); border: 1px solid rgba(245,158,11,.3); padding: 1px 7px; font: 600 10px/1.5 var(--mono); border-radius: 4px; }

/* Paywall */
.paywall-wrap { position: relative; margin-top: 18px; border-radius: 14px; overflow: hidden; border: 1px solid var(--border); }
.paywall-blur { filter: blur(8px); pointer-events: none; user-select: none; padding: 26px; background: var(--panel); }
.paywall-blur .ctrl-row { background: var(--panel-2); }
.paywall-overlay { position: absolute; inset: 0; display:flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 28px; text-align: center; background: linear-gradient(180deg, rgba(7,9,12,.55) 0%, rgba(7,9,12,.92) 60%); }
.paywall-overlay h2 { margin: 0 0 8px; font-size: 28px; }
.paywall-overlay .price { font: 800 42px/1 "SF Pro Display",sans-serif; letter-spacing: -.02em; margin: 14px 0 4px; }
.paywall-overlay .price small { font: 500 14px/1 "Inter",sans-serif; color: var(--muted); margin-left: 8px; }
.paywall-overlay ul { list-style: none; padding: 0; margin: 18px auto 22px; max-width: 460px; text-align: left; }
.paywall-overlay ul li { padding: 6px 0 6px 28px; position: relative; color: var(--text); font-size: 14.5px; }
.paywall-overlay ul li::before { content: "✓"; position: absolute; left: 0; top: 6px; color: var(--accent); font-weight: 800; }
.paywall-overlay .cta { padding: 14px 28px; font-size: 16px; font-weight: 700; }
.paywall-overlay .footnote { color: var(--muted); font-size: 12px; margin-top: 14px; font-family: var(--mono); }

/* Step list (how it works) */
.steps { display:flex; flex-direction: column; gap: 0; }
.step { display: grid; grid-template-columns: 36px 1fr; gap: 14px; padding: 12px 0; }
.step .num { width: 32px; height: 32px; border-radius: 8px; background: var(--panel-2); border: 1px solid var(--border); display:grid; place-items:center; font-family: var(--mono); font-weight: 700; }

/* Gideon panel */
.gideon { position: fixed; bottom: 22px; right: 22px; width: 380px; max-height: 78vh; display:flex; flex-direction: column; background: var(--panel); border: 1px solid var(--border-hi); border-radius: 14px; box-shadow: 0 24px 64px rgba(0,0,0,.55), 0 0 0 1px rgba(94,234,212,.08); z-index: 80; overflow: hidden; }
.gideon header { padding: 12px 16px; border-bottom: 1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.gideon header .who { display:flex; align-items:center; gap: 8px; }
.gideon header .who .ring { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.gideon header .who strong { font-weight: 700; }
.gideon header .who small { color: var(--muted); font-family: var(--mono); font-size: 11px; margin-left: 6px; }
.gideon .body { flex: 1; overflow-y: auto; padding: 14px 16px; font-size: 14px; }
.gideon .sugg { background: var(--panel-2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
.gideon .sugg .label { font: 600 11px/1.4 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
.gideon .sugg .body-text { color: var(--text); font-size: 13.5px; }
.gideon .msg { margin: 8px 0; }
.gideon .msg.user { color: var(--accent); }
.gideon .msg.bot { color: var(--text); white-space: pre-wrap; }
.gideon footer { padding: 10px; border-top: 1px solid var(--border); display:flex; gap: 8px; }
.gideon-btn { position: fixed; bottom: 22px; right: 22px; z-index: 70; padding: 12px 18px; border-radius: 999px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #07090c; border: 0; font-weight: 700; cursor: pointer; box-shadow: 0 12px 36px rgba(94,234,212,.3); }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--panel); border: 1px solid var(--border-hi); padding: 10px 16px; border-radius: 10px; box-shadow: 0 12px 36px rgba(0,0,0,.5); z-index: 100; }
.toast.error { border-color: var(--bad); color: var(--bad); }
.hidden { display: none !important; }

/* ===== MARKETING NAV ===== */
.m-nav-links { display:flex; align-items:center; gap:20px; }
.m-nav-links a { font-family:var(--font-body); font-size:14px; color:var(--text-dim); text-decoration:none; transition:color 150ms ease; }
.m-nav-links a:hover { color:var(--text); text-decoration:none; }
.m-nav-cta { color:var(--accent) !important; }
.m-nav-meter { font-family:var(--font-mono); font-size:11px; color:var(--text-muted); }

/* ===== MARKETING HERO ===== */
.m-wrap { max-width:1200px; margin:0 auto; padding:0 48px; }
@media (max-width:640px) { .m-wrap { padding:0 20px; } }
.m-hero { padding:100px 0 80px; }
.m-h1 { font-family:var(--font-display); font-weight:200; font-size:clamp(36px,6vw,64px); line-height:1.05; letter-spacing:-0.02em; margin:0 0 20px; color:var(--text); }
.m-sub { font-family:var(--font-body); font-weight:300; font-size:clamp(16px,2.5vw,20px); color:var(--text-dim); max-width:600px; line-height:1.5; margin:0 0 36px; }
.m-cta-row { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:28px; }
.m-cta-primary { padding:14px 28px !important; font-size:15px !important; font-weight:500 !important; }
.m-cta-secondary { padding:14px 28px !important; font-size:15px !important; border-color:var(--border-strong) !important; }
.m-cta-ghost { background:transparent !important; border-color:var(--border) !important; color:var(--text-dim) !important; padding:14px 28px !important; font-size:15px !important; }
.m-trust { font-family:var(--font-mono); font-size:12px; color:var(--text-muted); letter-spacing:0.04em; }

/* ===== DIFFERENTIATORS ===== */
.m-cards-section { padding:80px 0; border-top:1px solid var(--border); }
.m-eyebrow-label { font-family:var(--font-mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--accent); margin-bottom:32px; }
.m-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
@media (max-width:820px) { .m-cards { grid-template-columns:1fr; } }
.m-card { padding:28px; border:1px solid var(--border); border-radius:8px; background:transparent; transition:border-color 200ms ease; }
.m-card:hover { border-color:var(--border-strong); }
.m-card-label { font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); margin-bottom:14px; }
.m-card-title { font-family:var(--font-display); font-weight:300; font-size:22px; line-height:1.2; margin:0 0 10px; color:var(--text); }
.m-card-body { font-family:var(--font-body); font-weight:300; font-size:14.5px; color:var(--text-dim); line-height:1.55; margin:0; }

/* ===== PRICING ===== */
.m-pricing-section { padding:80px 0; border-top:1px solid var(--border); }
.m-pricing { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:start; }
@media (max-width:820px) { .m-pricing { grid-template-columns:1fr; } }
.m-price-card { padding:28px; border:1px solid var(--border); border-radius:8px; display:flex; flex-direction:column; }
.m-price-featured { border-color:var(--accent); background:rgba(191,255,90,0.02); transform:scale(1.02); }
.m-price-tier { font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); margin-bottom:8px; }
.m-price-amount { font-family:var(--font-display); font-weight:300; font-size:48px; line-height:1; color:var(--text); margin-bottom:6px; }
.m-price-tag { font-family:var(--font-body); font-size:14px; color:var(--text-dim); margin-bottom:16px; }
.m-price-list { list-style:none; padding:0; margin:0 0 20px; flex:1; }
.m-price-list li { font-family:var(--font-body); font-size:14px; color:var(--text-dim); padding:5px 0 5px 18px; position:relative; }
.m-price-list li::before { content:"›"; position:absolute; left:0; color:var(--accent); }
.m-price-cta { width:100%; justify-content:center !important; display:flex !important; }

/* ===== SCAN FORM HEADER ===== */
.m-form-header { padding:56px 0 0; border-top:1px solid var(--border); }
.m-form-title { font-family:var(--font-display); font-weight:300; font-size:32px; margin:0 0 8px; color:var(--text); }
.m-form-sub { font-family:var(--font-body); font-size:16px; color:var(--text-dim); margin:0 0 28px; }

/* ===== COOKIE BANNER ===== */
.cookie-banner { position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(140%); transition:transform 300ms ease-out; width:520px; max-width:calc(100vw - 48px); background:var(--panel); border:1px solid var(--border-strong); border-radius:8px; padding:14px 18px; z-index:200; display:flex; align-items:center; gap:16px; }
.cookie-banner.show { transform:translateX(-50%) translateY(0); }
.cookie-text { flex:1; font-family:var(--font-body); font-size:13px; color:var(--text-dim); margin:0; }
.cookie-ack { background:var(--accent); color:var(--accent-ink); border:0; padding:7px 14px; border-radius:4px; font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; }
.cookie-more { font-family:var(--font-mono); font-size:12px; color:var(--text-muted); text-decoration:none; white-space:nowrap; }
.cookie-more:hover { color:var(--text); }

/* ===== MARKETING FOOTER ===== */
footer.foot { color: var(--muted); font-size: 12px; padding: 32px 28px; text-align: center; border-top: 1px solid var(--border); margin-top: 70px; font-family: var(--mono); }
.m-footer-inner { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:36px 48px 52px; }
@media (max-width:640px) { .m-footer-inner { flex-direction:column; align-items:flex-start; padding:28px 20px 44px; } }
.m-footer-copy { font-family:var(--font-mono); font-size:12px; color:var(--text-muted); }
.m-footer-links { display:flex; gap:16px; flex-wrap:wrap; }
.m-footer-links a { font-family:var(--font-mono); font-size:12px; color:var(--text-dim); text-decoration:none; }
.m-footer-links a:hover { color:var(--text); }
.kbd { font-family: var(--mono); background: var(--panel-2); border: 1px solid var(--border); border-bottom-width: 2px; padding: 1px 6px; border-radius: 4px; font-size: 11.5px; color: var(--muted); }

.delta-pill { font: 700 10px/1.6 var(--mono); padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
.delta-pill.up { background: rgba(34,197,94,.15); color: var(--good); }
.delta-pill.down { background: rgba(239,68,68,.15); color: var(--bad); }
.delta-pill.flat { background: var(--panel-3); color: var(--muted); }

.legend { display:flex; gap: 10px; flex-wrap: wrap; font-family: var(--mono); font-size: 11.5px; color: var(--muted); }
.legend span { display:inline-flex; align-items:center; gap: 6px; }
.legend .sw { width: 10px; height: 10px; border-radius: 2px; }

.scan-meter { display:flex; gap: 14px; align-items:center; margin-bottom: 10px; }
.scan-meter .label { font-family: var(--mono); font-size: 12px; color: var(--muted); }
.scan-meter .progress { flex: 1; max-width: 220px; height: 4px; background: var(--panel-2); border-radius: 999px; overflow: hidden; }
.scan-meter .progress > span { display:block; height:100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); }

/* Generating banner */
.generating-banner { display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.35); border-radius:10px; color:var(--warn); font-size:13.5px; margin-bottom:14px; }
.generating-banner .spin { width:14px; height:14px; border:2px solid rgba(245,158,11,.35); border-top-color:var(--warn); border-radius:50%; animation:_spin .8s linear infinite; flex-shrink:0; }
@keyframes _spin { to { transform:rotate(360deg); } }

/* Workspace bar */
.workspace-bar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:11px 16px; background:var(--panel); border:1px solid var(--border-hi); border-radius:10px; margin-bottom:14px; }
.workspace-bar .ws-stat { font-family:var(--mono); font-size:12px; color:var(--muted); }
.workspace-bar .ws-stat strong { color:var(--text); }
.workspace-bar .ws-spacer { flex:1; }

/* Evidence filter bar */
.ev-filter-bar { position:sticky; top:54px; z-index:40; background:var(--bg); padding:8px 0 6px; border-bottom:1px solid var(--border); margin-bottom:8px; display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.ev-filter-bar select { width:auto; padding:5px 9px; font-size:12px; font-family:var(--mono); border-radius:7px; border:1px solid var(--border); background:#0a0e13; color:var(--text); }
.ev-filter-bar input.ev-search { flex:1; min-width:130px; padding:5px 9px; font-size:12px; font-family:var(--mono); border-radius:7px; border:1px solid var(--border); background:#0a0e13; color:var(--text); }
.ev-pill-btn { padding:4px 10px; border-radius:999px; border:1px solid var(--border); background:var(--panel-2); color:var(--muted); font:600 11px/1.5 var(--mono); cursor:pointer; letter-spacing:.04em; transition:border-color .12s,color .12s; }
.ev-pill-btn:hover { border-color:var(--border-hi); color:var(--text); }
.ev-pill-btn.active { border-color:var(--accent); color:var(--accent); background:rgba(94,234,212,.07); }

/* Evidence card view */
.ev-card-item { border:1px solid var(--border); border-radius:8px; margin-bottom:5px; overflow:hidden; }
.ev-card-head { display:flex; align-items:center; gap:8px; padding:7px 12px; cursor:pointer; background:var(--panel-2); font-size:12px; user-select:none; }
.ev-card-head:hover { background:var(--panel-3); }
.ev-card-body { padding:10px 12px; font:12px/1.5 var(--mono); color:var(--muted); display:none; }
.ev-card-item.ev-open .ev-card-body { display:block; }
.ev-svc-tag { font:700 10px/1.4 var(--mono); padding:1px 6px; border-radius:4px; background:rgba(94,234,212,.1); color:var(--accent); border:1px solid rgba(94,234,212,.2); flex-shrink:0; }

/* Evidence table view */
.ev-table { width:100%; border-collapse:collapse; font-size:12.5px; font-family:var(--mono); }
.ev-table th { text-align:left; padding:6px 10px; color:var(--muted); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--border); }
.ev-table td { padding:6px 10px; border-bottom:1px solid var(--border); vertical-align:middle; max-width:0; }
.ev-table tr:hover td { background:var(--panel-2); }
.ev-table .ev-api { color:var(--accent-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px; }
.ev-table .ev-sum { color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* Inline finding edit */
.find-edit-area { width:100%; margin-top:6px; padding:7px 9px; border-radius:6px; border:1px solid var(--accent); background:#050709; color:var(--text); font:13.5px/1.4 inherit; resize:vertical; min-height:54px; display:block; }
.find-editbar { margin-top:5px; display:flex; gap:6px; }
</style>
</head>
<body>

<header class="nav">
  <div class="brand"><span class="dot"></span> LoxeAI <span class="sub">/ Evidence Tracer · v2</span></div>
  <div class="meter"><span class="dotsmall"></span><span id="meterText">— scans today</span></div>
</header>

<main class="container">

  <!-- HOME / HERO -->
  <section id="hero" style="padding: 72px 0 30px;">
    <span class="eyebrow">SOC 2 Type I · AWS-native</span>
    <h1>Audit-grade SOC 2 readiness, <em>delivered in minutes.</em></h1>
    <p class="lede">Connect a read-only AWS role. We collect evidence across 15 services and 6 regions, run rule-based gap scoring instantly, and unlock full Claude Sonnet 4.6 analysis the moment you purchase. <strong style="color:var(--text)">$29.99 per report.</strong> No SaaS contract. No agent. No Slack-bot-of-the-month.</p>
    <div style="display:flex; gap: 10px; flex-wrap: wrap;">
      <button class="btn primary" onclick="document.getElementById('connect').scrollIntoView({behavior:'smooth'})">Run a scan →</button>
      <button class="btn" id="demoBtn">View demo report (AcmePay)</button>
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section id="how">
    <h2>Pipeline</h2>
    <div class="grid grid-3">
      <div class="card">
        <h3><span class="kbd">01</span> &nbsp; Read-only role</h3>
        <p style="color:var(--muted)">Deploy our CFN template. ExternalId-bound, scoped to <code>SecurityAudit</code> + <code>ReadOnlyAccess</code>, with explicit Deny on secret material. Delete the role any time.</p>
      </div>
      <div class="card">
        <h3><span class="kbd">02</span> &nbsp; Evidence collection</h3>
        <p style="color:var(--muted)">15 services × 6 regions, parallelized at 12 concurrent calls. Severity-aware truncation — we never drop CRITICAL findings.</p>
      </div>
      <div class="card">
        <h3><span class="kbd">03</span> &nbsp; AI analysis</h3>
        <p style="color:var(--muted)">12 SOC 2 controls evaluated by Claude Sonnet 4.6, individually. Each control gets a status, gap score, audit risk, remediation CLI, and auditor questions.</p>
      </div>
    </div>
  </section>

  <!-- CONNECT -->
  <section id="connect">
    <h2>Connect AWS</h2>
    <div class="grid grid-2">
      <div class="card">
        <h3>1. Generate an ExternalId</h3>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:14px;">
          <input class="input mono" id="extid" readonly value="">
          <button class="btn" id="genExt">Regenerate</button>
        </div>

        <h3>2. Deploy the CloudFormation</h3>
        <p style="color:var(--muted);font-size:13px;">Template grants only what we need. ExternalId is baked into the trust policy.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a class="btn" id="cfnDownload" href="/api/cloudformation" download="loxeai-pilot.yaml">Download YAML</a>
          <a class="btn" id="cfnLaunch" target="_blank" rel="noopener">Launch in AWS Console ↗</a>
        </div>

        <h3 style="margin-top:18px;">3. Paste your Role ARN</h3>
        <label>Role ARN</label>
        <input class="input mono" id="roleArn" placeholder="arn:aws:iam::123456789012:role/LoxeAIPilotReadOnlyRole">
        <label style="margin-top:10px;">Organization name</label>
        <input class="input" id="orgName" placeholder="AcmePay, Inc." style="font-family: inherit;">

        <div style="margin-top:16px; display:flex; gap:8px;">
          <button class="btn primary" id="startScan">Start scan →</button>
        </div>
        <p style="color:var(--muted); font-size:12px; margin-top:12px; font-family: var(--mono);">Limits: 3 scans / external_id / day · 1 concurrent · resets 00:00 UTC</p>
      </div>

      <div class="card subtle">
        <h3>What we touch</h3>
        <ul style="color:var(--muted); font-size: 13px; padding-left: 18px; margin: 8px 0 12px;">
          <li>IAM users, roles, policies, password policy, MFA</li>
          <li>S3 encryption, public access, versioning</li>
          <li>CloudTrail trails, event selectors</li>
          <li>Config recorders &amp; rules</li>
          <li>EC2 SGs, VPCs, flow logs</li>
          <li>KMS keys + rotation policies</li>
          <li>GuardDuty detectors &amp; finding stats</li>
          <li>SecurityHub standards + HIGH/CRITICAL findings</li>
          <li>SSO/Identity Center permission sets</li>
          <li>Secrets Manager metadata only (never values)</li>
          <li>WAF Web ACLs &amp; protected resources</li>
          <li>Lambda, RDS, SNS, CloudWatch</li>
        </ul>
        <p style="color:var(--muted); font-size:12px; font-family: var(--mono);">Read-only · ExternalId-bound · Zero secret material accessed</p>
      </div>
    </div>
  </section>

  <!-- SCAN PROGRESS -->
  <section id="progress" class="hidden">
    <h2>Scanning…</h2>
    <div class="card">
      <div class="progressbar"><span id="pbar" style="width:5%"></span></div>
      <div id="phase" style="margin-top: 12px; color: var(--text); font-family: var(--mono); font-size: 13px;">INIT</div>
      <div id="phaseDetail" style="margin-top: 4px; color: var(--muted); font-size: 12px; font-family: var(--mono);"></div>
    </div>
  </section>

  <!-- RESULTS / REPORT -->
  <section id="report" class="hidden">

    <!-- Generating banner (paid but Claude not done yet) -->
    <div id="generatingBanner" class="generating-banner hidden">
      <span class="spin"></span>
      <span>Your AI-graded report is being generated. This usually takes 1–2 minutes.</span>
      <button class="btn sm" onclick="location.reload()" style="margin-left:auto;flex-shrink:0">Refresh</button>
    </div>

    <!-- Workspace bar (paid + report_ready) -->
    <div id="workspaceBar" class="workspace-bar hidden">
      <span class="ws-stat"><strong id="wsResolvedCount">0 of 0</strong> findings resolved</span>
      <span class="ws-stat" id="wsLastEdited"></span>
      <span class="ws-spacer"></span>
      <a class="btn sm" id="wsDownloadHtml" target="_blank" rel="noopener" href="#">↓ HTML report</a>
      <a class="btn sm" id="wsDownloadJson" target="_blank" rel="noopener" href="#">↓ JSON</a>
      <button class="btn ghost sm" id="wsResetEdits" style="color:var(--muted)">Reset edits</button>
    </div>

    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom: 6px;">
      <div>
        <span class="eyebrow" id="reportEyebrow">Free-tier preview · heuristic scoring</span>
        <h2 id="reportTitle" style="margin: 8px 0 4px;">Readiness Report</h2>
      </div>
      <div class="scan-meter">
        <span class="label" id="resolvedCounter">0 of 0 resolved</span>
        <div class="progress"><span id="resolvedBar" style="width:0%"></span></div>
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card tight"><div class="legend"><span><span class="sw" style="background:var(--accent)"></span>Overall readiness</span></div><div id="readiness" style="font-size:24px;font-weight:700;margin-top:8px;">—</div></div>
      <div class="card tight"><div class="legend"><span><span class="sw" style="background:var(--accent-2)"></span>Avg gap score</span></div><div id="gap" style="font-size:24px;font-weight:700;margin-top:8px;font-family:var(--mono);">—/100</div></div>
      <div class="card tight"><div class="legend"><span><span class="sw" style="background:var(--accent-3)"></span>Evidence freshness</span></div><div id="fresh" style="font-size:24px;font-weight:700;margin-top:8px;font-family:var(--mono);">—/100</div></div>
    </div>

    <div id="execSummary" class="card subtle" style="margin-top:14px; color: var(--muted);"></div>

    <div id="deltaCard" class="card hidden" style="margin-top:14px;">
      <h3>Since your last scan</h3>
      <div id="deltaBody" style="color: var(--muted); font-size: 13.5px;"></div>
    </div>

    <h3 style="margin-top: 22px;">Controls</h3>
    <div class="legend" style="margin-bottom: 8px;">
      <span><span class="sw" style="background:rgba(34,197,94,.6)"></span>PASS</span>
      <span><span class="sw" style="background:rgba(234,179,8,.6)"></span>PARTIAL</span>
      <span><span class="sw" style="background:rgba(239,68,68,.6)"></span>FAIL</span>
      <span><span class="sw" style="background:rgba(139,150,163,.6)"></span>INCONCLUSIVE</span>
    </div>
    <div id="controls"></div>

    <!-- PAYWALL -->
    <div id="paywallWrap" class="paywall-wrap hidden">
      <div class="paywall-blur" id="paywallBlur"></div>
      <div class="paywall-overlay">
        <span class="eyebrow">Locked · paid report</span>
        <h2>Your full audit report is ready</h2>
        <ul>
          <li>Complete remediation roadmap with copy-pasteable AWS CLI commands</li>
          <li>Auditor-ready evidence package (SHA-256 verified)</li>
          <li>Gideon AI compliance copilot — context-aware, scan-grounded</li>
          <li>Human-in-the-loop report editing &amp; redactions</li>
          <li>Re-scan delta comparison vs your last report</li>
          <li>Print-optimized HTML for auditor submission</li>
        </ul>
        <div class="price">$29.99<small>one-time, per report</small></div>
        <button class="btn primary cta" id="buyBtn">Unlock full report →</button>
        <div class="footnote">Stripe Checkout · Test mode for pilot</div>
      </div>
    </div>

    <!-- PAID SECTIONS -->
    <div id="paid" class="hidden">
      <h3 style="margin-top: 24px;">Critical actions</h3>
      <ol id="critList" style="padding-left: 20px;"></ol>
      <h3>Strengths</h3>
      <ul id="strList" style="padding-left: 20px;"></ul>
      <div style="margin-top:18px; display:flex; gap:8px; flex-wrap:wrap;">
        <a class="btn primary hidden" id="dlHtml" target="_blank" rel="noopener">Download HTML report ↗</a>
        <a class="btn hidden" id="dlJson" target="_blank" rel="noopener">Download JSON</a>
      </div>

      <!-- Evidence catalog -->
      <div id="evidenceSection" class="hidden" style="margin-top:28px;">
        <h3 style="margin-bottom:6px;">Evidence catalog <span id="evCount" style="font-weight:400;color:var(--muted);font-size:13px;font-family:var(--mono);"></span></h3>
        <div class="ev-filter-bar" id="evFilterBar">
          <select id="evServiceSel"></select>
          <select id="evRegionSel"></select>
          <div id="evStatusPills" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
          <input class="ev-search" id="evSearch" placeholder="Search API, summary, or ID…">
          <button class="btn sm" id="evExpandAll">Expand all</button>
          <button class="btn sm" id="evCollapseAll">Collapse all</button>
          <button class="ev-pill-btn active" id="evCardViewBtn">Card</button>
          <button class="ev-pill-btn" id="evTableViewBtn">Table</button>
        </div>
        <div id="evList"></div>
      </div>
    </div>
  </section>
</main>

<footer class="foot">
  © LoxeAI · Pilot v2 · pilot.loxeai.com — read-only · ExternalId-bound · Sonnet 4.6 reasoning layer
</footer>

<button class="gideon-btn hidden" id="gideonOpen">⌬ Ask Gideon</button>

<div id="gideon" class="gideon hidden">
  <header>
    <div class="who"><span class="ring"></span><strong>Gideon</strong> <small>compliance copilot</small></div>
    <button class="btn ghost sm" id="gideonClose">×</button>
  </header>
  <div class="body" id="gideonBody"></div>
  <footer>
    <input class="input" id="gideonInput" placeholder="Ask about a finding…">
    <button class="btn primary" id="gideonSend">→</button>
  </footer>
</div>

<div id="toast" class="toast hidden"></div>

<script>
const $ = (id) => document.getElementById(id);
const STATE = {
  scanId: null, token: null, results: null, isPaid: false, openControl: null,
  demo: false, gideonMsgCount: 0,
  edits: {},         // { [target_path]: edit_row }
  evidenceData: [],
  evidenceView: 'card',
  evidenceFilters: { service: 'all', region: 'all', status: 'all', search: '' },
};

function toast(msg, isErr) { const t = $('toast'); t.textContent = msg; t.classList.toggle('error', !!isErr); t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3500); }

function uuid() { const a = new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 24); }
function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

// localStorage helpers
const RESOLVED_KEY = (sid) => 'loxeai.resolved.' + sid;
const TOKEN_KEY = (sid) => 'loxeai.token.' + sid;

function loadResolved(sid) { try { return JSON.parse(localStorage.getItem(RESOLVED_KEY(sid)) || '{}'); } catch { return {}; } }
function saveResolved(sid, map) { localStorage.setItem(RESOLVED_KEY(sid), JSON.stringify(map)); }

// ExternalId — load from localStorage or generate fresh
const EXTID_KEY = 'loxeai.external_id';
function getOrGenerateExtId() {
  let extid = localStorage.getItem(EXTID_KEY);
  if (!extid) {
    extid = 'loxeai_' + uuid();
    localStorage.setItem(EXTID_KEY, extid);
  }
  return extid;
}
$('extid').value = getOrGenerateExtId();
$('genExt').onclick = () => {
  const newExtId = 'loxeai_' + uuid();
  localStorage.setItem(EXTID_KEY, newExtId);
  $('extid').value = newExtId;
  refreshMeter();
};

$('cfnLaunch').addEventListener('click', (e) => {
  const tmplUrl = location.origin + '/api/cloudformation';
  e.target.href = 'https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?templateURL=' + encodeURIComponent(tmplUrl) + '&stackName=loxeai-pilot&param_ExternalId=' + encodeURIComponent($('extid').value);
});

async function refreshMeter() {
  try {
    const ext = $('extid').value;
    const r = await fetch('/api/meter?external_id=' + encodeURIComponent(ext));
    if (r.ok) {
      const d = await r.json();
      $('meterText').textContent = (d.daily_count || 0) + ' / ' + (d.daily_limit || 3) + ' scans today';
    }
  } catch {}
}
refreshMeter();

$('demoBtn').onclick = async () => {
  const r = await fetch('/api/demo'); const d = await r.json();
  STATE.scanId = d.id; STATE.results = d.results; STATE.isPaid = true; STATE.demo = true; STATE.gideonMsgCount = 0;
  renderReport(d.results, { paid: true, demo: true, orgName: d.org_name });
  document.getElementById('report').scrollIntoView({behavior:'smooth'});
};

$('startScan').onclick = async () => {
  const role_arn = $('roleArn').value.trim();
  const org_name = $('orgName').value.trim() || 'Untitled Org';
  const external_id = $('extid').value.trim();
  if (!role_arn.startsWith('arn:aws:iam::') || !role_arn.includes(':role/')) { toast('Enter a valid Role ARN', true); return; }
  if (!external_id || external_id.length < 8) { toast('Generate an ExternalId first', true); return; }
  const r = await fetch('/api/scan', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ role_arn, org_name, external_id })});
  const d = await r.json();
  if (!r.ok) { toast(d.error || 'Scan failed to start', true); return; }
  STATE.scanId = d.scan_id;
  $('progress').classList.remove('hidden');
  $('progress').scrollIntoView({behavior:'smooth'});
  pollStatus();
};

async function pollStatus() {
  let phaseEl = $('phase'), detailEl = $('phaseDetail'), bar = $('pbar');
  while (true) {
    const r = await fetch('/api/scan/' + STATE.scanId + '/status');
    const d = await r.json();
    if (!r.ok) { toast(d.error || 'Status check failed', true); return; }
    phaseEl.textContent = (d.status || '').toUpperCase();
    if (d.status === 'scanning') { bar.style.width = '45%'; detailEl.textContent = 'Collecting evidence across 15 services × 6 regions…'; }
    else if (d.status === 'complete') {
      bar.style.width = '100%';
      detailEl.textContent = (d.evidence_count || 0) + ' evidence items collected. Heuristic scoring done.';
      const rr = await fetch('/api/scan/' + STATE.scanId + '/results');
      const res = await rr.json();
      STATE.results = res;
      renderReport(res, { paid: false, orgName: d.org_name });
      $('progress').classList.add('hidden');
      $('report').scrollIntoView({behavior:'smooth'});
      refreshMeter();
      return;
    } else if (d.status === 'error') {
      toast(d.error_message || 'Scan failed', true); return;
    }
    await new Promise(r2 => setTimeout(r2, 1500));
  }
}

function renderReport(res, opts) {
  STATE.demo = opts.demo;
  $('report').classList.remove('hidden');
  $('reportTitle').textContent = (opts.orgName || 'Org') + ' — SOC 2 Readiness' + (opts.demo ? ' (demo)' : '');
  $('reportEyebrow').textContent = opts.paid ? 'Full report · Sonnet 4.6 analysis' : 'Free-tier preview · heuristic scoring';
  $('readiness').textContent = res.overall_readiness || '—';
  $('gap').textContent = (res.overall_gap_score ?? '—') + '/100';
  $('fresh').textContent = (res.overall_freshness_score ?? '—') + '/100';
  $('execSummary').textContent = res.executive_summary || '';

  const ctrlHost = $('controls');
  ctrlHost.innerHTML = '';
  for (const c of (res.controls || [])) {
    ctrlHost.insertAdjacentHTML('beforeend', renderControlRow(c, opts.paid));
  }

  // Resolved counter
  recomputeResolved(res);

  // Paywall logic
  if (opts.paid) {
    $('paid').classList.remove('hidden'); $('paywallWrap').classList.add('hidden');
    $('critList').innerHTML = (res.critical_actions || []).map(c => '<li>'+escapeHtml(c)+'</li>').join('');
    $('strList').innerHTML = (res.strengths || []).map(s => '<li>'+escapeHtml(s)+'</li>').join('');
    $('gideonOpen').classList.remove('hidden');

    // Workspace bar / generating banner
    if (opts.reportReady) {
      $('generatingBanner').classList.add('hidden');
      $('workspaceBar').classList.remove('hidden');
      if (STATE.token) {
        $('wsDownloadHtml').href = '/api/scan/' + STATE.scanId + '/report?token=' + encodeURIComponent(STATE.token) + '&format=html';
        $('wsDownloadJson').href = '/api/scan/' + STATE.scanId + '/report?token=' + encodeURIComponent(STATE.token) + '&format=json';
      }
      $('evidenceSection').classList.remove('hidden');
      if (!opts.demo) {
        loadServerEdits();
      }
      renderEvidence(res.evidence || []);
    } else {
      $('workspaceBar').classList.add('hidden');
      $('evidenceSection').classList.add('hidden');
    }
  } else {
    $('paid').classList.add('hidden'); $('paywallWrap').classList.remove('hidden');
    $('workspaceBar').classList.add('hidden');
    $('generatingBanner').classList.add('hidden');
    renderPaywallBlur(res);
    $('gideonOpen').classList.add('hidden');
  }

  // Wire control row click → expand
  ctrlHost.querySelectorAll('.ctrl-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
      const cid = row.dataset.cid;
      toggleControl(cid);
    });
  });
  // Wire resolved checkboxes
  ctrlHost.querySelectorAll('.finding .check').forEach(cb => {
    cb.addEventListener('click', (e) => { e.stopPropagation(); toggleResolved(cb.dataset.fid); });
  });
  // Wire finding inline-edit buttons
  ctrlHost.querySelectorAll('.find-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openEditMode(btn.dataset.fid, btn.dataset.field); });
  });
  STATE.isPaid = !!opts.paid;
}

function renderControlRow(c, paid) {
  const resolved = loadResolved(STATE.scanId);
  const detailHtml = paid ? renderControlDetail(c, resolved) : '';
  const deltaHtml = c.delta ? '<span class="delta-pill ' + c.delta.trend.replace('regressed','down').replace('improved','up').replace('unchanged','flat') + '">Δ ' + c.delta.previous_gap_score + '→' + c.gap_score + '</span>' : '';
  return [
    '<div class="ctrl-row" data-cid="' + escapeHtml(c.control_id) + '">',
    '  <div style="min-width:0; flex:1;">',
    '    <div><span class="id">' + escapeHtml(c.control_id) + '</span><span class="name">' + escapeHtml(c.name) + '</span> ' + deltaHtml + '</div>',
    '    <div class="summary">' + escapeHtml((c.summary || '').slice(0, 220)) + '</div>',
    '  </div>',
    '  <div class="scoreblock">',
    '    <div class="barwrap"><span style="width:' + Math.max(0, Math.min(100, c.gap_score)) + '%"></span></div>',
    '    <div class="score">' + (c.gap_score ?? '—') + '</div>',
    '    <span class="pill ' + escapeHtml(c.status) + '">' + escapeHtml(c.status) + '</span>',
    '  </div>',
    '</div>',
    '<div class="ctrl-detail hidden" id="cd_' + escapeHtml(c.control_id) + '">' + detailHtml + '</div>'
  ].join('');
}

function renderControlDetail(c, resolved) {
  const findings = (c.findings || []).slice().sort((a,b) => sevRank(b.severity) - sevRank(a.severity));
  const fHtml = findings.map(f => {
    const useServer = STATE.isPaid && !STATE.demo;
    const isResolved = useServer
      ? STATE.edits['findings.' + f.id]?.new_value === 'true'
      : !!(resolved[f.id]);
    const editedTitle = useServer ? (STATE.edits['findings.' + f.id + '.title']?.new_value || null) : null;
    const editedDesc  = useServer ? (STATE.edits['findings.' + f.id + '.description']?.new_value || null) : null;
    const isEdited = !!(editedTitle || editedDesc);
    const editBtn = (field) => useServer
      ? '<button class="btn ghost sm find-edit-btn" data-fid="' + escapeHtml(f.id) + '" data-field="' + field + '" style="font-size:11px;padding:2px 7px">Edit</button>'
      : '';
    return [
      '<div class="finding ' + escapeHtml(f.severity) + (isResolved ? ' resolved' : '') + '" id="f_' + escapeHtml(f.id) + '">',
      '  <div class="head">',
      '    <input type="checkbox" class="check" data-fid="' + escapeHtml(f.id) + '" ' + (isResolved ? 'checked' : '') + '>',
      '    <span class="pill ' + sevPillClass(f.severity) + '">' + escapeHtml(f.severity) + '</span>',
      '    <span class="title">' + escapeHtml(editedTitle || f.title) + '</span>',
      isEdited ? '<span class="edited-badge">edited by you</span>' : '',
      editBtn('title'),
      '  </div>',
      '  <div class="desc" id="fdesc_' + escapeHtml(f.id) + '">' + escapeHtml(editedDesc || f.description || '') + '</div>',
      useServer ? '<div style="margin-top:2px;">' + editBtn('description') + '</div>' : '',
      f.remediation ? '<pre class="cli">' + escapeHtml(f.remediation) + '</pre>' : '',
      '</div>'
    ].join('');
  }).join('');
  const recs = (c.recommendations || []).map(r => '<li>' + escapeHtml(r) + '</li>').join('');
  const aqs = (c.auditor_questions || []).map(q => '<li>' + escapeHtml(q) + '</li>').join('');
  const dis = (c.disclaimers || []).map(d => '<p style="color:var(--muted); font-size: 12.5px; font-style: italic; margin: 6px 0;">' + escapeHtml(d) + '</p>').join('');
  return [
    dis,
    '<p style="color:var(--muted); margin: 4px 0 10px;">' + escapeHtml(c.summary) + '</p>',
    findings.length ? '<h4 style="margin-top: 8px; color: var(--muted); font-size:11px; text-transform: uppercase; letter-spacing: .08em; font-family: var(--mono);">Findings</h4>' + fHtml : '',
    recs ? '<h4 style="margin-top: 12px; color: var(--muted); font-size:11px; text-transform: uppercase; letter-spacing: .08em; font-family: var(--mono);">Remediation roadmap</h4><ol style="padding-left: 18px;">' + recs + '</ol>' : '',
    aqs ? '<h4 style="margin-top: 12px; color: var(--muted); font-size:11px; text-transform: uppercase; letter-spacing: .08em; font-family: var(--mono);">What an auditor will ask</h4><ul style="padding-left: 18px;">' + aqs + '</ul>' : '',
  ].join('');
}

function sevRank(s) { return ({CRITICAL:5,HIGH:4,MEDIUM:3,LOW:2,INFO:1}[s])||0; }
function sevPillClass(s) { return s==='CRITICAL'?'crit':s==='HIGH'?'high':s==='MEDIUM'?'med':'low'; }

function toggleControl(cid) {
  document.querySelectorAll('.ctrl-detail').forEach(el => { if (el.id !== 'cd_'+cid) el.classList.add('hidden'); });
  document.querySelectorAll('.ctrl-row').forEach(el => { if (el.dataset.cid !== cid) el.classList.remove('open'); });
  const det = $('cd_' + cid); const row = document.querySelector('.ctrl-row[data-cid="'+cid+'"]');
  if (!det) return;
  const wasOpen = !det.classList.contains('hidden');
  det.classList.toggle('hidden');
  if (row) row.classList.toggle('open', !wasOpen);
  STATE.openControl = !wasOpen ? cid : null;
  // Auto-load Gideon context for paid users
  if (!wasOpen && STATE.isPaid && STATE.token) loadGideonContext(cid);
}

async function toggleResolved(fid) {
  if (!STATE.isPaid || STATE.demo) {
    // Demo / free: localStorage only
    const map = loadResolved(STATE.scanId); map[fid] = !map[fid]; if (!map[fid]) delete map[fid];
    saveResolved(STATE.scanId, map);
    const el = $('f_' + fid);
    if (el) { el.classList.toggle('resolved', !!map[fid]); const cb = el.querySelector('.check'); if (cb) cb.checked = !!map[fid]; }
    recomputeResolved(STATE.results);
    return;
  }
  // Paid: server-backed
  const path = 'findings.' + fid;
  const nowResolved = !(STATE.edits[path]?.new_value === 'true');
  const el = $('f_' + fid);
  if (el) { el.classList.toggle('resolved', nowResolved); const cb = el.querySelector('.check'); if (cb) cb.checked = nowResolved; }
  try {
    await fetch('/api/scan/' + STATE.scanId + '/edit?token=' + encodeURIComponent(STATE.token), {
      method: 'POST', headers: {'content-type':'application/json'},
      body: JSON.stringify({ edit_type: 'resolve', target_path: path, new_value: String(nowResolved) })
    });
    if (nowResolved) STATE.edits[path] = { edit_type: 'resolve', target_path: path, new_value: 'true', created_at: Date.now() };
    else delete STATE.edits[path];
  } catch { toast('Could not save resolved state', true); }
  recomputeResolved(STATE.results);
  updateWorkspaceBar();
}

function recomputeResolved(res) {
  if (!res || !STATE.scanId) return;
  const useServer = STATE.isPaid && !STATE.demo;
  const map = useServer ? null : loadResolved(STATE.scanId);
  let total = 0; let resolved = 0;
  for (const c of (res.controls || [])) {
    for (const f of (c.findings || [])) {
      total++;
      if (useServer) { if (STATE.edits['findings.' + f.id]?.new_value === 'true') resolved++; }
      else { if (map[f.id]) resolved++; }
    }
  }
  $('resolvedCounter').textContent = resolved + ' of ' + total + ' resolved';
  $('resolvedBar').style.width = total ? (resolved/total*100) + '%' : '0%';
}

function renderPaywallBlur(res) {
  // Render real (heuristic) data so the blurred preview is tangible
  const blur = $('paywallBlur');
  blur.innerHTML = (res.controls || []).slice(0, 6).map(c => {
    return '<div class="ctrl-row"><div><span class="id">'+escapeHtml(c.control_id)+'</span><span class="name">'+escapeHtml(c.name)+'</span><div class="summary">'+escapeHtml((c.summary||'').slice(0,180))+'</div></div><div class="scoreblock"><div class="score">'+(c.gap_score??'—')+'</div><span class="pill '+escapeHtml(c.status)+'">'+escapeHtml(c.status)+'</span></div></div>';
  }).join('');
}

$('buyBtn').onclick = async () => {
  if (!STATE.scanId) { toast('Run a scan first', true); return; }
  if (STATE.demo) {
    toast('This is the AcmePay demo. Connect AWS and run a real scan to purchase a report.', true);
    document.getElementById('connect')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const r = await fetch('/api/scan/' + STATE.scanId + '/purchase', { method: 'POST' });
  const d = await r.json();
  if (!r.ok) { toast(d.error || 'Checkout failed', true); return; }
  location.href = d.url;
};

// On load: handle ?purchased=true&session_id=... — resolve the download_token.
(async () => {
  const u = new URL(location.href);
  const scanId = u.searchParams.get('scan_id');
  const purchased = u.searchParams.get('purchased') === 'true';
  const sessionId = u.searchParams.get('session_id');
  if (scanId) STATE.scanId = scanId;

  if (scanId && purchased && sessionId) {
    // Resolve token via /api/scan/token (Stripe webhook will have run by now;
    // if not, we retry briefly).
    let tok = null; let tries = 0;
    while (!tok && tries < 8) {
      try {
        const r = await fetch('/api/scan/token?session_id=' + encodeURIComponent(sessionId));
        if (r.ok) { const d = await r.json(); tok = d.token; }
      } catch {}
      if (!tok) { await new Promise(r => setTimeout(r, 1500)); tries++; }
    }
    if (tok) {
      STATE.token = tok;
      localStorage.setItem(TOKEN_KEY(scanId), tok);
      // Strip query params so refresh doesn't re-fire
      history.replaceState({}, '', location.pathname + '?scan_id=' + encodeURIComponent(scanId));
    } else {
      toast('Payment succeeded but the report is still processing — refresh in a moment.', false);
    }
  } else if (scanId) {
    STATE.token = localStorage.getItem(TOKEN_KEY(scanId));
  }

  // If we have a scanId, load the latest results (paid view if token present)
  if (STATE.scanId) {
    const qs = STATE.token ? ('?token=' + encodeURIComponent(STATE.token)) : '';
    const r = await fetch('/api/scan/' + STATE.scanId + '/results' + qs);
    if (r.ok) {
      const res = await r.json();
      STATE.results = res;
      const sr = await fetch('/api/scan/' + STATE.scanId + '/status'); const sd = await sr.json();
      const orgName = sd.org_name;
      const reportReady = !!(STATE.token && sd.purchase?.report_ready);
      renderReport(res, { paid: !!STATE.token, orgName, reportReady });
      if (STATE.token && !reportReady) {
        pollUntilReady();
      }
    }
  }
})();

async function pollUntilReady() {
  $('generatingBanner').classList.remove('hidden');
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const sr = await fetch('/api/scan/' + STATE.scanId + '/status'); const sd = await sr.json();
    if (sd.purchase && sd.purchase.report_ready) {
      $('generatingBanner').classList.add('hidden');
      const rr = await fetch('/api/scan/' + STATE.scanId + '/results?token=' + encodeURIComponent(STATE.token));
      const res = await rr.json(); STATE.results = res;
      renderReport(res, { paid: true, orgName: sd.org_name, reportReady: true });
      toast('Full AI report ready', false);
      return;
    }
  }
}

// ---------- Server edits ----------

async function loadServerEdits() {
  if (!STATE.token || !STATE.scanId) return;
  try {
    const r = await fetch('/api/scan/' + STATE.scanId + '/edits?token=' + encodeURIComponent(STATE.token));
    if (!r.ok) return;
    const d = await r.json();
    STATE.edits = {};
    for (const edit of (d.edits || [])) STATE.edits[edit.target_path] = edit;
    applyEditsToDOM();
  } catch {}
}

function applyEditsToDOM() {
  for (const [path, edit] of Object.entries(STATE.edits)) {
    if (edit.edit_type === 'resolve') {
      const fid = path.replace(/^findings\./, '');
      const el = $('f_' + fid);
      if (!el) continue;
      const val = edit.new_value === 'true';
      el.classList.toggle('resolved', val);
      const cb = el.querySelector('.check'); if (cb) cb.checked = val;
    } else if (edit.edit_type === 'edit') {
      const parts = path.split('.');
      if (parts.length < 3) continue;
      const fid = parts[1]; const field = parts[2];
      const el = $('f_' + fid); if (!el) continue;
      if (field === 'title') {
        const t = el.querySelector('.title'); if (t) t.textContent = edit.new_value;
        if (!el.querySelector('.edited-badge')) {
          const head = el.querySelector('.head');
          if (head) head.insertAdjacentHTML('beforeend', '<span class="edited-badge">edited by you</span>');
        }
      } else if (field === 'description') {
        const d2 = el.querySelector('.desc'); if (d2) d2.textContent = edit.new_value;
      }
    }
  }
  recomputeResolved(STATE.results);
  updateWorkspaceBar();
}

function updateWorkspaceBar() {
  if (!STATE.results) return;
  let totalFindings = 0; let resolvedCount = 0; let lastAt = 0;
  for (const c of (STATE.results.controls || [])) {
    for (const f of (c.findings || [])) {
      totalFindings++;
      if (STATE.edits['findings.' + f.id]?.new_value === 'true') resolvedCount++;
    }
  }
  for (const edit of Object.values(STATE.edits)) { if ((edit.created_at || 0) > lastAt) lastAt = edit.created_at || 0; }
  $('wsResolvedCount').textContent = resolvedCount + ' of ' + totalFindings;
  $('wsLastEdited').textContent = lastAt ? 'Last edit: ' + new Date(lastAt).toLocaleTimeString() : '';
}

async function saveEdit(fid, field, newValue) {
  const path = 'findings.' + fid + '.' + field;
  await fetch('/api/scan/' + STATE.scanId + '/edit?token=' + encodeURIComponent(STATE.token), {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({ edit_type: 'edit', target_path: path, new_value: newValue })
  });
  STATE.edits[path] = { edit_type: 'edit', target_path: path, new_value: newValue, created_at: Date.now() };
  updateWorkspaceBar();
}

function openEditMode(fid, field) {
  const el = $('f_' + fid); if (!el) return;
  const isTitle = field === 'title';
  const targetEl = isTitle ? el.querySelector('.title') : el.querySelector('.desc');
  if (!targetEl) return;
  const orig = targetEl.textContent;
  const ta = document.createElement('textarea');
  ta.className = 'find-edit-area';
  ta.value = orig;
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn primary sm'; saveBtn.textContent = 'Save';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn sm'; cancelBtn.textContent = 'Cancel';
  const bar = document.createElement('div'); bar.className = 'find-editbar';
  bar.append(saveBtn, cancelBtn);
  const wrap = document.createElement('div'); wrap.append(ta, bar);
  targetEl.replaceWith(wrap); ta.focus();
  cancelBtn.onclick = () => wrap.replaceWith(targetEl);
  saveBtn.onclick = async () => {
    const v = ta.value.trim(); if (!v) return;
    try { await saveEdit(fid, field, v); } catch { toast('Edit failed to save', true); return; }
    const newEl = document.createElement(isTitle ? 'span' : 'div');
    newEl.className = isTitle ? 'title' : 'desc'; newEl.textContent = v;
    wrap.replaceWith(newEl);
    const head = el.querySelector('.head');
    if (head && !head.querySelector('.edited-badge'))
      head.insertAdjacentHTML('beforeend', '<span class="edited-badge">edited by you</span>');
    toast('Saved', false);
  };
}

async function deleteAllEdits() {
  if (!confirm('Reset all edits and resolved marks for this scan?')) return;
  try {
    await fetch('/api/scan/' + STATE.scanId + '/edit?token=' + encodeURIComponent(STATE.token), { method: 'DELETE' });
    STATE.edits = {};
    renderReport(STATE.results, { paid: true, orgName: STATE.results.org_name || '', reportReady: true });
    toast('Edits reset', false);
  } catch { toast('Reset failed', true); }
}

$('wsResetEdits').addEventListener('click', deleteAllEdits);

// ---------- Gideon ----------
$('gideonOpen').addEventListener('click', () => {
  $('gideon').classList.remove('hidden');
  $('gideonOpen').classList.add('hidden');
  if (STATE.openControl) loadGideonContext(STATE.openControl);
  else { $('gideonBody').innerHTML = '<div class="msg bot">Howdy, I&apos;m Gideon. Open a control to get auto-generated remediation suggestions, or ask me anything about your scan.</div>'; }
});
$('gideonClose').addEventListener('click', () => {
  $('gideon').classList.add('hidden');
  if (STATE.isPaid) $('gideonOpen').classList.remove('hidden');
});

async function loadGideonContext(controlId) {
  if (!STATE.token) return;
  const r = await fetch('/api/scan/' + STATE.scanId + '/gideon?token=' + encodeURIComponent(STATE.token), {
    method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ control_id: controlId })
  });
  if (!r.ok) return;
  const d = await r.json();
  const body = $('gideonBody');
  body.innerHTML = '';
  for (const s of (d.suggestions || [])) {
    const ctaHtml = s.cta ? '<div style="margin-top:6px;"><button class="btn sm" data-q="'+escapeHtml(s.cta.question)+'">Ask Gideon →</button></div>' : '';
    body.insertAdjacentHTML('beforeend', '<div class="sugg"><div class="label">'+escapeHtml(s.label)+'</div><div class="body-text">'+escapeHtml(s.body)+'</div>'+ctaHtml+'</div>');
  }
  body.querySelectorAll('button[data-q]').forEach(b => b.addEventListener('click', () => { $('gideonInput').value = b.dataset.q; sendGideon(); }));
}

async function sendGideon() {
  const q = $('gideonInput').value.trim(); if (!q) return;
  const body = $('gideonBody');
  body.insertAdjacentHTML('beforeend', '<div class="msg user">› '+escapeHtml(q)+'</div>');
  $('gideonInput').value = '';
  body.scrollTop = body.scrollHeight;
  if (STATE.demo && STATE.gideonMsgCount >= 3) {
    body.insertAdjacentHTML('beforeend', '<div class="msg bot">Unlock the paid report for unlimited Gideon access.</div>');
    return;
  }
  if (!STATE.token) { body.insertAdjacentHTML('beforeend', '<div class="msg bot">Unlock the paid report to chat with Gideon.</div>'); return; }
  const r = await fetch('/api/scan/' + STATE.scanId + '/gideon?token=' + encodeURIComponent(STATE.token), {
    method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ question: q, control_id: STATE.openControl || undefined })
  });
  const d = await r.json();
  body.insertAdjacentHTML('beforeend', '<div class="msg bot">'+escapeHtml(d.answer || d.error || '…')+'</div>');
  body.scrollTop = body.scrollHeight;
  STATE.gideonMsgCount++;
}
$('gideonSend').addEventListener('click', sendGideon);
$('gideonInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendGideon(); });

// ---------- Evidence catalog ----------

function renderEvidence(evidence) {
  if (!evidence || evidence.length === 0) return;
  STATE.evidenceData = evidence;

  const services = [...new Set(evidence.map(e => e.service))].sort();
  const regions  = [...new Set(evidence.map(e => e.region))].sort();

  const svcSel = $('evServiceSel');
  svcSel.innerHTML = '<option value="all">All services</option>' +
    services.map(s => '<option value="'+escapeHtml(s)+'">'+escapeHtml(s)+'</option>').join('');

  const regSel = $('evRegionSel');
  regSel.innerHTML = '<option value="all">All regions</option>' +
    regions.map(r => '<option value="'+escapeHtml(r)+'">'+escapeHtml(r)+'</option>').join('');

  rebuildStatusPills();
  restoreEvidenceURL();

  svcSel.onchange = () => { STATE.evidenceFilters.service = svcSel.value; applyEvidenceFilters(); syncEvidenceURL(); };
  regSel.onchange = () => { STATE.evidenceFilters.region  = regSel.value;  applyEvidenceFilters(); syncEvidenceURL(); };
  $('evSearch').oninput = () => { STATE.evidenceFilters.search = $('evSearch').value; applyEvidenceFilters(); syncEvidenceURL(); };
  $('evExpandAll').onclick   = () => document.querySelectorAll('.ev-card-item').forEach(el => el.classList.add('ev-open'));
  $('evCollapseAll').onclick = () => document.querySelectorAll('.ev-card-item').forEach(el => el.classList.remove('ev-open'));
  $('evCardViewBtn').onclick = () => { STATE.evidenceView = 'card';  $('evCardViewBtn').classList.add('active'); $('evTableViewBtn').classList.remove('active'); applyEvidenceFilters(); syncEvidenceURL(); };
  $('evTableViewBtn').onclick = () => { STATE.evidenceView = 'table'; $('evTableViewBtn').classList.add('active'); $('evCardViewBtn').classList.remove('active'); applyEvidenceFilters(); syncEvidenceURL(); };
}

function rebuildStatusPills() {
  const pills = $('evStatusPills');
  pills.innerHTML = ['all','CRITICAL','HIGH','MEDIUM','LOW','INFO'].map(s =>
    '<button class="ev-pill-btn' + (STATE.evidenceFilters.status === s ? ' active' : '') + '" data-status="'+s+'">' +
    (s === 'all' ? 'All' : s) + '</button>'
  ).join('');
  pills.querySelectorAll('.ev-pill-btn').forEach(btn => {
    btn.onclick = () => {
      STATE.evidenceFilters.status = btn.dataset.status;
      pills.querySelectorAll('.ev-pill-btn').forEach(b => b.classList.toggle('active', b === btn));
      applyEvidenceFilters(); syncEvidenceURL();
    };
  });
}

function applyEvidenceFilters() {
  const { service, region, status, search } = STATE.evidenceFilters;
  const q = search.toLowerCase();
  const filtered = (STATE.evidenceData || []).filter(e => {
    if (service !== 'all' && e.service !== service) return false;
    if (region  !== 'all' && e.region  !== region)  return false;
    if (status  !== 'all' && e.severity !== status)  return false;
    if (q && !e.api.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q) && !(e.summary||'').toLowerCase().includes(q)) return false;
    return true;
  });

  $('evCount').textContent = '(' + filtered.length + ')';
  const list = $('evList');

  if (STATE.evidenceView === 'table') {
    list.innerHTML =
      '<table class="ev-table"><thead><tr>' +
      '<th>Service</th><th>API</th><th>Region</th><th>Severity</th><th>Summary</th>' +
      '</tr></thead><tbody>' +
      filtered.map(e =>
        '<tr>' +
        '<td><span class="ev-svc-tag">'+escapeHtml(e.service)+'</span></td>' +
        '<td class="ev-api">'+escapeHtml(e.api)+'</td>' +
        '<td style="color:var(--dim)">'+escapeHtml(e.region)+'</td>' +
        '<td><span class="pill '+sevPillClass(e.severity||'low')+'">'+(e.severity||'INFO')+'</span></td>' +
        '<td class="ev-sum">'+escapeHtml(e.summary||e.id)+'</td>' +
        '</tr>'
      ).join('') +
      '</tbody></table>';
  } else {
    list.innerHTML = filtered.map(e =>
      '<div class="ev-card-item" id="evc_'+escapeHtml(e.id)+'">' +
      '<div class="ev-card-head" onclick="this.parentElement.classList.toggle(&#39;ev-open&#39;)">' +
      '<span class="ev-svc-tag">'+escapeHtml(e.service)+'</span>' +
      '<span style="color:var(--accent-2);font-family:var(--mono)">'+escapeHtml(e.api)+'</span>' +
      '<span style="color:var(--dim);font-size:11px;margin-left:4px">'+escapeHtml(e.region)+'</span>' +
      '<span style="flex:1"></span>' +
      '<span class="pill '+sevPillClass(e.severity||'low')+'">'+(e.severity||'INFO')+'</span>' +
      '</div>' +
      '<div class="ev-card-body">' +
      (e.summary ? '<div style="color:var(--text);margin-bottom:6px">'+escapeHtml(e.summary)+'</div>' : '') +
      (e.raw ? '<pre class="cli" style="max-height:140px;overflow:auto;margin-bottom:6px">'+escapeHtml(e.raw)+'</pre>' : '') +
      '<div style="color:var(--dim);font-size:11px">ID: '+escapeHtml(e.id)+(e.rawBytes?' · '+e.rawBytes+'B':'')+(e.truncated?' · truncated':'')+'</div>' +
      '</div>' +
      '</div>'
    ).join('');
  }
}

function syncEvidenceURL() {
  try {
    const u = new URL(location.href);
    u.searchParams.set('ev_svc', STATE.evidenceFilters.service);
    u.searchParams.set('ev_reg', STATE.evidenceFilters.region);
    u.searchParams.set('ev_st',  STATE.evidenceFilters.status);
    u.searchParams.set('ev_view', STATE.evidenceView);
    if (STATE.evidenceFilters.search) u.searchParams.set('ev_q', STATE.evidenceFilters.search);
    else u.searchParams.delete('ev_q');
    history.replaceState({}, '', u.toString());
  } catch {}
}

function restoreEvidenceURL() {
  try {
    const u = new URL(location.href);
    const svc  = u.searchParams.get('ev_svc');  if (svc)  { STATE.evidenceFilters.service = svc;  const s = $('evServiceSel'); if (s) s.value = svc; }
    const reg  = u.searchParams.get('ev_reg');  if (reg)  { STATE.evidenceFilters.region  = reg;  const s = $('evRegionSel');  if (s) s.value = reg; }
    const st   = u.searchParams.get('ev_st');   if (st)   { STATE.evidenceFilters.status  = st; }
    const q    = u.searchParams.get('ev_q');    if (q)    { STATE.evidenceFilters.search  = q;   const s = $('evSearch'); if (s) s.value = q; }
    const view = u.searchParams.get('ev_view'); if (view) { STATE.evidenceView = view; }
    if (STATE.evidenceFilters.status !== 'all') rebuildStatusPills();
    if (STATE.evidenceView === 'table') { $('evTableViewBtn')?.classList.add('active'); $('evCardViewBtn')?.classList.remove('active'); }
    applyEvidenceFilters();
  } catch {}
}
</script>
</body>
</html>
`;
