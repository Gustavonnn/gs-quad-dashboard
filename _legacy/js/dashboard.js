import { supabase } from './supabase.js';

// ─── Utilities ───────────────────────────────────────────────
const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatTime = () => {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
};

// ─── Animated counter ────────────────────────────────────────
function animateValue(el, start, end, duration, formatter = (v) => v) {
    if (!el) return;
    const startTime = performance.now();
    const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = start + (end - start) * ease;
        el.textContent = formatter(current);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = formatter(end);
    };
    requestAnimationFrame(update);
}

// ─── SVG Sparkline generator ─────────────────────────────────
function generateSparkline(values, color) {
    const w = 300, h = 48;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 8) - 4;
        return { x, y };
    });

    const linePts = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPts = `0,${h} ${linePts} ${w},${h}`;

    const id = `grad-${Math.random().toString(36).slice(2)}`;
    return `
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stop-color="${color}" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <polygon points="${areaPts}" fill="url(#${id})"/>
            <polyline points="${linePts}" fill="none" stroke="${color}" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="${pts[pts.length-1].x}" cy="${pts[pts.length-1].y}" r="3"
                fill="${color}" filter="drop-shadow(0 0 4px ${color})"/>
        </svg>`;
}

// Sparkline real: receita agrupada por dia (últimos 7 dias)
async function fetchSparkData(fallbackSeed = 5000) {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const { data } = await supabase
            .from('live_vendas')
            .select('data_venda, receita_total')
            .gte('data_venda', since.toISOString().split('T')[0])
            .order('data_venda', { ascending: true });

        if (!data || data.length === 0) return _fallbackSparkData(fallbackSeed);

        // Agrupar por dia
        const byDay = {};
        data.forEach(v => {
            const d = v.data_venda?.split('T')[0] || 'unknown';
            byDay[d] = (byDay[d] || 0) + parseFloat(v.receita_total || 0);
        });
        const values = Object.values(byDay);
        return values.length >= 2 ? values : _fallbackSparkData(fallbackSeed);
    } catch {
        return _fallbackSparkData(fallbackSeed);
    }
}

function _fallbackSparkData(seed = 1000, count = 7) {
    const data = [];
    let v = seed;
    for (let i = 0; i < count; i++) {
        v += (Math.random() - 0.4) * seed * 0.15;
        v = Math.max(v, seed * 0.3);
        data.push(v);
    }
    return data;
}

// ─── SPA Router ──────────────────────────────────────────────
function initRouter() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.spa-view');

    navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            navItems.forEach((n) => n.classList.remove('active'));
            views.forEach((v) => {
                v.classList.remove('active');
                v.classList.add('hidden');
            });

            item.classList.add('active');
            const newView = document.getElementById(targetId);
            if (newView) {
                newView.classList.remove('hidden');
                newView.classList.add('active');
            }

            if (targetId === 'view-growth') loadGrowthPlans();
            else if (targetId === 'view-chat') loadChatHistory();
            else if (targetId === 'view-curva') loadCurvaABC();
            else if (targetId === 'view-monitor') loadMonitorAlertas();
        });
    });
}

// ─── Live Feed Terminal ───────────────────────────────────────
const logToFeed = (message, type = 'system') => {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;

    const li = document.createElement('li');
    li.className = `feed-item type-${type}`;
    li.innerHTML = `<span class="timestamp">${formatTime()}</span><span class="feed-msg">${message}</span>`;

    feedList.insertBefore(li, feedList.firstChild);
    if (feedList.childElementCount > 10) feedList.removeChild(feedList.lastChild);
};

