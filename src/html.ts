// Single-file HTML frontend for LoxeAI Pilot v2.
// Dark, monospace-accented, clinical. Sections: Home, Connect, Scan, Results,
// Report (locked behind blurred paywall), Gideon side panel.

export const FRONTEND_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>LoxeAI — AWS Evidence Layer for SOC 2</title>
<meta name="description" content="Machine-verifiable AWS audit evidence for SOC 2. Every finding traces to the exact API call that generated it." />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23bfff5a'/%3E%3Cpath d='M8 8h16v4H8zM8 14h10v4H8zM8 20h13v4H8z' fill='%2307090c'/%3E%3C/svg%3E" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200&family=JetBrains+Mono:wght@400;700&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<meta property="og:title" content="LoxeAI — AWS Evidence Layer for SOC 2" />
<meta property="og:description" content="Machine-verifiable AWS audit evidence for SOC 2. Every finding traces to the exact API call that generated it." />
<meta property="og:url" content="https://loxeai.com" />
<link rel="canonical" href="https://loxeai.com" />
<meta property="og:type" content="website" />
<style>
:root {
  --bg: #07090c; --panel: #0e1218; --panel-2: #131922; --panel-3: #1b2331;
  --border: #1f2937; --border-hi: #2a3447;
  --text: #e6edf3; --muted: #8b96a3; --dim: #5b6776;
  --accent: #bfff5a; --accent-2: #bfff5a; --accent-3: #c4b5fd;
  --accent-ink: #07090c;
  --warn: #f59e0b; --bad: #ef4444; --good: #22c55e; --partial: #eab308; --crit: #b91c1c;
  --mono: "JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace;
  --font-display: "Fraunces",Georgia,serif;
  --font-body: "Inter Tight",system-ui,sans-serif;
  --font-mono: "JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace;
  --border-strong: rgba(255,255,255,0.14);
  --text-dim: rgba(255,255,255,0.65);
  --text-muted: rgba(255,255,255,0.42);
}
* { box-sizing: border-box; }
html, body { margin:0; padding:0; background: var(--bg); color: var(--text); font: 14.5px/1.55 -apple-system,"SF Pro Text","Inter",system-ui,sans-serif; -webkit-font-smoothing: antialiased; }
body { background: radial-gradient(ellipse at 60% 0%, #0d1520 0%, #07090c 55%); min-height: 100vh; }
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
.eyebrow { display:inline-block; font: 600 11px/1 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--accent); padding: 6px 10px; border: 1px solid rgba(191,255,90,.25); border-radius: 999px; background: rgba(191,255,90,.06); margin-bottom: 16px; }

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
.btn.primary { background: var(--accent); color: var(--accent-ink); border: 0; font-weight: 700; }
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
.gideon header .who .ring { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px rgba(191,255,90,.7); }
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
.gideon-btn { position: fixed; bottom: 24px; right: 24px; z-index: 70; width: 52px; height: 52px; border-radius: 50%; background: var(--accent); color: var(--accent-ink); border: 0; font-size: 20px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 32px rgba(191,255,90,.35); display:flex; align-items:center; justify-content:center; transition: transform .15s ease, box-shadow .15s ease; }
.gideon-btn:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(191,255,90,.5); }

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
.m-diff-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; }
.m-diff-stat { font-family:var(--font-display); font-weight:200; font-size:40px; line-height:1; color:var(--accent); margin:0 0 10px; }

/* ===== GIDEON MARKETING ===== */
.m-gideon-section { padding:80px 0; border-top:1px solid var(--border); }
.m-gideon-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
.m-gideon-list { list-style:none; padding:0; margin:0; }
.m-gideon-list li { font-family:var(--font-body); font-size:14.5px; color:var(--text-dim); padding:6px 0 6px 20px; position:relative; }
.m-gideon-list li::before { content:"›"; position:absolute; left:0; color:var(--accent); font-weight:700; }
.m-gideon-demo { background:var(--panel); border:1px solid var(--border-hi); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:10px; }
.m-gideon-bubble { padding:10px 14px; border-radius:10px; font-size:13.5px; line-height:1.5; max-width:90%; }
.m-gideon-bubble.bot { background:var(--panel-2); color:var(--text); align-self:flex-start; }
.m-gideon-bubble.user { background:rgba(191,255,90,.1); color:var(--accent); align-self:flex-end; border:1px solid rgba(191,255,90,.2); }
.m-gideon-tag { font-family:var(--font-mono); font-size:11px; color:var(--text-muted); text-align:center; margin-top:4px; }

/* ===== SOCIAL PROOF ===== */
.m-proof-section { padding:80px 0; border-top:1px solid var(--border); }
.m-proof-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.m-proof-card { padding:28px; border:1px solid var(--border); border-radius:8px; display:flex; flex-direction:column; gap:16px; }
.m-proof-quote { font-family:var(--font-body); font-weight:300; font-size:15px; color:var(--text-dim); line-height:1.6; font-style:italic; }
.m-proof-attr { font-family:var(--font-mono); font-size:11px; color:var(--text-muted); letter-spacing:.04em; }

