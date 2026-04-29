const { useState, useEffect, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "merchantName": "Acme Goods",
  "merchantInitial": "A",
  "lineItemName": "Premium subscription",
  "lineItemMeta": "Monthly · auto-renews",
  "showItemImage": true,
  "customerFirstName": "John",
  "customerLastName": "Wick",
  "customerEmail": "john.wick@example.com",
  "customerPhone": "8460767724",
  "customerId": "AmitSh",
  "countryCode": "GBR",
  "description": "PROP-123456",
  "gatewayReferenceId": "gaia_ppro",
  "paymentPageClientId": "testamit333",
  "showPayloadByDefault": true,
  "iframeMode": false
}/*EDITMODE-END*/;

// API key is read by the backend from apiKey.txt (or JUSPAY_API_KEY env var).
// It is never sent from, displayed in, or stored by the frontend.

/* ============== TIMELINE ============== */
const STAGES = [
  { key: 'created', label: 'Order created' },
  { key: 'session', label: 'Session requested from Juspay' },
  { key: 'redirect', label: 'Redirect to Hypercheckout' },
  { key: 'result',   label: 'Payment result received' },
];

function Timeline({ stage, failed }) {
  const idx = STAGES.findIndex(s => s.key === stage);
  return (
    <div className="timeline-card">
      <h4>Status timeline</h4>
      <div className="timeline">
        {STAGES.map((s, i) => {
          const cls =
            failed && i === idx ? 'failed' :
            i < idx ? 'done' :
            i === idx ? 'active' : 'pending';
          return (
            <div className={`tl-step ${cls}`} key={s.key}>
              <div className="dot" />
              <div>
                <div className="label">{s.label}</div>
                {i < idx && <div className="ts">Completed</div>}
                {i === idx && !failed && <div className="ts">In progress…</div>}
                {i === idx && failed && <div className="ts" style={{color:'#C0392B'}}>Failed</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============== API LOGS (multi-call, collapsible) ============== */
function ApiLogsCard({ logs }) {
  const [open, setOpen] = useState(true);
  if (!logs.length) return null;
  return (
    <div className={`payload-card ${open ? 'open' : ''}`}>
      <button className="toggle" onClick={() => setOpen(o => !o)}>
        <span>API exchange log <span style={{color:'var(--ink-400)', fontWeight:500, marginLeft:6}}>· {logs.length} {logs.length === 1 ? 'call' : 'calls'}</span></span>
        <span className="chev"><Icon.Chev /></span>
      </button>
      {open && (
        <div className="api-log-list">
          {logs.map(log => <ApiLogItem key={log.id} log={log} />)}
        </div>
      )}
    </div>
  );
}

function ApiLogItem({ log }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('request');
  const status = log.status;
  const tone =
    status === 'pending' ? 'pending' :
    status >= 200 && status < 300 ? 'ok' :
    status >= 400 ? 'err' : 'pending';
  return (
    <div className={`api-log-row tone-${tone} ${open ? 'open' : ''}`}>
      <button className="api-log-head" onClick={() => setOpen(o => !o)}>
        <span className={`method m-${log.method.toLowerCase()}`}>{log.method}</span>
        <span className="endpoint">{log.endpoint}</span>
        <span className="status">{status === 'pending' ? '…' : status}</span>
        <span className="ts">{log.timestamp}</span>
        <span className="chev-mini"><Icon.Chev /></span>
      </button>
      {open && (
        <div className="api-log-body">
          <div className="tabs">
            <button className={tab==='request'?'active':''} onClick={() => setTab('request')}>Request →</button>
            <button className={tab==='response'?'active':''} onClick={() => setTab('response')}>← Response</button>
          </div>
          <pre>{JSON.stringify(tab === 'request' ? log.request : log.response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/* ============== PAYLOAD VIEWER ============== */
function PayloadCard({ openDefault, request, response }) {
  const [open, setOpen] = useState(!!openDefault);
  const [tab, setTab] = useState('request');
  const data = tab === 'request' ? request : response;

  return (
    <div className={`payload-card ${open ? 'open' : ''}`}>
      <button className="toggle" onClick={() => setOpen(o => !o)}>
        <span>API exchange (transparency)</span>
        <span className="chev"><Icon.Chev /></span>
      </button>
      {open && (
        <>
          <div className="tabs">
            <button className={tab==='request'?'active':''} onClick={() => setTab('request')}>Request →</button>
            <button className={tab==='response'?'active':''} onClick={() => setTab('response')}>← Response</button>
          </div>
          <pre>{data ? JSON.stringify(data, null, 2) : `// ${tab === 'request' ? 'Will appear when you click Pay' : 'Awaiting response…'}`}</pre>
        </>
      )}
    </div>
  );
}

/* ============== TWEAKS ============== */
function GaiaTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection title="Merchant">
        <TweakText label="Merchant name" value={tweaks.merchantName}
          onChange={(v) => setTweak({ merchantName: v, merchantInitial: (v[0] || 'A').toUpperCase() })} />
        <TweakText label="Line item" value={tweaks.lineItemName} onChange={(v) => setTweak('lineItemName', v)} />
        <TweakText label="Line item meta" value={tweaks.lineItemMeta} onChange={(v) => setTweak('lineItemMeta', v)} />
      </TweakSection>

      <TweakSection title="Customer (prefilled)">
        <TweakText label="First name" value={tweaks.customerFirstName} onChange={(v) => setTweak('customerFirstName', v)} />
        <TweakText label="Last name" value={tweaks.customerLastName} onChange={(v) => setTweak('customerLastName', v)} />
        <TweakText label="Email" value={tweaks.customerEmail} onChange={(v) => setTweak('customerEmail', v)} />
        <TweakText label="Phone" value={tweaks.customerPhone} onChange={(v) => setTweak('customerPhone', v)} />
        <TweakText label="Customer ID" value={tweaks.customerId} onChange={(v) => setTweak('customerId', v)} />
        <TweakText label="Country Code (ISO 3166-1 alpha-3)" value={tweaks.countryCode} onChange={(v) => setTweak('countryCode', v.toUpperCase())} />
      </TweakSection>

      <TweakSection title="Order">
        <TweakText label="Description" value={tweaks.description} onChange={(v) => setTweak('description', v)} />
        <TweakText label="Gateway reference ID" value={tweaks.gatewayReferenceId} onChange={(v) => setTweak('gatewayReferenceId', v)} />
        <TweakText label="payment_page_client_id" value={tweaks.paymentPageClientId} onChange={(v) => setTweak('paymentPageClientId', v)} />
      </TweakSection>

      <TweakSection title="Demo behaviour">
        <TweakToggle label="Open Hypercheckout in iframe (stay on page)" value={tweaks.iframeMode}
          onChange={(v) => setTweak('iframeMode', v)} />
        <TweakToggle label="Show payload panel open" value={tweaks.showPayloadByDefault}
          onChange={(v) => setTweak('showPayloadByDefault', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

/* ============== MAIN APP ============== */
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [amount, setAmount] = useState('49.99');
  const [currency, setCurrency] = useState('GBP');
  const [orderId] = useState(() => `gaia_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36).slice(-4)}`.slice(0, 21));

  const [stage, setStage] = useState('created');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  // API call log — captures every backend / Juspay round-trip so the demo is fully transparent
  const [logs, setLogs] = useState([]);
  const logCall = useCallback((entry) => {
    const id = Math.random().toString(36).slice(2);
    const log = {
      id,
      timestamp: new Date().toLocaleTimeString(),
      method: entry.method,
      endpoint: entry.endpoint,
      status: entry.status ?? 'pending',
      request: entry.request,
      response: entry.response ?? null,
    };
    setLogs(l => [...l, log]);
    return id;
  }, []);
  const updateLog = useCallback((id, patch) => {
    setLogs(l => l.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);

  // Iframe payment view (vueling-style — keeps the customer in our shell)
  const [paymentUrl, setPaymentUrl] = useState('');
  const [view, setView] = useState('checkout'); // 'checkout' | 'payment' | 'failure'
  const [failureDetails, setFailureDetails] = useState({ status: '', code: '', message: '' });

  const requestPayload = useMemo(() => ({
    order_id: orderId,
    amount: parseFloat(amount || '0').toFixed(2),
    first_name: tweaks.customerFirstName,
    last_name: tweaks.customerLastName,
    customer_id: tweaks.customerId,
    customer_email: tweaks.customerEmail,
    customer_phone: tweaks.customerPhone,
    billing_address_country_code_iso: tweaks.countryCode || 'GBR',
    action: 'paymentPage',
    currency,
    description: tweaks.description,
    payment_page_client_id: tweaks.paymentPageClientId || 'picasso',
    return_url: typeof window !== 'undefined' ? `${window.location.origin}/return` : 'https://your-app.onrender.com/return',
    'metadata.JUSPAY:gateway_reference_id': tweaks.gatewayReferenceId,
  }), [orderId, amount, currency, tweaks]);

  const presets = [10, 25, 50, 100];

  async function handleCheckout() {
    setLoading(true);
    setFailed(false);
    setError(null);
    setStage('session');

    try {
      // Backend reads the Juspay API key from apiKey.txt / env var; the
      // frontend only forwards the per-request client ID.
      const headers = { 'Content-Type': 'application/json' };
      if (tweaks.paymentPageClientId) headers['x-juspay-client-id'] = tweaks.paymentPageClientId;

      const logId = logCall({
        method: 'POST',
        endpoint: 'POST /api/create-session → sandbox.juspay.in/session',
        request: requestPayload,
      });

      const r = await fetch('/api/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          currency,
          first_name: tweaks.customerFirstName,
          last_name: tweaks.customerLastName,
          customer_id: tweaks.customerId,
          customer_email: tweaks.customerEmail,
          customer_phone: tweaks.customerPhone,
          country_code: tweaks.countryCode || 'GBR',
          description: tweaks.description,
          gateway_reference_id: tweaks.gatewayReferenceId,
          payment_page_client_id: tweaks.paymentPageClientId,
        }),
      });
      const data = await r.json();
      updateLog(logId, { status: r.status, response: data });
      setResponse(data);
      if (!r.ok || !data.payment_links?.web) {
        const msg = data?.details?.error_info?.user_message || data?.details?.error_message || data?.error || 'Failed to create session';
        setFailureDetails({
          status: data?.error || 'SESSION_FAILED',
          code: r.status,
          message: msg,
        });
        throw new Error(msg);
      }
      setStage('redirect');
      await new Promise(res => setTimeout(res, 700));
      if (tweaks.iframeMode) {
        setPaymentUrl(data.payment_links.web);
        setView('payment');
        setLoading(false);
      } else {
        window.location.href = data.payment_links.web;
      }
    } catch (e) {
      console.error(e);
      setFailed(true);
      const msg = e.message || String(e);
      const friendly = msg === 'Failed to fetch'
        ? "Couldn't reach the backend. Deploy to Render or run `npm start` locally."
        : msg;
      setError(friendly);
      if (msg !== 'Failed to fetch') {
        if (!failureDetails.message) {
          setFailureDetails({ status: 'SESSION_FAILED', code: 'ERR', message: friendly });
        }
        setView('failure');
      }
      setLoading(false);
    }
  }

  const sym = currencySymbol(currency);
  const subtotal = parseFloat(amount || '0') || 0;
  const fee = 0;
  const total = subtotal + fee;

  // Iframe payment view — keeps the user in our shell while Juspay handles the page
  if (view === 'payment') {
    return (
      <div className="iframe-shell">
        <div className="iframe-topbar">
          <div className="brand">
            <div className="merchant-logo">{tweaks.merchantInitial}</div>
            <span>{tweaks.merchantName}</span>
            <span className="sep">·</span>
            <span className="secured"><Icon.Lock size={12} /> Secured by Juspay</span>
          </div>
          <button className="cancel" onClick={() => { setView('checkout'); setPaymentUrl(''); setStage('created'); }}>
            <Icon.X size={14} /> Cancel payment
          </button>
        </div>
        <iframe src={paymentUrl} className="payment-iframe" title="Juspay Hypercheckout" />
      </div>
    );
  }

  // Failure overlay — shown when /create-session fails outright
  if (view === 'failure') {
    return (
      <div className="failure-screen">
        <div className="failure-card">
          <div className="failure-icon">✕</div>
          <h1>Session couldn't be created</h1>
          <p className="desc">Juspay rejected the request before the customer could pay. No money has been charged.</p>
          <div className="failure-detail">
            <div className="row"><span className="k">Status</span><span className="v">{failureDetails.status || '—'}</span></div>
            <div className="row"><span className="k">Code</span><span className="v">{failureDetails.code || '—'}</span></div>
            <div className="row full"><span className="k">Message</span><span className="v">{failureDetails.message || '—'}</span></div>
          </div>
          <div className="actions">
            <button className="btn" onClick={() => { setView('checkout'); setStage('created'); setFailed(false); setError(null); }}>Back to checkout</button>
          </div>
          <ApiLogsCard logs={logs} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-shell">
        {/* Top nav */}
        <div className="top-nav">
          <div className="merchant">
            <div className="merchant-logo">{tweaks.merchantInitial}</div>
            <span>{tweaks.merchantName}</span>
          </div>
          <div className="right">
            <div className="secure">
              <Icon.Lock size={14} />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="checkout">
          {/* Left: form */}
          <div className="col-left">
            <div className="eyebrow">Checkout · Order {orderId.slice(0, 12)}…</div>
            <h1 className="h1">Complete your payment</h1>
            <p className="subtle">
              Enter the amount and currency. We'll create a Juspay session and redirect you to GAIA's
              hosted Hypercheckout page where you can pay via card, bank, or any local PPRO method.
            </p>

            {/* Amount block */}
            <div className="section-title"><span className="num">1</span>Amount</div>
            <div className="amount-block">
              <div className="amount-label">You're paying</div>
              <div className="amount-row">
                <select className="currency-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {PPRO_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <input
                  className="amount-input"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '');
                    setAmount(v);
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="preset-chips">
                {presets.map(p => (
                  <button
                    key={p}
                    className={parseFloat(amount) === p ? 'active' : ''}
                    onClick={() => setAmount(p.toFixed(2))}
                    type="button"
                  >
                    {sym}{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Order details */}
            <div className="section-title"><span className="num">2</span>Order details</div>
            <div className="field-grid">
              <div className="field full">
                <label>Description / reference</label>
                <input value={tweaks.description} onChange={(e) => setTweak('description', e.target.value)} />
              </div>
              <div className="field">
                <label>Order ID (auto)</label>
                <input value={orderId} readOnly style={{background:'var(--ink-50)', color:'var(--ink-500)'}} />
              </div>
              <div className="field">
                <label>Gateway reference</label>
                <input value={tweaks.gatewayReferenceId} onChange={(e) => setTweak('gatewayReferenceId', e.target.value)} />
              </div>
              <div className="field full">
                <label>Payment page client ID</label>
                <input value={tweaks.paymentPageClientId} onChange={(e) => setTweak('paymentPageClientId', e.target.value)} placeholder="picasso" />
              </div>
            </div>

            {/* Customer */}
            <div className="section-title"><span className="num">3</span>Customer</div>
            <div className="field-grid">
              <div className="field">
                <label>First name</label>
                <input value={tweaks.customerFirstName} onChange={(e) => setTweak('customerFirstName', e.target.value)} />
              </div>
              <div className="field">
                <label>Last name</label>
                <input value={tweaks.customerLastName} onChange={(e) => setTweak('customerLastName', e.target.value)} />
              </div>
              <div className="field full">
                <label>Email</label>
                <input value={tweaks.customerEmail} onChange={(e) => setTweak('customerEmail', e.target.value)} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={tweaks.customerPhone} onChange={(e) => setTweak('customerPhone', e.target.value)} />
              </div>
              <div className="field">
                <label>Customer ID</label>
                <input value={tweaks.customerId} onChange={(e) => setTweak('customerId', e.target.value)} />
              </div>
              <div className="field">
                <label>Country Code (ISO 3166-1 alpha-3)</label>
                <input value={tweaks.countryCode} onChange={(e) => setTweak('countryCode', e.target.value.toUpperCase())} placeholder="e.g., CHN, USA, GBR" maxLength={3} />
              </div>
            </div>

            {/* CTA */}
            <button className="cta" onClick={handleCheckout} disabled={loading || !amount}>
              {loading ? (
                <>
                  <span className="spinner" /> Creating Juspay session…
                </>
              ) : (
                <>
                  <Icon.Lock size={16} />
                  Pay {sym}{(subtotal || 0).toFixed(2)} {currency}
                  <Icon.ArrowRight size={18} />
                </>
              )}
            </button>

            {error && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: 'var(--danger-bg)', color: 'var(--danger)',
                borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <div className="legal">
              By continuing you accept Acme Goods' <a href="#">Terms</a> and acknowledge GAIA's
              {' '}<a href="#">Privacy Policy</a>. Your payment is processed by Juspay on behalf of Barclayyard.
            </div>
          </div>

          {/* Right: order summary + GAIA badge + timeline + payload */}
          <div className="col-right">
            <div className="summary-card">
              <h3>Order summary</h3>
              <div className="line-item">
                <div className="thumb">
                  {tweaks.showItemImage ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" />
                    </svg>
                  ) : '#'}
                </div>
                <div>
                  <div className="name">{tweaks.lineItemName}</div>
                  <div className="meta">{tweaks.lineItemMeta}</div>
                </div>
                <div className="price">{sym}{subtotal.toFixed(2)}</div>
              </div>
              <div className="totals">
                <div className="row muted"><span>Subtotal</span><span className="v">{sym}{subtotal.toFixed(2)}</span></div>
                <div className="row muted"><span>Processing fee</span><span className="v">{sym}{fee.toFixed(2)}</span></div>
                <div className="row grand"><span>Total</span><span className="v">{sym}{total.toFixed(2)} {currency}</span></div>
              </div>
            </div>

            <PoweredByGAIA />

            <Timeline stage={stage} failed={failed} />

            <ApiLogsCard logs={logs} />

            <PayloadCard
              openDefault={tweaks.showPayloadByDefault}
              request={requestPayload}
              response={response}
            />
          </div>
        </div>
      </div>

      <GaiaTweaks tweaks={tweaks} setTweak={setTweak} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