// ─── Load Metrics ─────────────────────────────────────────────
async function loadInitialMetrics() {
    logToFeed('SYS: Executando sync remoto...', 'system');

    try {
        const hoje = new Date().toISOString().split('T')[0];

        // Revenue
        const { data: vendas } = await supabase
            .from('live_vendas').select('receita_total').gte('data_venda', hoje);
        const totalVendas = vendas
            ? vendas.reduce((s, v) => s + parseFloat(v.receita_total || 0), 0) : 0;

        const elVendas = document.getElementById('vendas-hoje');
        animateValue(elVendas, 0, totalVendas, 1200, (v) => formatCurrency(v));

        // Render sparkline for revenue
        const spark = document.getElementById('sparkline-vendas');
        if (spark) {
            const sparkData = await fetchSparkData(totalVendas || 5000);
            spark.innerHTML = generateSparkline(sparkData, '#00e87a');
        }

        // Alerts
        const { count: alertasAtivos } = await supabase
            .from('ia_alertas').select('*', { count: 'exact', head: true }).eq('resolvido', false);
        const alertCount = alertasAtivos || 0;

        const elAlertas = document.getElementById('alertas-ativas');
        if (elAlertas) {
            animateValue(elAlertas, 0, alertCount, 800,
                (v) => Math.round(v).toString().padStart(2, '0'));
        }

        // Bar fill for alerts (visual indicator)
        const barAlertas = document.getElementById('bar-alertas');
        if (barAlertas) {
            setTimeout(() => {
                barAlertas.style.width = `${Math.min(alertCount * 10, 100)}%`;
            }, 400);
        }

        // Products
        const { count: totalProdutos } = await supabase
            .from('live_produtos').select('*', { count: 'exact', head: true });
        const prodCount = totalProdutos || 0;

        const elProdutos = document.getElementById('total-produtos');
        if (elProdutos) {
            animateValue(elProdutos, 0, prodCount, 1000, (v) => Math.round(v).toString());
        }

        const barProdutos = document.getElementById('bar-produtos');
        if (barProdutos && prodCount > 0) {
            setTimeout(() => {
                barProdutos.style.width = `${Math.min((prodCount / 500) * 100, 100)}%`;
            }, 600);
        }

        logToFeed(`SYNC_OK: Revenue=${formatCurrency(totalVendas)}, Alertas=${alertCount}, SKUs=${prodCount}`, 'system');

    } catch (err) {
        logToFeed('CRASH: Conexão BD Mestra recusada.', 'alert');
    }
}

// ─── Load Curva ABC ───────────────────────────────────────────
let _abcData = [];

async function loadCurvaABC() {
    const tbody = document.getElementById('abc-tbody');
    const totalLabel = document.getElementById('abc-total-label');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="padding:2rem;text-align:center;color:var(--text-3);">Carregando portfólio...</td></tr>`;

    const { data, error } = await supabase
        .from('curva_abc')
        .select('*')
        .order('receita_30d', { ascending: false })
        .limit(500);

    if (error || !data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:2rem;text-align:center;color:var(--text-3);">
            Sem dados. Execute o pipeline e rode sync_duckdb_to_supabase.py</td></tr>`;
        return;
    }

    _abcData = data;

    // KPI cards
    const grupos = { A: [], B: [], C: [] };
    data.forEach(r => { if (grupos[r.curva_abc]) grupos[r.curva_abc].push(r); });
    for (const [curva, rows] of Object.entries(grupos)) {
        const el = document.getElementById(`abc-count-${curva.toLowerCase()}`);
        const re = document.getElementById(`abc-receita-${curva.toLowerCase()}`);
        if (el) el.textContent = rows.length;
        if (re) re.textContent = formatCurrency(rows.reduce((s, r) => s + parseFloat(r.receita_30d || 0), 0));
    }

    if (totalLabel) totalLabel.textContent = `${data.length} SKUs carregados`;

    renderAbcTable(data);

    // Filtros
    document.querySelectorAll('.abc-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.abc-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const curva = btn.getAttribute('data-curva');
            const filtered = curva === 'all' ? _abcData : _abcData.filter(r => r.curva_abc === curva);
            renderAbcTable(filtered);
        });
    });

    // Busca
    document.getElementById('abc-search')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = _abcData.filter(r =>
            (r.id || '').toLowerCase().includes(q) ||
            (r.titulo || '').toLowerCase().includes(q)
        );
        renderAbcTable(filtered);
    });
}

function renderAbcTable(rows) {
    const tbody = document.getElementById('abc-tbody');
    const totalLabel = document.getElementById('abc-total-label');
    if (!tbody) return;
    if (totalLabel) totalLabel.textContent = `${rows.length} SKUs`;

    const CURVA_COLOR = { A: 'var(--acid)', B: 'var(--blue)', C: 'var(--red)' };
    const TENDENCIA_ICON = { crescendo: '↑', caindo: '↓', estavel: '→', declínio: '↓↓' };

    tbody.innerHTML = rows.map(r => {
        const cor = CURVA_COLOR[r.curva_abc] || 'var(--text-3)';
        const icon = TENDENCIA_ICON[r.tendencia] || '—';
        const alerta = r.alerta && r.alerta !== ''
            ? `<span style="color:var(--red);font-size:0.7rem;">${r.alerta.slice(0,40)}</span>`
            : `<span style="color:var(--text-3)">—</span>`;
        return `<tr style="border-bottom:1px solid var(--border-1);">
            <td style="padding:0.55rem 0.8rem;">
                <span style="font-weight:700;color:${cor};font-family:'JetBrains Mono',monospace;">${r.curva_abc || '?'}</span>
            </td>
            <td style="padding:0.55rem 0.8rem;font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--text-2);">${r.id || '—'}</td>
            <td style="padding:0.55rem 0.8rem;color:var(--text-1);max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.titulo || '—'}</td>
            <td style="padding:0.55rem 0.8rem;text-align:right;font-weight:600;color:var(--acid);">${formatCurrency(r.receita_30d || 0)}</td>
            <td style="padding:0.55rem 0.8rem;color:var(--text-2);font-size:0.75rem;">${r.ciclo || '—'}</td>
            <td style="padding:0.55rem 0.8rem;color:${r.tendencia === 'caindo' || r.tendencia === 'declínio' ? 'var(--red)' : r.tendencia === 'crescendo' ? 'var(--acid)' : 'var(--text-2)'};">${icon} ${r.tendencia || '—'}</td>
            <td style="padding:0.55rem 0.8rem;">${alerta}</td>
        </tr>`;
    }).join('');
}