@media (max-width:820px) { .m-diff-grid, .m-gideon-grid, .m-proof-grid { grid-template-columns:1fr; } }

/* ===== PRICING ===== */
.m-pricing-section { padding:80px 0; border-top:1px solid var(--border); }
.m-pricing { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; align-items:start; max-width:800px; }
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
.generating-banner { display:flex; align-items:center; gap:16px; padding:28px 32px; background:rgba(191,255,90,.04); border:1px solid rgba(191,255,90,.2); border-radius:14px; color:var(--text); font-size:14px; margin-bottom:14px; }
.generating-banner .spin { width:18px; height:18px; border:2px solid rgba(191,255,90,.25); border-top-color:var(--accent); border-radius:50%; animation:_spin .8s linear infinite; flex-shrink:0; }
@keyframes _spin { to { transform:rotate(360deg); } }
@keyframes _pulse { 0%,100% { box-shadow: 0 0 18px var(--accent); } 50% { box-shadow: 0 0 32px var(--accent), 0 0 8px var(--accent); } }
@keyframes _fadeup { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
.brand .dot { animation: _pulse 3s ease-in-out infinite; }
.m-hero { animation: _fadeup 0.6s ease both; }

/* Stat tiles */
.stat-tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
@media(max-width:820px){ .stat-tiles { grid-template-columns:repeat(2,1fr); } }
@media(max-width:480px){ .stat-tiles { grid-template-columns:1fr; } }
.stat-tile { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:18px 20px; display:flex; flex-direction:column; gap:6px; }
.stat-tile .st-label { font-family:var(--font-mono,var(--mono)); font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); }
.stat-tile .st-value { font-family:var(--font-display,"Fraunces",Georgia,serif); font-weight:300; font-size:36px; line-height:1; color:var(--text); }
.stat-tile .st-value.good { color:var(--good); }
.stat-tile .st-value.warn { color:var(--warn); }
.stat-tile .st-value.bad { color:var(--bad); }
.stat-tile .st-sub { font-family:var(--font-mono,var(--mono)); font-size:11px; color:var(--muted); }
.stat-tile .st-bar { height:2px; background:var(--panel-3); border-radius:999px; overflow:hidden; margin-top:4px; }
.stat-tile .st-bar span { display:block; height:100%; border-radius:999px; transition:width .6s ease; }

/* Gap chart */
.gap-chart { margin:22px 0 8px; }
.gap-chart-label { font-family:var(--font-mono,var(--mono)); font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); margin-bottom:10px; }
.gap-chart svg { width:100%; display:block; }

/* Post-purchase chip */
.audit-chip { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border:1px solid rgba(191,255,90,.35); border-radius:999px; background:rgba(191,255,90,.06); font-family:var(--font-mono,var(--mono)); font-size:11px; color:var(--accent); letter-spacing:.06em; margin-bottom:14px; }
.audit-chip .chip-dot { width:6px; height:6px; border-radius:50%; background:var(--accent); box-shadow:0 0 8px rgba(191,255,90,.6); }

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
  <div class="brand"><span class="dot"></span> LoxeAI</div>
  <nav class="m-nav-links">
    <a href="/methodology">Methodology</a>
    <a href="/privacy">Privacy</a>
    <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ05z0TdL1bzxVIT5hRxK3P57Kn092JjDzpOoMQZ5P_-WFfFmkjLVnq37J_E4Li2fGq5s6wdVB7h" class="m-nav-cta" target="_blank" rel="noopener">Questions</a>
  </nav>
  <span class="m-nav-meter" id="meterText"></span>
</header>

<main class="container">
<!-- HERO -->
  <section class="m-hero">
    <div class="m-wrap">
      <h1 class="m-h1">The AWS evidence layer<br>for your SOC 2 audit.</h1>
      <p class="m-sub">Your auditor needs receipts, not screenshots. We pull the raw AWS API responses, hash them, and map them to SOC 2 controls — in under 5 minutes, with zero persistent access.</p>
      <div class="m-cta-row">
        <button class="btn primary m-cta-primary" id="demoBtn">See a live demo →</button>
        <a class="btn m-cta-secondary" href="#scan">Run your free scan →</a>
        <a class="btn m-cta-ghost" href="/methodology">How it works</a>
      </div>
      <div class="m-trust">SHA-256 verified · read-only IAM · no persistent access · delete anytime</div>
    </div>
  </section>

  <!-- DIFFERENTIATORS -->
  <section class="m-cards-section">
    <div class="m-wrap">
      <div class="m-eyebrow-label">What&apos;s different</div>
      <div class="m-diff-grid">
        <div class="m-card">
          <div class="m-card-label">01 / VERIFIABLE</div>
          <div class="m-diff-stat">SHA-256</div>
          <h3 class="m-card-title">Every finding hashed.</h3>
          <p class="m-card-body">Every finding includes the AWS API endpoint, timestamp, and SHA-256 hash of the raw response. Your auditor can re-run the call themselves.</p>
        </div>
        <div class="m-card">
          <div class="m-card-label">02 / FAST</div>
          <div class="m-diff-stat">5 min</div>
          <h3 class="m-card-title">Not 30 days.</h3>
          <p class="m-card-body">Provision a read-only role, paste the ARN, get a gap report before your coffee gets cold.</p>
        </div>
        <div class="m-card">
          <div class="m-card-label">03 / HONEST</div>
          <div class="m-diff-stat">$39.99</div>
          <h3 class="m-card-title">We don&apos;t trade in vapor.</h3>
          <p class="m-card-body">No &apos;AI trained on millions of audits.&apos; No &apos;zero-persistence&apos; that isn&apos;t. One flat fee, no subscription.</p>
        </div>
        <div class="m-card">
          <div class="m-card-label">04 / PRIVATE</div>
          <div class="m-diff-stat">0 agents</div>
          <h3 class="m-card-title">No humans in your pipeline.</h3>
          <p class="m-card-body">No sales calls. No shared dashboards. Read-only IAM, ExternalId-bound. Your evidence stays yours.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- GIDEON -->
  <section class="m-gideon-section">
    <div class="m-wrap">
      <div class="m-eyebrow-label">Meet Gideon</div>
      <div class="m-gideon-grid">
        <div>
          <h2 style="font-family:var(--font-display);font-weight:300;font-size:clamp(28px,4vw,42px);line-height:1.1;margin:0 0 16px;">Your compliance copilot,<br>grounded in your scan.</h2>
          <p style="font-family:var(--font-body);font-weight:300;font-size:16px;color:var(--text-dim);line-height:1.6;max-width:480px;margin:0 0 24px;">Gideon isn&apos;t a generic chatbot. It reads your exact findings, your gap scores, and your AWS footprint — then tells you what to fix, in what order, with exact CLI commands.</p>
          <ul class="m-gideon-list">
            <li>Remediation roadmap with copy-pasteable AWS CLI commands</li>
            <li>Policy generator: security policy, IRP, change management</li>
            <li>Risk register (AICPA-aligned, 8-question intake)</li>
            <li>Auditor rehearser: practice answers before your audit</li>
          </ul>
        </div>
        <div class="m-gideon-demo">
          <div class="m-gideon-bubble bot">Howdy — your CC6.1 gap score is 42. Here&apos;s what to fix first: your root account has no hardware MFA. <code>aws iam enable-mfa-device …</code></div>
          <div class="m-gideon-bubble user">How long will this take?</div>
          <div class="m-gideon-bubble bot">About half a day — 1–2 changes plus verification. Start with root MFA (30 min), then revisit the password policy.</div>
          <div class="m-gideon-tag">Included with every paid report</div>
        </div>
      </div>
    </div>
  </section>

  <!-- SOCIAL PROOF -->
  <section class="m-proof-section">
    <div class="m-wrap">
      <div class="m-eyebrow-label">What the market is saying</div>
      <div class="m-proof-grid">
        <div class="m-proof-card">
          <p class="m-proof-quote">&ldquo;The control is actually working — you just can&apos;t prove it six months later because the proof was in a screenshot someone saved to a folder nobody remembers.&rdquo;</p>
          <div class="m-proof-attr">— Anonymous SaaS founder &middot; enterprise saas</div>
        </div>
        <div class="m-proof-card">
          <p class="m-proof-quote">&ldquo;Evidence collection is a problem even with tools that can be ridiculously expensive. Used Drata, wasn&apos;t that good. Used Vanta — not that much automation.&rdquo;</p>
          <div class="m-proof-attr">— Anonymous CISO &middot; enterprise fintech &middot; customer discovery</div>
        </div>
        <div class="m-proof-card">
          <p class="m-proof-quote">&ldquo;The SHA-256 traceability angle is genuinely smart. Tamper-evident, API-sourced evidence is something auditors will respect.&rdquo;</p>
          <div class="m-proof-attr">— Anonymous security founder &middot; customer discovery</div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section class="m-pricing-section">
    <div class="m-wrap">
      <div class="m-pricing">
        <div class="m-price-card">
          <div class="m-price-tier">Free</div>
          <div class="m-price-amount">$0</div>
          <div class="m-price-tag">Free scan, free gap report</div>
          <ul class="m-price-list">
            <li>Gap score &amp; freshness</li>
            <li>Evidence count</li>
            <li>Top findings (locked)</li>
            <li>No credit card</li>
          </ul>
          <a class="btn m-price-cta" href="#scan">Run free scan →</a>
        </div>
        <div class="m-price-card m-price-featured">
          <div class="m-price-tier">One-time, per report</div>
          <div class="m-price-amount">$39.99</div>
          <div class="m-price-tag">No subscription. No monthly billing. One scan, one report.</div>
          <ul class="m-price-list">
            <li>Deep analysis across 12 Critical SOC 2 controls</li>
            <li>Traceable evidence</li>
            <li>Remediation CLI commands</li>
            <li>Gideon compliance copilot</li>
            <li>Scan history &amp; deltas</li>
            <li>Edit &amp; resolve findings</li>
          </ul>
          <a class="btn primary m-price-cta" href="#scan">Get audit-grade →</a>
        </div>
      </div>
    </div>
  </section>
  
  <!-- CONNECT / SCAN FORM -->
  <div id="scan" style="scroll-margin-top:80px;"></div>
  <section id="connect">
    <div class="m-form-header container">
      <h2 class="m-form-title">Run your free scan</h2>
      <p class="m-form-sub">Provision a read-only IAM role. Paste the ARN. Get a gap report in under 30 seconds.</p>
    </div>
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
        <p style="color:var(--muted); font-size:12px; font-family: var(--mono);">Read-only · ExternalId-bound · Zero secret material accessed · <a href="/methodology#data" style="color:var(--muted);text-decoration:underline;">What we store</a></p>
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
      <div style="flex:1;">
        <div id="genBannerText" style="font-weight:600; margin-bottom:6px;">Analyzing your AWS environment…</div>
        <div style="height:3px;background:rgba(191,255,90,.15);border-radius:999px;overflow:hidden;width:100%;max-width:300px;">
          <div id="genProgressBar" style="height:100%;background:var(--accent);border-radius:999px;width:0%;transition:width .5s ease;"></div>
        </div>
        <div id="genProgressLabel" style="font-size:11px;margin-top:6px;color:var(--muted);font-family:var(--font-mono,var(--mono));">0 of 12 controls analyzed · 2–5 minutes</div>
      </div>
      <button class="btn sm" onclick="location.reload()" style="flex-shrink:0">Refresh</button>
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

    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom: 16px;">
      <div>
        <div id="auditChipWrap" style="display:none;"><span class="audit-chip"><span class="chip-dot"></span><span id="auditChipText">Audit Grade · Unlocked</span></span></div>
        <span class="eyebrow" id="reportEyebrow">Free scan · heuristic scoring</span>
        <h2 id="reportTitle" style="margin: 8px 0 4px; font-family:var(--font-display,'Fraunces',Georgia,serif); font-weight:300;">Readiness Report</h2>
        <div id="readiness" style="font-size:15px; color:var(--muted); font-family:var(--font-mono,var(--mono)); margin-top:4px;">—</div>
      </div>
      <div class="scan-meter">
        <span class="label" id="resolvedCounter" style="display:none;">0 of 0 resolved</span>
        <div class="progress" id="resolvedBarWrap" style="display:none;"><span id="resolvedBar" style="width:0%"></span></div>
      </div>
    </div>

    <div class="stat-tiles" id="statTiles">
      <div class="stat-tile">
        <div class="st-label">Controls assessed</div>
        <div class="st-value" id="statControls">—</div>
        <div class="st-sub" id="statControlsSub"></div>
      </div>
      <div class="stat-tile">
        <div class="st-label">Evidence items</div>
        <div class="st-value" id="statEvidence">—</div>
        <div class="st-sub" id="statEvidenceSub"></div>
      </div>
      <div class="stat-tile">
        <div class="st-label">Avg gap score</div>
        <div class="st-value" id="gap">—</div>
        <div class="st-bar"><span id="gapBar" style="width:0%"></span></div>
      </div>
      <div class="stat-tile">
        <div class="st-label">Evidence freshness</div>
        <div class="st-value" id="fresh">—</div>
        <div class="st-bar"><span id="freshBar" style="width:0%"></span></div>
      </div>
    </div>

    <div class="gap-chart" id="gapChartWrap" style="display:none;">
      <div class="gap-chart-label" style="display:flex;align-items:center;justify-content:space-between;">
        <span>Gap score by control</span>
        <a href="/methodology#scoring" style="font-family:var(--font-mono,var(--mono));font-size:10px;color:var(--muted);text-decoration:none;letter-spacing:.06em;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--muted)'">How is this scored? →</a>
      </div>
      <svg id="gapChartSvg" height="110" viewBox="0 0 800 110" preserveAspectRatio="none"></svg>
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
        <h2>Every finding. Every receipt.</h2>
        <ul>
          <li>Auditor-ready evidence package (SHA-256 verified)</li>
          <li>Complete remediation roadmap with copy-pasteable AWS CLI commands</li>
          <li>Gideon AI compliance copilot — context-aware, scan-grounded</li>
          <li>Re-scan delta comparison vs your last report</li>
          <li>Human-in-the-loop report editing &amp; redactions</li>
          <li>Print-optimized HTML for auditor submission</li>
        </ul>
        <div class="price">$39.99<small>one-time, per report</small></div>
        <button class="btn primary cta" id="buyBtn">Unlock full report →</button>
        <div class="footnote">Stripe Checkout · Secured by Stripe</div>
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
    </div>

    <!-- Data controls (universal: free + paid) -->
    <div id="dataControlsSection" class="hidden" style="margin-top:28px;">
      <h3 style="margin-bottom:6px;">Your data</h3>
      <div class="card" style="padding:18px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <div style="font-size:13px;color:var(--muted);line-height:1.6;">
              Your scan data is stored in Cloudflare Workers infrastructure for 30 days. We never store AWS credentials. Every access to your data is logged below. You can permanently delete all scan data at any time.
              <a href="/methodology#data" style="color:var(--accent);margin-left:4px;">Full data policy &#8594;</a>
            </div>
          </div>
          <button class="btn sm" id="deleteScanBtn" style="color:var(--bad);border-color:rgba(239,68,68,.3);flex-shrink:0;">Delete all my scan data</button>
        </div>
        <div style="margin-top:14px;">
          <div style="font:600 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;cursor:pointer;" id="auditLogToggle">Access log &#9658;</div>
          <div id="auditLogBody" class="hidden" style="max-height:200px;overflow-y:auto;font:12px/1.5 var(--mono);color:var(--muted);"></div>
        </div>
      </div>
    </div>

    <!-- Evidence catalog (free + paid) -->
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
        <button class="btn sm" id="evExportCsv">↓ CSV</button>
      </div>
      <div id="evList"></div>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="m-footer-inner">
    <span class="m-footer-copy">© 2026 LoxeAI · Boston, MA</span>
    <div class="m-footer-links">
      <a href="/methodology">Methodology</a>
      <a href="/privacy">Privacy</a>
      <a href="/cookies">Cookies</a>
      <a href="https://www.linkedin.com/in/arjav-mehta-175284258/" target="_blank" rel="noopener">LinkedIn</a>
      <a href="mailto:mehta.arja@northeastern.edu">Contact</a>
    </div>
  </div>