// ─── Load Monitor Alertas ─────────────────────────────────────
async function loadMonitorAlertas() {
    const panel = document.querySelector('.alert-panel');
    if (!panel) return;

    panel.innerHTML = `<p style="color:var(--text-3);padding:1rem;">Carregando alertas...</p>`;

    const { data, error } = await supabase
        .from('ia_alertas')
        .select('*')
        .eq('resolvido', false)
        .order('data_registro', { ascending: false })
        .limit(50);

    if (error || !data || data.length === 0) {
        panel.innerHTML = `
            <div class="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.5" style="color:var(--acid);opacity:0.4;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
            </div>
            <p style="color:var(--text-2);">Nenhum alerta pendente</p>
            <p class="placeholder-sub" style="color:var(--text-3);">Portfólio dentro dos parâmetros operacionais</p>`;
        // Update nav badge
        const badge = document.getElementById('nav-badge-monitor');
        if (badge) badge.textContent = '0';
        return;
    }

    // Update nav badge
    const badge = document.getElementById('nav-badge-monitor');
    if (badge) badge.textContent = data.length;

    const SEV_COLOR = { 'CRÍTICO': 'var(--red)', 'ALTO': 'var(--amber)', 'MÉDIO': 'var(--blue)', 'BAIXO': 'var(--text-2)' };

    panel.innerHTML = data.map(a => {
        const cor = SEV_COLOR[a.severidade] || 'var(--text-2)';
        const dt = a.data_registro ? new Date(a.data_registro).toLocaleDateString('pt-BR') : '—';
        return `<div style="border:1px solid var(--border-2);border-left:3px solid ${cor};
                            border-radius:8px;padding:0.9rem 1rem;margin-bottom:0.6rem;background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;font-weight:700;color:${cor};">
                    [${a.severidade || '?'}] ${a.sku || '?'}
                </span>
                <div style="display:flex;align-items:center;gap:0.6rem;">
                    <span style="font-size:0.7rem;color:var(--text-3);">${dt}</span>
                    <button onclick="resolveAlerta('${a.id}')" style="
                        background:transparent;border:1px solid var(--acid);color:var(--acid);
                        padding:0.25rem 0.6rem;border-radius:4px;font-size:0.68rem;cursor:pointer;
                        font-family:'JetBrains Mono',monospace;transition:all 0.2s;">
                        ✓ RESOLVER
                    </button>
                </div>
            </div>
            <div style="font-size:0.78rem;color:var(--text-2);margin-bottom:0.3rem;">${a.tipo_alerta || ''}</div>
            <div style="font-size:0.75rem;color:var(--text-3);">${(a.descricao || '').slice(0, 120)}</div>
        </div>`;
    }).join('');
}

// ─── Resolver Alerta (Sync Reverso: Dashboard → Supabase → DuckDB) ──────────
window.resolveAlerta = async function(alertId) {
    const { error } = await supabase
        .from('ia_alertas')
        .update({ resolvido: true, status: 'RESOLVIDO', data_resolucao: new Date().toISOString() })
        .eq('id', alertId);

    if (!error) {
        logToFeed(`[OP] Alerta #${alertId} marcado como RESOLVIDO`, 'system');
        loadMonitorAlertas();
        loadInitialMetrics();
    } else {
        logToFeed(`[ERRO] Falha ao resolver alerta: ${error.message}`, 'alert');
    }
};

// ─── Load Growth Plans ────────────────────────────────────────
async function loadGrowthPlans() {
    const board = document.getElementById('growth-board');
    if (!board) return;

    board.innerHTML = '<div class="placeholder-panel"><p>Drenando Playbook Neural...</p></div>';

    const { data: plans, error } = await supabase
        .from('ia_growth_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

    if (error || !plans || plans.length === 0) {
        board.innerHTML = `
            <div class="placeholder-panel">
                <p>Sem planos táticos exportados na nuvem.</p>
                <p class="placeholder-sub">Aguardando execução de Geraldo (Python)</p>
            </div>`;
        return;
    }

    board.innerHTML = '';

    plans.forEach((plan, i) => {
        const isApproved = plan.status_intervencao === 'APROVADO';
        const card = document.createElement('div');
        card.className = 'plan-card';
        card.style.animationDelay = `${i * 0.06}s`;
        card.innerHTML = `
            <div class="plan-card-inner">
                <div>
                    <div class="plan-sku"># ${plan.sku}</div>
                    <div class="plan-action">&gt;&gt;&gt; ${plan.acionavel}</div>
                    <div class="plan-desc">${plan.descricao_plano}</div>
                </div>
                <span class="plan-status ${isApproved ? 'approved' : 'pending'}">
                    ${plan.status_intervencao}
                </span>
            </div>`;
        board.appendChild(card);
    });
}

// ─── Chat ─────────────────────────────────────────────────────
function renderMessages(msgs, historyBox) {
    historyBox.innerHTML = `
        <div class="chat-bubble ai-bubble">
            <div class="bubble-avatar">AI</div>
            <div class="bubble-content">
                <span class="bubble-meta">SQUAD_AI · online</span>
                <div class="bubble-text">Terminal neural habilitado. Conexão OK. Qual a requisição?</div>
            </div>
        </div>`;

    msgs.forEach((msg) => {
        const isUser = msg.role === 'user';
        const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`;
        bubble.innerHTML = `
            <div class="bubble-avatar">${isUser ? 'OP' : 'AI'}</div>
            <div class="bubble-content">
                <span class="bubble-meta">${isUser ? 'OPERADOR' : 'SQUAD_AI'} · ${time}</span>
                <div class="bubble-text">${msg.content.replace(/\n/g, '<br>')}</div>
            </div>`;
        historyBox.appendChild(bubble);
    });

    setTimeout(() => { historyBox.scrollTop = historyBox.scrollHeight; }, 50);
}

async function loadChatHistory() {
    const historyBox = document.getElementById('chat-history');
    if (!historyBox) return;

    const { data: msgs, error } = await supabase
        .from('mensagens_equipe')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

    if (!error && msgs) renderMessages(msgs, historyBox);
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';

    const historyBox = document.getElementById('chat-history');
    if (!historyBox) return;

    // Optimistic render
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble';
    userBubble.style.opacity = '0.6';
    userBubble.innerHTML = `
        <div class="bubble-avatar">OP</div>
        <div class="bubble-content">
            <span class="bubble-meta">OPERADOR · ${now}</span>
            <div class="bubble-text">${text}</div>
        </div>`;
    historyBox.appendChild(userBubble);

    const typingBubble = document.createElement('div');
    typingBubble.id = 'typing-indicator';
    typingBubble.className = 'chat-bubble ai-bubble';
    typingBubble.style.opacity = '0.5';
    typingBubble.innerHTML = `
        <div class="bubble-avatar">AI</div>
        <div class="bubble-content">
            <span class="bubble-meta">SQUAD_AI · processando</span>
            <div class="bubble-text"><span class="terminal-cursor"></span></div>
        </div>`;
    historyBox.appendChild(typingBubble);
    historyBox.scrollTop = historyBox.scrollHeight;

    await supabase.from('mensagens_equipe').insert([{ role: 'user', content: text }]);
}

// ─── Realtime ─────────────────────────────────────────────────
function initRealtime() {
    supabase.channel('gs-quad-live-ws')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_vendas' },
            (payload) => {
                logToFeed(`(+) INBOUND_REVENUE: ${formatCurrency(payload.new.receita_total)}`, 'revenue');
                loadInitialMetrics();
            })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ia_growth_plans' },
            () => {
                logToFeed('[AI] Growth Playbook atualizado pelo sistema neural!', 'ai');
                const growthView = document.getElementById('view-growth');
                if (growthView && !growthView.classList.contains('hidden')) loadGrowthPlans();
            })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens_equipe' },
            () => {
                const chatView = document.getElementById('view-chat');
                if (chatView && !chatView.classList.contains('hidden')) loadChatHistory();
            })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                logToFeed('WS_BRIDGE: [ STABLE ] Canal em tempo real conectado.', 'system');
            }
        });
}

// Chat polling fallback
setInterval(() => {
    const chatView = document.getElementById('view-chat');
    if (chatView && !chatView.classList.contains('hidden')) loadChatHistory();
}, 3000);

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
    loadInitialMetrics();
    initRealtime();

    document.getElementById('chat-send')?.addEventListener('click', sendChatMessage);
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
});