</footer>

<button class="gideon-btn hidden" id="gideonOpen" title="Ask Gideon">⌬</button>

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

<div id="cookieBanner" class="cookie-banner">
  <p class="cookie-text">We use only essential session cookies. No analytics. No trackers.</p>
  <a href="/cookies" class="cookie-more">Read more</a>
  <button class="cookie-ack" id="cookieAck">Got it</button>
</div>

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
      const cnt = d.daily_count || 0; const lim = d.daily_limit || 3;
      const remaining = Math.max(0, lim - cnt);
      $('meterText').textContent = remaining === 0
        ? 'Daily limit reached · resets midnight UTC'
        : remaining + ' free scan' + (remaining === 1 ? '' : 's') + ' remaining today';
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
      const extId = localStorage.getItem('loxeai.external_id') || '';
      const rr = await fetch('/api/scan/' + STATE.scanId + '/results?external_id=' + encodeURIComponent(extId));
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
  // Stat tiles
  const controls = res.controls || [];
  const passes = controls.filter(c => c.status === 'pass').length;
  const fails = controls.filter(c => c.status === 'fail').length;
  const partials = controls.filter(c => c.status === 'partial').length;
  $('statControls').textContent = controls.length || '—';
  $('statControlsSub').textContent = controls.length ? passes + ' pass · ' + partials + ' partial · ' + fails + ' fail' : '';
  $('statControls').className = 'st-value' + (fails > 3 ? ' bad' : fails > 0 ? ' warn' : passes > 0 ? ' good' : '');

  const evCount = (res.evidence || []).length;
  $('statEvidence').textContent = evCount || '—';
  $('statEvidenceSub').textContent = evCount ? 'across ' + new Set((res.evidence||[]).map(e=>e.service)).size + ' AWS services' : '';

  const gapScore = res.overall_gap_score ?? null;
  const freshScore = res.overall_freshness_score ?? null;
  $('gap').textContent = gapScore !== null ? gapScore + '/100' : '—';
  $('gap').className = 'st-value' + (gapScore !== null ? (gapScore < 40 ? ' bad' : gapScore < 70 ? ' warn' : ' good') : '');
  const gapBarEl = $('gapBar');
  if (gapBarEl) { gapBarEl.style.width = (gapScore || 0) + '%'; gapBarEl.style.background = gapScore < 40 ? 'var(--bad)' : gapScore < 70 ? 'var(--warn)' : 'var(--good)'; }

  $('fresh').textContent = freshScore !== null ? freshScore + '/100' : '—';
  $('fresh').className = 'st-value' + (freshScore !== null ? (freshScore < 40 ? ' bad' : freshScore < 70 ? ' warn' : ' good') : '');
  const freshBarEl = $('freshBar');
  if (freshBarEl) { freshBarEl.style.width = (freshScore || 0) + '%'; freshBarEl.style.background = freshScore < 40 ? 'var(--bad)' : freshScore < 70 ? 'var(--warn)' : 'var(--good)'; }

  $('readiness').textContent = res.overall_readiness || '—';
  $('execSummary').textContent = res.executive_summary || '';

  // Gap chart (shows on both free and paid)
  renderGapChart(controls);

  const ctrlHost = $('controls');
  ctrlHost.innerHTML = '';
  for (const c of (res.controls || [])) {
    ctrlHost.insertAdjacentHTML('beforeend', renderControlRow(c, opts.paid));
  }

  // Resolved counter
  recomputeResolved(res);

  // Audit chip
  const chipWrap = $('auditChipWrap');
  if (chipWrap) chipWrap.style.display = 'none';
  const eyebrow = $('reportEyebrow');
  if (eyebrow) eyebrow.textContent = opts.paid ? (opts.demo ? 'Demo · AcmePay, Inc.' : 'Full report · Claude analysis') : 'Free scan · heuristic scoring';

  // Resolve counter — paid only
  const rc = $('resolvedCounter'); const rb = $('resolvedBarWrap');
  if (rc) rc.style.display = opts.paid ? '' : 'none';
  if (rb) rb.style.display = opts.paid ? '' : 'none';

  // Paywall logic
  if (opts.paid) {
    $('paid').classList.remove('hidden'); $('paywallWrap').classList.add('hidden');
    $('critList').innerHTML = (res.critical_actions || []).map(a => {
      const parts = a.split(' — ');
      if (parts.length >= 2) {
        const label = parts[0];
        const cli = parts.slice(1).join(' — ');
        return '<li style="margin-bottom:12px;"><div style="font-weight:600;margin-bottom:4px;">'+escapeHtml(label)+'</div><pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11.5px;padding:8px 10px;background:#050709;border:1px solid var(--border);border-radius:6px;color:var(--accent);overflow-x:auto;">'+escapeHtml(cli)+'</pre></li>';
      }
      return '<li style="margin-bottom:8px;">'+escapeHtml(a)+'</li>';
    }).join('');
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
    // Show evidence catalog on free tier (items only, no raw body)
    const freeEvidence = (res.evidence || []).map(e => ({ ...e, raw: null }));
    if (freeEvidence.length > 0) {
      $('evidenceSection').classList.remove('hidden');
      renderEvidence(freeEvidence);
    }
  }

  // Wire control row click → expand
  ctrlHost.querySelectorAll('[data-action="unlock"]').forEach(btn => {
    btn.addEventListener('click', () => { const pw = $('paywallWrap'); if (pw) pw.scrollIntoView({behavior:'smooth'}); });
  });
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
  showDataControls();
}

function renderControlRow(c, paid) {
  const resolved = loadResolved(STATE.scanId);
  const detailHtml = paid ? renderControlDetail(c, resolved) : renderControlDetailFree(c);
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

function renderControlDetailFree(c) {
  const recs = (c.recommendations || []).slice(0, 3);
  const recsHtml = recs.length
    ? '<div style="margin-top:10px;"><div style="font:600 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">What to fix</div>' +
      recs.map(r => '<div style="padding:5px 0 5px 16px;position:relative;color:var(--text-dim);font-size:13px;"><span style="position:absolute;left:0;color:var(--accent)">›</span>'+escapeHtml(r)+'</div>').join('') +
      '</div>'
    : '';
  const sevOrder = ['CRITICAL','HIGH','MEDIUM','LOW','INFO'];
  const counts = {};
  for (const f of (c.findings || [])) { counts[f.severity] = (counts[f.severity] || 0) + 1; }
  const sevPills = sevOrder.filter(s => counts[s]).map(s => {
    const cls = s==='CRITICAL'?'crit':s==='HIGH'?'high':s==='MEDIUM'?'med':'low';
    return '<span class="pill '+cls+'" style="font-size:10px;padding:1px 6px;">'+counts[s]+' '+s+'</span>';
  }).join(' ');
  const lockInner = sevPills
    ? sevPills + '<span style="color:var(--muted);font-size:13px;margin-left:8px;">findings locked</span>'
    : '<span style="font-size:13px;color:var(--muted);">Finding detail, CLI remediation &amp; auditor questions locked.</span>';
  return [
    '<p style="color:var(--muted);margin:4px 0 10px;font-size:13.5px;">'+escapeHtml(c.summary||'')+'</p>',
    recsHtml,
    '<div style="margin-top:14px;padding:12px 14px;background:rgba(191,255,90,.04);border:1px solid rgba(191,255,90,.15);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;">',
    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'+lockInner+'</div>',
    '<button class="btn primary sm" data-action="unlock">Unlock &#8594;</button>',
    '</div>',
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
      // Auto-scroll to report after payment
      setTimeout(() => {
        const reportEl = $('report');
        if (reportEl) reportEl.scrollIntoView({ behavior: 'smooth' });
      }, 600);
    } else {
      toast('Payment succeeded but the report is still processing — refresh in a moment.', false);
    }
  } else if (scanId) {
    STATE.token = localStorage.getItem(TOKEN_KEY(scanId));
  }

  // If we have a scanId, load the latest results (paid view if token present)
  if (STATE.scanId) {
    const extId = localStorage.getItem('loxeai.external_id') || '';
    const qs = STATE.token
      ? ('?token=' + encodeURIComponent(STATE.token))
      : ('?external_id=' + encodeURIComponent(extId));
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
  let regenerated = false;
  for (let i = 0; i < 180; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const sr = await fetch('/api/scan/' + STATE.scanId + '/status'); const sd = await sr.json();
    // Update progress bar
    if (sd.ai_progress && sd.ai_progress.total > 0) {
      const pct = Math.round((sd.ai_progress.completed / sd.ai_progress.total) * 100);
      const pb = $('genProgressBar'); if (pb) pb.style.width = pct + '%';
      const pl = $('genProgressLabel'); if (pl) pl.textContent = sd.ai_progress.completed + ' of ' + sd.ai_progress.total + ' controls analyzed';
      const bt = $('genBannerText'); if (bt) bt.textContent = pct < 100 ? 'Analyzing controls with Claude…' : 'Assembling your report…';
    }
    if (sd.purchase && sd.purchase.report_ready) {
      $('generatingBanner').classList.add('hidden');
      const rr = await fetch('/api/scan/' + STATE.scanId + '/results?token=' + encodeURIComponent(STATE.token));
      const res = await rr.json(); STATE.results = res;
      renderReport(res, { paid: true, orgName: sd.org_name, reportReady: true });
      toast('Your report is ready', false);
      setTimeout(() => {
        if (!$('gideon').classList.contains('hidden')) return; // already open
        openGideon('Howdy — your full audit report is ready. Open any control for remediation suggestions, or ask me where to start.');
      }, 1200);
      return;
    }
    // Auto-regenerate once after ~12 minutes if still not ready
    if (i === 144 && !regenerated && STATE.token) {
      regenerated = true;
      fetch('/api/scan/' + STATE.scanId + '/regenerate?token=' + encodeURIComponent(STATE.token), { method: 'POST' })
        .catch(() => {});
      toast('Still working — re-queuing analysis…', false);
    }
  }
  toast('Report is taking longer than expected. Try refreshing.', true);
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
function openGideon(greeting) {
  $('gideon').classList.remove('hidden');
  $('gideonOpen').classList.add('hidden');
  if (STATE.openControl) { loadGideonContext(STATE.openControl); return; }
  const msg = greeting || 'Howdy. Open a control to get remediation suggestions, or ask me anything about your scan.';
  $('gideonBody').innerHTML = '<div class="msg bot">'+escapeHtml(msg)+'</div>';
}
$('gideonOpen').addEventListener('click', () => openGideon());
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
function renderMarkdown(s) {
  const escaped = escapeHtml(s);
  const bold = escaped.split('**').map((part, i) => i % 2 === 1 ? '<strong>' + part + '</strong>' : part).join('');
  const bullets = bold.replace(new RegExp('^[-\\u2022]\\s(.+)', 'gm'), '<div style="padding:2px 0 2px 14px;position:relative"><span style="position:absolute;left:0;color:var(--accent)">&#8250;</span>$1</div>');
  const paras = bullets.replace(new RegExp('\\n\\n', 'g'), '<br><br>');
  return paras.replace(new RegExp('\\n', 'g'), '<br>');
}

function renderGapChart(controls) {
  const wrap = $('gapChartWrap');
  const svg = $('gapChartSvg');
  if (!wrap || !svg || !controls || controls.length === 0) return;
  wrap.style.display = 'block';
  const sorted = [...controls].sort((a,b) => (a.gap_score ?? 0) - (b.gap_score ?? 0));
  const W = 800; const H = 110; const barH = 64; const labelH = 22; const gapH = 6;
  const n = sorted.length; const bw = Math.floor((W - (n-1)*gapH) / n);
  const colorMap = { pass:'#22c55e', fail:'#ef4444', partial:'#eab308', inconclusive:'#5b6776' };
  let html = '';
  sorted.forEach((c, i) => {
    const x = i * (bw + gapH);
    const score = c.gap_score ?? 0;
    const h = Math.max(4, Math.round((score / 100) * barH));
    const y = barH - h;
    const col = colorMap[c.status] || '#5b6776';
    html += '<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+h+'" rx="3" fill="'+col+'" opacity="0.85"/>';
    html += '<text x="'+(x+bw/2)+'" y="'+(barH+labelH)+'" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" fill="#5b6776">'+escapeHtml(c.control_id)+'</text>';
    html += '<text x="'+(x+bw/2)+'" y="'+(y-4)+'" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" fill="'+col+'" opacity="'+(score < 50 ? '1' : '0.7')+'">'+score+'</text>';
  });
  svg.innerHTML = html;
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
  body.insertAdjacentHTML('beforeend', '<div class="msg bot">'+renderMarkdown(d.answer || d.error || '…')+'</div>');
  body.scrollTop = body.scrollHeight;
  STATE.gideonMsgCount++;
}
 $('gideonSend').addEventListener('click', sendGideon);
$('gideonInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendGideon(); });

// ---------- Data controls (audit log + delete) ----------

function showDataControls() {
  $('dataControlsSection').classList.remove('hidden');
  loadAuditLog();
}

async function loadAuditLog() {
  if (!STATE.scanId) return;
  const extId = localStorage.getItem('loxeai.external_id') || '';
  const qs = STATE.token
    ? 'token=' + encodeURIComponent(STATE.token)
    : 'external_id=' + encodeURIComponent(extId);
  try {
    const r = await fetch('/api/scan/' + STATE.scanId + '/audit?' + qs);
    if (!r.ok) return;
    const d = await r.json();
    const body = $('auditLogBody');
    if (!d.entries || d.entries.length === 0) {
      body.innerHTML = '<div style="color:var(--dim);padding:4px 0;">No access events recorded yet.</div>';
      return;
    }
    body.innerHTML = d.entries.map(function(e) {
      const t = new Date(e.timestamp).toLocaleString();
      const actionLabels = { view_results: 'Viewed results', download_report: 'Downloaded report', gideon_query: 'Gideon query', delete_scan: 'Deleted scan', view_status: 'Checked status' };
      const label = actionLabels[e.action] || e.action;
      return '<div style="padding:3px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">' +
        '<span>' + escapeHtml(label) + ' <span style="color:var(--dim)">(' + escapeHtml(e.actor) + ')</span></span>' +
        '<span style="color:var(--dim)">' + escapeHtml(t) + '</span>' +
        '</div>';
    }).join('');
  } catch (e) {}
}

$('auditLogToggle').addEventListener('click', function() {
  const body = $('auditLogBody');
  const toggle = $('auditLogToggle');
  const isHidden = body.classList.contains('hidden');
  body.classList.toggle('hidden');
  toggle.textContent = isHidden ? 'Access log ▾' : 'Access log ▸';
  if (isHidden) loadAuditLog();
});

$('deleteScanBtn').addEventListener('click', async function() {
  if (!STATE.scanId) { toast('No scan to delete', true); return; }
  if (!confirm('Permanently delete ALL data for this scan? This cannot be undone.')) return;
  const extId = localStorage.getItem('loxeai.external_id') || '';
  const qs = STATE.token
    ? 'token=' + encodeURIComponent(STATE.token)
    : 'external_id=' + encodeURIComponent(extId);
  try {
    const r = await fetch('/api/scan/' + STATE.scanId + '/delete?' + qs, { method: 'DELETE' });
    const d = await r.json();
    if (r.ok) {
      toast('All scan data deleted.', false);
      localStorage.removeItem('loxeai.token.' + STATE.scanId);
      setTimeout(function() { location.href = '/'; }, 1500);
    } else {
      toast(d.error || 'Delete failed', true);
    }
  } catch (e) { toast('Delete failed', true); }
});

// ---------- Cookie banner ----------
(function() {
  if (document.cookie.indexOf('lxa_ck=1') !== -1) return;
  const b = $('cookieBanner'); if (!b) return;
  setTimeout(() => b.classList.add('show'), 1200);
  const ack = $('cookieAck');
  if (ack) ack.addEventListener('click', () => {
    document.cookie = 'lxa_ck=1; path=/; max-age=' + (365*24*60*60) + '; samesite=lax';
    b.classList.remove('show');
    setTimeout(() => b.style.display = 'none', 350);
  });
})();

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
  $('evExportCsv').onclick = exportEvidenceCSV;
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
      (e.raw ? '<pre class="cli" style="max-height:140px;overflow:auto;margin-bottom:6px">'+escapeHtml(e.raw)+'</pre>' : (STATE.isPaid ? '' : '<div style="font-size:11px;color:var(--muted);font-style:italic;margin-bottom:6px;">Raw API response available with paid report</div>')) +
      '<div style="color:var(--dim);font-size:11px">ID: '+escapeHtml(e.id)+(e.rawBytes?' · '+e.rawBytes+'B':'')+(e.truncated?' · truncated':'')+'</div>' +
      '</div>' +
      '</div>'
    ).join('');
  }
}

function exportEvidenceCSV() {
  const isPaid = STATE.isPaid && !STATE.demo;
  const rows = STATE.evidenceData || [];
  if (rows.length === 0) { toast('No evidence to export', true); return; }
  const headers = isPaid
    ? ['id','service','region','api','severity','summary','controls','rawBytes','truncated']
    : ['id','service','region','api','severity','summary','controls'];
  const lines = [headers.join(',')];
  for (const e of rows) {
    const row = isPaid
      ? [e.id, e.service, e.region, e.api, e.severity||'', '"'+(e.summary||'').replace(/"/g,'""')+'"', '"'+(e.controls||[]).join(';')+'"', e.rawBytes||'', e.truncated?'true':'false']
      : [e.id, e.service, e.region, e.api, e.severity||'', '"'+(e.summary||'').replace(/"/g,'""')+'"', '"'+(e.controls||[]).join(';')+'"'];
    lines.push(row.join(','));
  }
  const blob = new Blob([lines.join(String.fromCharCode(10))], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'loxeai-evidence-' + (STATE.scanId || 'export') + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

