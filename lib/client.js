/* eslint-disable */
// dsh-strata-ai-center — client side (DSH Web Client, __ModuleLoader__ 闭包工厂)
// 面板数据全部来自插件 host 端 /__dsh-strata-ai-center/status，其数值取自本机 Strata
// 引擎的真实端点 (/health /v1/status /v1/telemetry /metrics) 与真实文件，无演示数据。
(function () {
  var PKG_ID = 'dsh-strata-ai-center';
  var PANEL_ID = 'strata-ai-center';
  var API_BASE = '/__dsh-strata-ai-center';

  function createPlugin(requireFn) {
    var React = requireFn('react');
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useMemo = React.useMemo;

    var STYLE_ID = 'dsh-strata-ai-center-styles';
    var CSS_TEXT = [
      '[data-plugin="dsh-strata-ai-center"].sac-sidebar-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; color: inherit; position: relative; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-status-dot { position: absolute; right: -2px; bottom: -2px; width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 1.5px #ffffff; }',
      '[data-plugin="dsh-strata-ai-center"].sac-root { box-sizing: border-box; height: 100%; width: 100%; overflow-y: auto; padding: calc(var(--dsh-frame-top-clearance, 24px) + 8px) 28px 36px 28px; background: #f8fafc; color: #0f172a; font-family: var(--dsh-font-family-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif); font-size: 13px; line-height: 1.5; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-container { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-title-row { display: flex; align-items: center; gap: 12px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-brand-badge { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; box-shadow: 0 4px 12px rgba(37,99,235,0.22); }',
      '[data-plugin="dsh-strata-ai-center"] .sac-title { font-size: 18px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 10px; color: #0f172a; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; word-break: break-all; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 500; border: 1px solid #cbd5e1; background: #f1f5f9; color: #475569; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-pill.online { color: #047857; border-color: #a7f3d0; background: #ecfdf5; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-pill.stopped { color: #64748b; border-color: #e2e8f0; background: #f1f5f9; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-pill.warning { color: #b45309; border-color: #fde68a; background: #fffbeb; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-pill.danger { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-tabs { display: inline-flex; background: #eef2f6; padding: 4px; border-radius: 10px; border: 1px solid #e2e8f0; gap: 4px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-tab-btn { border: none; background: transparent; color: #475569; padding: 6px 16px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; transition: all 0.15s ease; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-tab-btn:hover { color: #0f172a; background: rgba(255,255,255,0.65); }',
      '[data-plugin="dsh-strata-ai-center"] .sac-tab-btn.active { background: #ffffff; color: #2563eb; font-weight: 600; box-shadow: 0 1px 3px rgba(15,23,42,0.08); }',
      '[data-plugin="dsh-strata-ai-center"] .sac-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn { border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; padding: 7px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn:hover:not(:disabled) { border-color: #94a3b8; background: #f8fafc; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn:disabled { opacity: 0.5; cursor: not-allowed; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn.primary { background: #2563eb; border-color: #2563eb; color: #ffffff; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn.primary:hover:not(:disabled) { background: #1d4ed8; border-color: #1d4ed8; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn.success { background: #059669; border-color: #059669; color: #ffffff; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn.success:hover:not(:disabled) { background: #047857; border-color: #047857; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn.danger { background: #fef2f2; border-color: #fecaca; color: #dc2626; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-btn.danger:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 16px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-models-layout { display: grid; grid-template-columns: 1.15fr 1fr; gap: 18px; align-items: start; }',
      '@media (max-width: 960px) { [data-plugin="dsh-strata-ai-center"] .sac-models-layout { grid-template-columns: 1fr; } }',
      '[data-plugin="dsh-strata-ai-center"] .sac-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); }',
      '[data-plugin="dsh-strata-ai-center"] .sac-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-card-title { font-size: 13.5px; font-weight: 600; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-metric-big { font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; font-variant-numeric: tabular-nums; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-metric-unit { font-size: 12px; font-weight: 400; color: #64748b; margin-left: 4px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-progress-track { width: 100%; height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; position: relative; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-progress-fill { height: 100%; border-radius: 999px; transition: width 0.25s ease; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-kv-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; gap: 10px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-kv-val { color: #1e293b; font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; word-break: break-all; }',
      '[data-plugin="dsh-strata-ai-center"] code.sac-kv-val { background: #f1f5f9; padding: 2px 6px; border-radius: 5px; border: 1px solid #e2e8f0; color: #0f172a; font-size: 11.5px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-tier-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }',
      '@media (max-width: 820px) { [data-plugin="dsh-strata-ai-center"] .sac-tier-grid { grid-template-columns: repeat(2, 1fr); } }',
      '[data-plugin="dsh-strata-ai-center"] .sac-tier-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-family-title { font-size: 12px; font-weight: 600; color: #2563eb; margin: 8px 0 0 0; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-model-list { display: flex; flex-direction: column; gap: 10px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-model-item { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; gap: 6px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-model-item:hover { border-color: #93c5fd; background: #f0f7ff; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-model-item.selected { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 1px rgba(37,99,235,0.25); }',
      '[data-plugin="dsh-strata-ai-center"] .sac-model-item.unlaunchable { opacity: 0.75; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }',
      '@media (max-width: 700px) { [data-plugin="dsh-strata-ai-center"] .sac-form-grid { grid-template-columns: 1fr; } }',
      '[data-plugin="dsh-strata-ai-center"] .sac-field { display: flex; flex-direction: column; gap: 5px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-field.full { grid-column: 1 / -1; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-label { font-size: 12px; font-weight: 500; color: #475569; display: flex; justify-content: space-between; gap: 8px; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-input, [data-plugin="dsh-strata-ai-center"] .sac-select { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 7px; padding: 7px 10px; color: #0f172a; font-size: 12.5px; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s ease, box-shadow 0.15s ease; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-input:focus, [data-plugin="dsh-strata-ai-center"] .sac-select:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.12); }',
      '[data-plugin="dsh-strata-ai-center"] .sac-log-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px 12px; font-family: var(--dsh-font-family-code, Consolas, "JetBrains Mono", monospace); font-size: 11.5px; color: #cbd5e1; max-height: 240px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; line-height: 1.45; }',
      '[data-plugin="dsh-strata-ai-center"] .sac-toast { padding: 9px 14px; border-radius: 8px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }'
    ].join('\n');

    function ensureStyles() {
      if (typeof document === 'undefined') return;
      var styleEl = document.getElementById(STYLE_ID);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        document.head.appendChild(styleEl);
      }
      if (styleEl.textContent !== CSS_TEXT) {
        styleEl.textContent = CSS_TEXT;
      }
    }

    // 将「AI管理中心」固定在左侧栏「记忆系统」正下方
    // v2.5.7⑤：全局 body 观察器只作兜底（防抖 400ms，避免聊天流式 DOM 高频触发整页查询）；
    // 侧栏列表容器一旦定位到就挂专用观察器，只盯那个列表，顺序维护即时且廉价
    var pinDebounceTimer = null;
    function schedulePin(delayMs) {
      if (pinDebounceTimer) return;
      pinDebounceTimer = setTimeout(function () {
        pinDebounceTimer = null;
        pinBelowMemorySystemInSidebar();
      }, delayMs == null ? 400 : delayMs);
    }

    function pinBelowMemorySystemInSidebar() {
      if (typeof document === 'undefined') return;
      try {
        var buttons = Array.from(document.querySelectorAll('button, [role="button"], [data-dsh-part="sidebar-entry"]'));
        var memoryBtn = null;
        var ourBtn = null;
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          var txt = (btn.textContent || btn.getAttribute('aria-label') || '').trim();
          if (txt.indexOf('记忆系统') !== -1 || txt.indexOf('Memory System') !== -1) {
            memoryBtn = btn;
          }
          if (txt.indexOf('AI管理中心') !== -1 || txt.indexOf('AI Management Center') !== -1) {
            ourBtn = btn;
          }
        }
        if (memoryBtn && ourBtn && memoryBtn.parentElement && memoryBtn.parentElement === ourBtn.parentElement) {
          if (memoryBtn.nextElementSibling !== ourBtn) {
            memoryBtn.parentElement.insertBefore(ourBtn, memoryBtn.nextElementSibling);
          }
          if (typeof MutationObserver !== 'undefined' && !pinBelowMemorySystemInSidebar.sidebarObs && memoryBtn.parentElement.isConnected) {
            pinBelowMemorySystemInSidebar.sidebarObs = new MutationObserver(function () {
              pinBelowMemorySystemInSidebar();
            });
            pinBelowMemorySystemInSidebar.sidebarObs.observe(memoryBtn.parentElement, { childList: true });
          }
        }
      } catch (_e) {}
    }

    function SidebarEntryIcon() {
      useEffect(function () {
        ensureStyles();
        var timer = setTimeout(pinBelowMemorySystemInSidebar, 120);
        return function () {
          clearTimeout(timer);
        };
      }, []);

      return h(
        'span',
        { className: 'sac-sidebar-icon', 'data-plugin': PKG_ID, title: 'AI管理中心 (Strata)' },
        h(
          'svg',
          { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' },
          h('rect', { x: 4, y: 4, width: 16, height: 16, rx: 3 }),
          h('rect', { x: 9, y: 9, width: 6, height: 6, rx: 1 }),
          h('path', { d: 'M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3' })
        )
      );
    }

    function SparklineChart(props) {
      var data = props.data || [];
      var color = props.color || '#2563eb';
      var maxVal = props.max || 100;
      if (data.length < 2) {
        return h('div', { style: { height: 46, fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center' } }, '暂无采样（引擎空闲或未运行）');
      }
      var width = 260;
      var height = 46;
      var pts = data
        .map(function (v, idx) {
          var x = (idx / Math.max(1, data.length - 1)) * width;
          var y = height - Math.min(height - 4, Math.max(4, (v / maxVal) * (height - 8)));
          return x.toFixed(1) + ',' + y.toFixed(1);
        })
        .join(' ');
      return h(
        'svg',
        { width: '100%', height: height, viewBox: '0 0 ' + width + ' ' + height, preserveAspectRatio: 'none' },
        h('polyline', { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', points: pts })
      );
    }

    function fmtUptime(s) {
      if (s == null) return '—';
      var h_ = Math.floor(s / 3600);
      var m = Math.floor((s % 3600) / 60);
      return (h_ > 0 ? h_ + ' 时 ' : '') + m + ' 分';
    }

    function StrataAiCenterPanel(props) {
      var _tab = useState('monitor');
      var activeTab = _tab[0];
      var setActiveTab = _tab[1];

      var _status = useState(null);
      var status = _status[0];
      var setStatus = _status[1];

      var _form = useState(null);
      var form = _form[0];
      var setForm = _form[1];

      var _busy = useState(false);
      var busy = _busy[0];
      var setBusy = _busy[1];

      var _toast = useState('');
      var toast = _toast[0];
      var setToast = _toast[1];

      var _tokHistory = useState([]);
      var tokHistory = _tokHistory[0];
      var setTokHistory = _tokHistory[1];

      var _updReport = useState(null);
      var updReport = _updReport[0];
      var setUpdReport = _updReport[1];

      var _updChecking = useState(false);
      var updChecking = _updChecking[0];
      var setUpdChecking = _updChecking[1];

      var _updStatus = useState(null);
      var updStatus = _updStatus[0];
      var setUpdStatus = _updStatus[1];

      var _updRunning = useState(false);
      var updRunning = _updRunning[0];
      var setUpdRunning = _updRunning[1];

      var _updForce = useState(false);
      var updForce = _updForce[0];
      var setUpdForce = _updForce[1];

      var _newEnvKey = useState('');
      var newEnvKey = _newEnvKey[0];
      var setNewEnvKey = _newEnvKey[1];
      var _newEnvValue = useState('');
      var newEnvValue = _newEnvValue[0];
      var setNewEnvValue = _newEnvValue[1];

      // 模型目录：「全部模型」折叠开关（默认只显示已安装）
      var _modelsOpen = useState(false);
      var modelsOpen = _modelsOpen[0];
      var setModelsOpen = _modelsOpen[1];

      var formInitializedRef = useRef(false);
      var lastInstallStateRef = useRef(null);
      var lastTokRef = useRef(null);

      function showNotice(msg) {
        setToast(msg);
        setTimeout(function () {
          setToast(function (cur) {
            return cur === msg ? '' : cur;
          });
        }, 6000);
      }

      function fetchStatus() {
        fetch(API_BASE + '/status')
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            if (data && data.ok) {
              setStatus(data);
              // 模型下载安装任务的完成/失败提醒（对比上一轮轮询状态）
              var mi = data.modelInstall;
              var prevMi = lastInstallStateRef.current;
              lastInstallStateRef.current = mi;
              if (prevMi && prevMi.running && mi && !mi.running) {
                showNotice(
                  mi.ok
                    ? '✅ ' + mi.label + ' 下载安装完成，模型已可用'
                    : '❌ ' + mi.label + ' 下载安装未完成（退出码 ' + mi.exitCode + (mi.error ? '，' + mi.error : '') + '）；setup 支持断点续传，可再次点击继续'
                );
              }
              if (!formInitializedRef.current && data.settings) {
                formInitializedRef.current = true;
                setForm(data.settings);
              }
              // 只有拿到真实速度时才记录采样点
              var tok = data.engine && data.engine.decodeTokPerSec;
              if (typeof tok === 'number' && tok > 0 && tok !== lastTokRef.current) {
                lastTokRef.current = tok;
                setTokHistory(function (prev) {
                  return prev.slice(-19).concat([+tok.toFixed(1)]);
                });
              }
            }
          })
          .catch(function () {});
      }

      useEffect(function () {
        ensureStyles();
        pinBelowMemorySystemInSidebar();
        fetchStatus();
        var interval = setInterval(function () {
          if (typeof document === 'undefined' || document.visibilityState !== 'hidden') fetchStatus();
        }, 2500);
        return function () {
          clearInterval(interval);
        };
      }, []);

      function fetchUpdateStatus() {
        fetch(API_BASE + '/update/status')
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            if (data && data.ok) {
              setUpdStatus(data);
              setUpdRunning(Boolean(data.running));
            }
          })
          .catch(function () {});
      }

      // 升级页打开或后台升级进行中时，轮询升级任务状态
      useEffect(
        function () {
          if (activeTab !== 'update' && !updRunning) return;
          fetchUpdateStatus();
          var interval = setInterval(function () {
            if (typeof document === 'undefined' || document.visibilityState !== 'hidden') fetchUpdateStatus();
          }, 3000);
          return function () {
            clearInterval(interval);
          };
        },
        [activeTab, updRunning]
      );

      function updateField(key, value) {
        setForm(function (prev) {
          var next = Object.assign({}, prev || {}, {});
          next[key] = value;
          return next;
        });
      }

      // 引擎环境变量 (STRATA_*) 的编辑：值留空保存时由 host 端删除该变量
      function setEnvEntry(key, value) {
        var env = Object.assign({}, activeSettings.engineEnv || {});
        env[key] = value;
        updateField('engineEnv', env);
      }
      function removeEnvEntry(key) {
        var env = Object.assign({}, activeSettings.engineEnv || {});
        delete env[key];
        updateField('engineEnv', env);
      }
      function addEnvEntryFromInputs() {
        var k = (newEnvKey || '').trim();
        var v = (newEnvValue || '').trim();
        if (!k) {
          showNotice('请填写变量名，例如 STRATA_ROUTE_TAIL_SKIP');
          return;
        }
        setEnvEntry(k, v);
        setNewEnvKey('');
        setNewEnvValue('');
      }

      function postJson(path, body) {
        return fetch(API_BASE + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {})
        }).then(function (r) {
          return r.json();
        });
      }

      function handleSaveSettings() {
        if (!form) return;
        setBusy(true);
        postJson('/settings', form)
          .then(function (resp) {
            setBusy(false);
            showNotice(resp.message || '参数已保存');
            fetchStatus();
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('保存失败: ' + err.message);
          });
      }

      function handleStartEngine() {
        if (!form) return;
        var onlineNow = Boolean(status && status.engine && status.engine.online);
        setBusy(true);
        showNotice(onlineNow ? '正在按新参数重启 Strata 引擎 (--restart)...' : '正在通过 strata launch 启动引擎...');
        postJson('/engine/start', form)
          .then(function (resp) {
            setBusy(false);
            if (resp && resp.ok) {
              showNotice('已执行: ' + (resp.command || resp.launchedMode) + '（加载需数十秒，可在日志区查看进度）');
            } else {
              showNotice('启动失败: ' + ((resp && resp.error) || '未知错误'));
            }
            setTimeout(fetchStatus, 1500);
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('请求异常: ' + err.message);
          });
      }

      function handleStopEngine() {
        setBusy(true);
        showNotice('正在停止服务 (strata launch --stop)，将卸载模型并释放显存...');
        postJson('/engine/stop', {})
          .then(function (resp) {
            setBusy(false);
            if (resp && resp.ok) {
              showNotice('停止指令已完成');
            } else {
              showNotice('停止失败: ' + ((resp && resp.error) || '').slice(0, 160));
            }
            setTimeout(fetchStatus, 1500);
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('请求异常: ' + err.message);
          });
      }

      function handleUnload() {
        setBusy(true);
        showNotice('正在向引擎发送 /unload（在请求间隙释放显存）...');
        postJson('/engine/unload', {})
          .then(function (resp) {
            setBusy(false);
            showNotice(resp && resp.ok ? '模型已卸载，显存已释放（下次请求会自动重新加载）' : '卸载未完成: ' + ((resp && resp.error) || ''));
            fetchStatus();
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('请求异常: ' + err.message);
          });
      }

      function handleLaunchStatus() {
        setBusy(true);
        fetch(API_BASE + '/launch-status')
          .then(function (r) {
            return r.json();
          })
          .then(function (resp) {
            setBusy(false);
            var running = resp && resp.data && resp.data.running;
            if (running && running.length > 0) {
              var r0 = running[0];
              showNotice('launch 实例: ' + r0.name + ' · ' + r0.state + ' · ' + r0.url + ' · 配置 ' + (r0.config || ''));
            } else {
              showNotice('strata launch 报告当前没有运行中的实例');
            }
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('查询失败: ' + err.message);
          });
      }

      function handleCopyDiagnose() {
        showNotice('正在生成诊断信息...');
        fetch(API_BASE + '/diagnose')
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            var text = JSON.stringify(data, null, 2);
            var done = function () {
              showNotice('诊断信息已复制（' + text.length + ' 字符），可粘贴给维护者');
            };
            if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(done, function () {
                showNotice('复制失败：' + text.slice(0, 300));
              });
            } else {
              showNotice('剪贴板不可用：' + text.slice(0, 300));
            }
          })
          .catch(function (err) {
            showNotice('诊断请求异常: ' + err.message);
          });
      }

      function handleOpenWeb() {
        postJson('/web/open', {})
          .then(function (resp) {
            showNotice(resp && resp.ok ? '已在浏览器打开 ' + resp.url : '打开失败: ' + ((resp && resp.error) || ''));
          })
          .catch(function (err) {
            showNotice('请求异常: ' + err.message);
          });
      }

      function handleRunBenchmark() {
        setBusy(true);
        showNotice('正在向本机引擎发送 64 token 基准请求...');
        postJson('/benchmark', {})
          .then(function (resp) {
            setBusy(false);
            if (resp && resp.ok) {
              showNotice(
                '测速结果: 解码 ' + resp.tokPerSec + ' tok/s' +
                  (resp.prefillTokPerSec ? ' · 预填充 ' + resp.prefillTokPerSec + ' tok/s' : '') +
                  ' · ' + resp.completionTokens + ' tokens / ' + resp.elapsedSec + 's'
              );
              fetchStatus();
            } else {
              showNotice('测速失败: ' + ((resp && resp.error) || '未知错误'));
            }
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('请求异常: ' + err.message);
          });
      }

      function handleUpdateCheck() {
        setUpdChecking(true);
        setUpdReport(null);
        showNotice('正在读取签名更新源 (strata update --check)，首次需联网约 10-60 秒...');
        fetch(API_BASE + '/update/check')
          .then(function (r) {
            return r.json();
          })
          .then(function (resp) {
            setUpdChecking(false);
            setUpdReport(resp);
            if (resp && resp.ok && resp.report) {
              var eng = resp.report.engine || {};
              showNotice(
                '检查完成: 引擎 ' + (eng.status === 'current' ? '已是最新 (' + ((eng.installed || {}).version || '?') + ')' : eng.status === 'available' ? '可升级 ' + ((eng.installed || {}).version || '?') + ' → ' + ((eng.offered || {}).version || '?') : eng.status) +
                  ' · Control ' + ((resp.report.control || {}).status || '?')
              );
            } else {
              showNotice('检查失败: ' + ((resp && (resp.error || resp.raw)) || '未知错误').toString().slice(0, 200));
            }
          })
          .catch(function (err) {
            setUpdChecking(false);
            showNotice('请求异常: ' + err.message);
          });
      }

      function handleUpdateApply() {
        if (updRunning) return;
        var okGo = typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('将执行 strata update：先停止正在服务的引擎，然后从签名源下载并校验组件，测试启动成功后才切换（旧版本保留、可回滚）。整个过程可能持续数分钟。继续？')
          : true;
        if (!okGo) return;
        setBusy(true);
        postJson('/update/apply', { stopFirst: true, force: updForce, feed: activeSettings.updateFeed })
          .then(function (resp) {
            setBusy(false);
            if (resp && resp.ok) {
              setUpdRunning(true);
              showNotice('升级任务已启动 (pid ' + resp.pid + ')，进度见下方日志；完成后请用「启动模型」重新启动引擎。');
              fetchUpdateStatus();
            } else {
              showNotice('启动升级失败: ' + ((resp && resp.error) || '未知错误'));
            }
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('请求异常: ' + err.message);
          });
      }

      function handleUpdateRollback() {
        if (updRunning) return;
        var okGo = typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('将执行 strata components rollback：停止服务并切回最近一次升级保留的旧引擎版本。继续？')
          : true;
        if (!okGo) return;
        setBusy(true);
        postJson('/update/rollback', { stopFirst: true })
          .then(function (resp) {
            setBusy(false);
            if (resp && resp.ok) {
              setUpdRunning(true);
              showNotice('回滚任务已启动，进度见下方日志。');
              fetchUpdateStatus();
            } else {
              showNotice('无法回滚: ' + ((resp && resp.error) || '未知错误'));
            }
          })
          .catch(function (err) {
            setBusy(false);
            showNotice('请求异常: ' + err.message);
          });
      }

      var engine = (status && status.engine) || {};
      var hw = (status && status.hardware) || { ram: { totalGb: 0, usedGb: 0 }, gpus: [], cpuCores: 0, cpuModel: '' };
      var installation = (status && status.installation) || {};
      var catalog = (status && status.catalog) || [];
      var activeSettings = form || (status && status.settings) || {};

      // ---- 监控页 ----
      function renderMonitorTab() {
        var gpu0 = (hw.gpus && hw.gpus[0]) || null;
        var ram = hw.ram || { totalGb: 0, usedGb: 0 };
        var ramPct = ram.totalGb > 0 ? Math.min(100, Math.round((ram.usedGb / ram.totalGb) * 100)) : 0;
        var vramPct = gpu0 && gpu0.vramTotalGb > 0 ? Math.min(100, Math.round((gpu0.vramUsedGb / gpu0.vramTotalGb) * 100)) : 0;
        var expertSlots = engine.expertSlots;
        var cachePct = expertSlots != null ? Math.min(100, Math.round((expertSlots / (engine.totalExperts || 24576)) * 100)) : 0;
        var selRunConfig = (installation.runConfigs || []).filter(function (r) {
          return r.modelId === (activeSettings.selectedModel || '');
        })[0];

        return h(
          React.Fragment,
          null,
          h(
            'div',
            { className: 'sac-grid-4' },
            // 1. 生成与预填充速度（来自最近一次请求的 timings / 实时速率）
            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '⚡ 回答生成与提示词读取速度'),
                h('span', { className: 'sac-pill ' + (engine.online ? 'online' : 'stopped') }, engine.online ? '实测值' : '引擎未运行')
              ),
              h(
                'div',
                null,
                h('span', { className: 'sac-metric-big' }, engine.decodeTokPerSec != null ? engine.decodeTokPerSec : '—', h('span', { className: 'sac-metric-unit' }, 'tokens/s (解码输出)'))
              ),
              h(SparklineChart, { data: tokHistory, color: '#2563eb', max: 130 }),
              h('div', { className: 'sac-kv-row' }, h('span', null, '读取提示词 (Prefill)'), h('span', { className: 'sac-kv-val' }, engine.prefillTokPerSec != null ? engine.prefillTokPerSec + ' tokens/s' : '—')),
              h(
                'div',
                { className: 'sac-kv-row' },
                h('span', null, 'MTP 投机采样接受率'),
                h('span', { className: 'sac-kv-val' }, engine.mtpAcceptRate != null ? Math.round(engine.mtpAcceptRate * 100) + '% (' + engine.mtpDraftAccepted + '/' + engine.mtpDraftN + ')' : '—')
              )
            ),

            // 2. 显卡状态（/v1/telemetry devices 实测）
            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '🎮 显卡状态 (GPU 0)'),
                gpu0 ? h('span', { className: 'sac-pill online' }, gpu0.tempC + '°C · ' + gpu0.powerW + 'W') : h('span', { className: 'sac-pill stopped' }, '未检测到')
              ),
              h('div', null, h('span', { className: 'sac-metric-big' }, gpu0 ? gpu0.vramUsedGb + ' / ' + gpu0.vramTotalGb : '—', h('span', { className: 'sac-metric-unit' }, 'GB 显存 (VRAM)'))),
              h('div', { className: 'sac-progress-track' }, h('div', { className: 'sac-progress-fill', style: { width: vramPct + '%', background: 'linear-gradient(90deg, #2563eb, #6366f1)' } })),
              h('div', { className: 'sac-kv-row' }, h('span', null, gpu0 ? gpu0.name : 'nvidia-smi / 遥测均不可用'), h('span', { className: 'sac-kv-val' }, gpu0 ? '核心负载 ' + gpu0.loadPercent + '%' : '')),
              h('div', { className: 'sac-kv-row' }, h('span', null, '引擎可用显存余量'), h('span', { className: 'sac-kv-val' }, engine.vramFreeMib != null ? Math.round(engine.vramFreeMib / 1024 * 10) / 10 + ' GB' : '—'))
            ),

            // 3. 系统内存与处理器
            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '🧠 系统内存与处理器 (RAM / CPU)'),
                h('span', { className: 'sac-pill' }, (hw.cpuCores || 0) + ' 逻辑核心')
              ),
              h('div', null, h('span', { className: 'sac-metric-big' }, ram.usedGb + ' / ' + ram.totalGb, h('span', { className: 'sac-metric-unit' }, 'GB 内存'))),
              h('div', { className: 'sac-progress-track' }, h('div', { className: 'sac-progress-fill', style: { width: ramPct + '%', background: 'linear-gradient(90deg, #10b981, #059669)' } })),
              h('div', { className: 'sac-kv-row' }, h('span', null, '可用空闲内存'), h('span', { className: 'sac-kv-val' }, (ram.totalGb ? Math.round((ram.totalGb - ram.usedGb) * 10) / 10 : '—') + ' GB')),
              h('div', { className: 'sac-kv-row' }, h('span', null, '处理器'), h('span', { className: 'sac-kv-val', style: { maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, hw.cpuModel || '—'))
            ),

            // 4. 专家缓存与上下文（/metrics engine 块实测）
            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '📚 专家缓存与上下文 (MoE Cache)'),
                h('span', { className: 'sac-pill warning' }, '专家总量 24,576 (48 层 × 512)')
              ),
              h('div', null, h('span', { className: 'sac-metric-big' }, expertSlots != null ? expertSlots.toLocaleString() : '—', h('span', { className: 'sac-metric-unit' }, '个专家槽常驻显存'))),
              h('div', { className: 'sac-progress-track' }, h('div', { className: 'sac-progress-fill', style: { width: cachePct + '%', background: 'linear-gradient(90deg, #f59e0b, #ea580c)' } })),
              h('div', { className: 'sac-kv-row' }, h('span', null, '专家缓存占用'), h('span', { className: 'sac-kv-val' }, engine.expertCacheMib != null ? (Math.round(engine.expertCacheMib / 102.4) / 10) + ' GB' : '—')),
              h(
                'div',
                { className: 'sac-kv-row' },
                h('span', null, '上下文 / KV 格式 / 常驻'),
                h('span', { className: 'sac-kv-val' }, (engine.context ? Math.round(engine.context / 1024) + 'K' : '—') + ' · ' + String(engine.kv || activeSettings.kvFormat || '—').toUpperCase() + (engine.kvResident ? ' · 常驻 ' + Math.round(engine.kvResident / 1024) + 'K' : ''))
              )
            )
          ),

          // 四级分层状态（数字取自 /metrics）
          h(
            'div',
            { className: 'sac-card' },
            h(
              'div',
              { className: 'sac-card-header' },
              h('h3', { className: 'sac-card-title' }, '🏗️ Strata 四级异构推理分层状态'),
              h('span', { style: { fontSize: '12px', color: '#64748b' } }, '引擎 ' + (engine.version || '—') + ' · 已运行 ' + fmtUptime(engine.uptimeS) + ' · 服务请求数 ' + (engine.requests != null ? engine.requests : '—'))
            ),
            h(
              'div',
              { className: 'sac-tier-grid' },
              h(
                'div',
                { className: 'sac-tier-box' },
                h('div', { style: { fontWeight: 600, color: '#2563eb' } }, '1. 显卡 (VRAM 专家缓存)'),
                h('div', { style: { fontSize: '12px', color: '#475569' } }, (expertSlots != null ? expertSlots + ' 个专家槽' : '—') + (engine.expertCacheMib != null ? '，约 ' + (Math.round(engine.expertCacheMib / 102.4) / 10) + ' GB' : '') + '；KV 常驻 ' + (engine.kvResident ? Math.round(engine.kvResident / 1024) + 'K tokens' : '—') + '。')
              ),
              h(
                'div',
                { className: 'sac-tier-box' },
                h('div', { style: { fontWeight: 600, color: '#059669' } }, '2. 内存 (System RAM 专家池)'),
                h('div', { style: { fontSize: '12px', color: '#475569' } }, '未命中显存的专家权重驻留系统内存（当前内存占用 ' + ram.usedGb + ' / ' + ram.totalGb + ' GB），与显存热交换。')
              ),
              h(
                'div',
                { className: 'sac-tier-box' },
                h('div', { style: { fontWeight: 600, color: '#d97706' } }, '3. 处理器 (CPU / PCIe 协同)'),
                h('div', { style: { fontSize: '12px', color: '#475569' } }, (engine.poolWorkers ? engine.poolWorkers + ' 个 CPU 工作线程' : '—') + ' 分担专家计算，PCIe 份额 ' + (engine.pcieFrac != null ? engine.pcieFrac : '—') + '，MTP 草稿窗(生效) ' + (engine.spec || '—') + ' (min-p ' + (engine.specMinP != null ? engine.specMinP : '—') + ')。')
              ),
              h(
                'div',
                { className: 'sac-tier-box' },
                h('div', { style: { fontWeight: 600, color: '#7c3aed' } }, '4. 固态硬盘 (N-gram 表)'),
                h('div', { style: { fontSize: '12px', color: '#475569' } }, 'N-gram 查找表保存在 SSD 上按需读取，不占用内存配额（下载体积中已包含）。')
              )
            )
          ),

          // 服务地址与日志
          h(
            'div',
            { className: 'sac-grid-2' },
            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '🔌 本地服务地址与 API'),
                h('button', { className: 'sac-btn', onClick: handleRunBenchmark, disabled: busy }, '⚡ 运行速度基准测试')
              ),
              h('div', { className: 'sac-kv-row' }, h('span', null, 'OpenAI 兼容接口 (DSH / Codex / Open WebUI)'), h('code', { className: 'sac-kv-val' }, 'http://127.0.0.1:' + (activeSettings.enginePort || 8080) + '/v1')),
              h('div', { className: 'sac-kv-row' }, h('span', null, '已启用的方言 (dialects)'), h('code', { className: 'sac-kv-val' }, (engine.dialects || []).join(' · ') || '—')),
              h('div', { className: 'sac-kv-row' }, h('span', null, 'API 监控页 (/api-monitor)'), h('code', { className: 'sac-kv-val' }, activeSettings.apiMonitor ? 'http://127.0.0.1:' + (activeSettings.enginePort || 8080) + '/api-monitor' : '未开启（可在参数页开启 api_monitor）')),
              h('div', { className: 'sac-kv-row' }, h('span', null, 'Strata CLI'), h('code', { className: 'sac-kv-val' }, installation.cliPath || '—')),
              h('div', { className: 'sac-kv-row' }, h('span', null, '运行配置文件'), h('code', { className: 'sac-kv-val' }, selRunConfig ? selRunConfig.path : (installation.runConfigDir || '—') + '\\strata-' + (activeSettings.selectedModel || '') + '.json')),
              h('div', { className: 'sac-kv-row' }, h('span', null, 'launch 预设'), h('span', { className: 'sac-kv-val' }, ((installation.presets || []).map(function (p) { return p.name; }).join('、')) || '无'))
            ),

            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '📜 引擎日志（真实文件尾部）'),
                h(
                  'button',
                  { className: 'sac-btn', onClick: handleLaunchStatus, disabled: busy },
                  '🔎 launch 状态'
                )
              ),
              h(
                'div',
                { className: 'sac-log-box' },
                (status && status.logs && status.logs.engineLogPath ? '# 引擎日志: ' + status.logs.engineLogPath + '\n' + status.logs.engineLog.join('\n') + '\n\n' : '# 暂无引擎日志（%LOCALAPPDATA%\\Strata\\launch\\*.engine.log）\n') +
                  (status && status.logs && status.logs.launchLog && status.logs.launchLog.length ? '# 启动输出: ' + status.logs.launchLogPath + '\n' + status.logs.launchLog.join('\n') + '\n\n' : '') +
                  '# 插件动作日志\n' +
                  ((status && status.logs && status.logs.actions && status.logs.actions.join('\n')) || '（暂无）')
              )
            )
          )
        );
      }

      // ---- 模型页 ----
      function renderModelsTab() {
        var contexts = (status && status.contexts) || [8192, 32768, 65536, 131072, 204800, 262144, 393216, 524288];
        var selected = catalog.filter(function (m) { return m.id === activeSettings.selectedModel; })[0] || null;
        var fit = (selected && selected.fit) || null;
        var kvNow = selected ? selected.kvGb : null;
        var contextLabel = function (c) {
          return c >= 1024 ? Math.round(c / 1024) + 'K (' + c.toLocaleString() + ' tokens)' : c.toLocaleString() + ' tokens';
        };
        var cfgSrc = (status && status.settingsSources && status.settingsSources.runConfigFile) || {};
        var cfgFileName = String(cfgSrc.path || '').split('\\').pop().split('/').pop() || null;
        var srcPill = cfgFileName && cfgSrc.exists
          ? h('span', { className: 'sac-pill online', title: cfgSrc.path }, '读取自 ' + cfgFileName)
          : h('span', { className: 'sac-pill stopped' }, '读取自插件快照（配置文件缺失）');

        // 按家族分组
        var families = [];
        (catalog || []).forEach(function (item) {
          var g = families.filter(function (f) { return f.family === item.family; })[0];
          if (!g) {
            g = { family: item.family, familyTitle: item.familyTitle, sizes: [] };
            families.push(g);
          }
          g.sizes.push(item);
        });

        var vramTotalGb = (hw.gpus && hw.gpus[0] && hw.gpus[0].vramTotalGb) || 0;
        var vramEstPct = fit && vramTotalGb > 0 ? Math.min(100, Math.round((fit.vramUseGb / vramTotalGb) * 100)) : 0;
        var ramEstPct = fit && hw.ram && hw.ram.totalGb ? Math.min(100, Math.round((fit.ramUseGb / hw.ram.totalGb) * 100)) : 0;

        return h(
          'div',
          { className: 'sac-models-layout' },
          // 左列：真实模型目录（setup.py 模型表）。默认只显示已安装，其余折叠进「全部模型」
          h(
            'div',
            { className: 'sac-card' },
            h(
              'div',
              { className: 'sac-card-header' },
              h('h3', { className: 'sac-card-title' }, '📦 模型目录 (setup.py 模型表 · 已安装 ' + catalog.filter(function (m) { return m.installed; }).length + '/' + catalog.length + ')'),
              h('span', { style: { fontSize: 11.5, color: '#64748b' } }, '「下载并安装」= setup.py Control 模式（写入运行配置，不启动服务；支持断点续传）')
            ),
            // 下载安装任务进度条（进行中时显示）
            (function () {
              var mi = status && status.modelInstall;
              if (!mi || !mi.running) return null;
              var mins = mi.startedAt ? Math.max(1, Math.round((Date.now() - mi.startedAt) / 60000)) : 0;
              var lastLine = String(mi.tail || '').trim().split('\n').filter(Boolean).pop() || '';
              return h(
                'div',
                { style: { margin: '8px 0', padding: '8px 10px', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: 8, fontSize: 12, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                h('span', { style: { fontWeight: 600 } }, '⬇ ' + mi.label + ' 下载/安装中…（' + mins + ' 分钟）'),
                h('span', { style: { flex: 1, minWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#3b82f6' }, title: mi.tail || '' }, lastLine),
                h(
                  'button',
                  {
                    className: 'sac-btn',
                    style: { fontSize: 11, padding: '2px 10px' },
                    onClick: function (e) {
                      e.stopPropagation();
                      if (!window.confirm('取消当前的下载/安装任务？已下载的文件会保留，下次可断点续传。')) return;
                      postJson('/models/install-cancel', {}).then(function (r) {
                        if (!r.ok) showNotice('取消失败: ' + (r.error || '未知错误'));
                      }).catch(function () {});
                    }
                  },
                  '取消'
                )
              );
            })(),
            families
              .map(function (g) {
                var shown = modelsOpen ? g.sizes : g.sizes.filter(function (s) { return s.installed; });
                return shown.length ? { family: g.family, familyTitle: g.familyTitle, sizes: shown } : null;
              })
              .filter(Boolean)
              .map(function (g) {
                return h(
                  'div',
                  { key: g.family },
                  h('p', { className: 'sac-family-title' }, g.familyTitle),
                  h(
                    'div',
                    { className: 'sac-model-list' },
                    g.sizes.map(function (item) {
                      var isSelected = activeSettings.selectedModel === item.id;
                      var mi = status && status.modelInstall;
                      var isInstalling = mi && mi.running && mi.modelId === item.id;
                      return h(
                        'div',
                        {
                          key: item.id,
                          className: 'sac-model-item' + (isSelected ? ' selected' : '') + (item.launchable ? '' : ' unlaunchable'),
                          onClick: function () {
                            updateField('selectedModel', item.id);
                          }
                        },
                        h(
                          'div',
                          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                          h('div', { style: { fontWeight: 600, fontSize: '13px', color: '#0f172a' } }, item.model),
                          h(
                            'div',
                            { style: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' } },
                            item.installed
                              ? h('span', { className: 'sac-pill online' }, '已安装')
                              : item.launchable
                                ? h(
                                    'button',
                                    {
                                      className: 'sac-btn',
                                      style: { fontSize: 11.5, padding: '3px 10px' },
                                      disabled: isInstalling,
                                      onClick: function (e) {
                                        e.stopPropagation();
                                        if (isInstalling) return;
                                        if (!window.confirm('开始下载并安装 ' + item.title + '？\n\n将从 HuggingFace 下载约 ' + item.downloadGb + ' GB（断点续传），完成后自动写入运行配置（不启动服务）。')) return;
                                        postJson('/models/install', { id: item.id }).then(function (r) {
                                          if (r.ok) showNotice('⬇ 已开始下载并安装 ' + r.job.label);
                                          else showNotice('无法开始: ' + (r.error || '未知错误'));
                                        }).catch(function () { showNotice('请求失败'); });
                                      }
                                    },
                                    isInstalling ? '⏬ 下载/安装中…' : '⬇ 下载并安装 (~' + item.downloadGb + ' GB)'
                                  )
                                : h('span', { className: 'sac-pill stopped' }, '需专用包，终端安装'),
                            h('span', { className: 'sac-pill ' + (item.fitLevel === 'fits' ? 'online' : item.fitLevel === 'tight' ? 'warning' : 'danger') }, item.fitText)
                          )
                        ),
                        h('div', { style: { fontSize: 11.5, color: '#64748b' } }, item.about),
                        h(
                          'div',
                          { className: 'sac-kv-row', style: { marginTop: '2px' } },
                          h('span', null, (item.memTotal ? '内存需求 (VRAM+RAM 合计)' : '内存需求') + ': ' + item.memoryGb + ' GB' + (item.memTotal ? '' : ' (推荐整机 ' + item.ramNeededGb + ' GB)')),
                          h('span', null, '128K ' + String(activeSettings.kvFormat || 'int8').toUpperCase() + ' KV ≈ ' + item.kvGb + ' GB')
                        )
                      );
                    })
                  )
                );
              }),
            (function () {
              var pendingCount = catalog.filter(function (m) { return !m.installed; }).length;
              if (!modelsOpen && catalog.filter(function (m) { return m.installed; }).length === 0) {
                return h('div', { style: { fontSize: 12.5, color: '#64748b', padding: '10px 2px' } }, '尚未安装任何模型——展开「全部模型」选择一档开始下载安装。');
              }
              if (pendingCount === 0) return null;
              return h(
                'button',
                {
                  className: 'sac-btn',
                  style: { marginTop: 10, width: '100%' },
                  onClick: function () { setModelsOpen(!modelsOpen); }
                },
                modelsOpen ? '▲ 收起全部模型' : '▼ 全部模型（' + pendingCount + ' 个未安装，点击展开）'
              );
            })()
          ),

          // 右列：本机容量评估 + 参数
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
            // 与运行实例的差异提示（表单值来自 strata-<model>.json；运行中的引擎可能仍是旧值）
            (function () {
              var sources = (status && status.settingsSources) || {};
              var diffs = (status && status.liveDiffs) || [];
              if (sources.runConfigFile && !sources.runConfigFile.exists) {
                return h(
                  'div',
                  { style: { padding: '9px 12px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12 } },
                  '⚠ 未找到 ' + (sources.runConfigFile.path || 'strata-<model>.json') + '，表单显示的是插件快照；该文件会在下次 strata launch 时生成。'
                );
              }
              // v2.5.12：跨档案警告——运行实例实际加载的档案(GET /config file) vs 面板管理的档案
              var eng = (status && status.engine) || {};
              var profileWarn = eng.online && eng.configFileMatches === false
                ? h(
                    'div',
                    { style: { padding: '9px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12 } },
                    '⚠ 运行实例加载的档案是「' + (eng.configFile || '?') + '」，不是面板管理的「' + (eng.panelConfigFile || 'strata-<model>.json') + '」——面板的保存不会写进实例实际使用的档案。经面板「启动」会加载面板档案；若你用 Strata 自带启动器（预设）起实例，把面板模型 ID 改成该预设名，或直接编辑那个档案。'
                  )
                : null;
              if (diffs.length === 0) return profileWarn;
              var diffBanner = h(
                'div',
                { style: { padding: '9px 12px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12 } },
                '⚠ 配置文件与运行中的实例不一致（下方表单以配置文件为准，重启模型后生效）: ' +
                  diffs.map(function (d) {
                    return d.label + ' 配置 ' + d.configured + ' / 运行 ' + d.running;
                  }).join('；')
              );
              if (!profileWarn) return diffBanner;
              return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, profileWarn, diffBanner);
            })(),
            // 本机容量评估（setup.py fitOn 规则实时计算）
            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '💻 这台电脑容量评估 (setup.py fitOn 规则)'),
                h('span', { className: 'sac-pill ' + (selected && selected.fitLevel === 'fits' ? 'online' : selected && selected.fitLevel === 'tight' ? 'warning' : 'danger') }, selected ? selected.fitText : '—')
              ),
              fit && fit.known
                ? h(
                    React.Fragment,
                    null,
                    h('div', { className: 'sac-kv-row' }, h('span', null, '模型内存需求 (memoryGb)'), h('span', { className: 'sac-kv-val' }, fit.memoryGb + ' GB')),
                    h('div', { className: 'sac-kv-row' }, h('span', null, '其中上显存 (vramUse)'), h('span', { className: 'sac-kv-val' }, fit.vramUseGb + ' GB')),
                    h('div', { className: 'sac-progress-track' }, h('div', { className: 'sac-progress-fill', style: { width: vramEstPct + '%', background: '#2563eb' } })),
                    h('div', { className: 'sac-kv-row' }, h('span', null, '其中进内存 (ramUse)'), h('span', { className: 'sac-kv-val' }, fit.ramUseGb + ' GB / 可用约 ' + (hw.ram && hw.ram.totalGb ? Math.round((hw.ram.totalGb - 10) * 10) / 10 : '—') + ' GB (留 10 GB 给系统)')),
                    h('div', { className: 'sac-progress-track' }, h('div', { className: 'sac-progress-fill', style: { width: ramEstPct + '%', background: '#10b981' } })),
                    h('div', { className: 'sac-kv-row' }, h('span', null, 'SSD 溢出部分 (spill)'), h('span', { className: 'sac-kv-val' }, fit.spillGb + ' GB' + (fit.spillGb > 0 ? '（从固态读取，变慢）' : '（无）'))),
                    h('div', { className: 'sac-kv-row' }, h('span', null, '当前上下文 KV 预估'), h('span', { className: 'sac-kv-val' }, kvNow != null ? kvNow + ' GB (' + String(activeSettings.kvFormat || 'int8').toUpperCase() + ')' : '—'))
                  )
                : h('div', { style: { fontSize: 12, color: '#64748b' } }, '未读取到本机内存/显存信息，无法评估。')
            ),

            // 引擎参数（全部映射到 strata launch 真实旗标）
            h(
              'div',
              { className: 'sac-card' },
              h('div', { className: 'sac-card-header' }, h('h3', { className: 'sac-card-title' }, '⚙️ 引擎运行参数 (strata launch 旗标)'), srcPill),
              h(
                'div',
                { className: 'sac-form-grid' },
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '对话上下文容量 (--context)'),
                  h(
                    'select',
                    {
                      className: 'sac-select',
                      value: String(activeSettings.contextLength || 131072),
                      onChange: function (e) { updateField('contextLength', Number(e.target.value)); }
                    },
                    contexts.map(function (c) {
                      return h('option', { key: c, value: String(c) }, contextLabel(c));
                    })
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'KV 缓存格式 (--kv)'),
                  h(
                    'select',
                    {
                      className: 'sac-select',
                      value: activeSettings.kvFormat || 'int8',
                      onChange: function (e) { updateField('kvFormat', e.target.value); }
                    },
                    h('option', { value: 'int8' }, 'int8 (默认，8-bit)'),
                    h('option', { value: 'q4_0' }, 'q4_0 (内存减半)'),
                    h('option', { value: 'k8v4' }, 'k8v4 (混合 8/4-bit)'),
                    h('option', { value: 'fp16' }, 'fp16 (全精度)')
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '图片读取器 (--vision)'),
                  h(
                    'select',
                    {
                      className: 'sac-select',
                      value: activeSettings.visionMode || 'cpu',
                      onChange: function (e) { updateField('visionMode', e.target.value); }
                    },
                    h('option', { value: 'on' }, 'on (按引擎规则自动选择)'),
                    h('option', { value: 'cpu' }, 'cpu (处理器读取，省显存)'),
                    h('option', { value: 'gpu' }, 'gpu (显卡读取，占 1-1.4 GB)'),
                    h('option', { value: 'off' }, 'off (关闭图片输入)')
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'MTP 投机解码 (--mtp)'),
                  h(
                    'select',
                    {
                      className: 'sac-select',
                      value: activeSettings.mtpEnabled === false ? 'off' : 'on',
                      onChange: function (e) { updateField('mtpEnabled', e.target.value === 'on'); }
                    },
                    h('option', { value: 'on' }, 'on (启用草稿层，更快)'),
                    h('option', { value: 'off' }, 'off (省约 1 GB 显存，更慢)')
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'KV 显存常驻量 (--set kv-resident, 0=自适应)'),
                  h('input', {
                    type: 'number', className: 'sac-input', step: 4096, min: 0,
                    value: activeSettings.kvResident ?? 65536,
                    onChange: function (e) { updateField('kvResident', Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '显存安全预留 (--set vram-reserve-mib)'),
                  h('input', {
                    type: 'number', className: 'sac-input', step: 64, min: 0,
                    value: activeSettings.vramReserveMib ?? 1280,
                    onChange: function (e) { updateField('vramReserveMib', Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'CPU/PCIe 分担份额 (--set pcie-frac, 0=不指定)'),
                  h('input', {
                    type: 'number', className: 'sac-input', step: 0.05, min: 0, max: 1,
                    value: activeSettings.pcieFrac ?? 0,
                    onChange: function (e) { updateField('pcieFrac', Number(e.target.value)); }
                  })
                ),
                // v2.5.10：七个新引擎参数（三态：空=保持运行配置文件现状；0=删旗标回引擎默认；有效值=写入）
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '投机解码草稿数 (--spec, 空=不改动, 0=删旗标)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, step: 1, placeholder: '如 4；空 = 保持文件现状',
                    value: activeSettings.spec ?? '',
                    onChange: function (e) { updateField('spec', e.target.value === '' ? null : Number(e.target.value)); }
                  }),
                  h('div', { style: { fontSize: 11, color: '#94a3b8', marginTop: 4 } }, '引擎默认启用的 suffix-draft 会把 verify 窗放大为 旗标+2（上限 8）；监控页差异表与引擎卡显示的是「生效窗」，不是旗标原值（--spec 4 → 生效 6 属正常）。')
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '草稿接受阈值 (--spec-min-p, 0~1; 空=不改动, 0=删旗标)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, max: 1, step: 0.05, placeholder: '如 0.5',
                    value: activeSettings.specMinP ?? '',
                    onChange: function (e) { updateField('specMinP', e.target.value === '' ? null : Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '预填充分块 (--prefill; 空=不改动, off=删旗标)'),
                  h('input', {
                    type: 'text', className: 'sac-input', placeholder: 'auto:32768 / auto / 纯数字 / off',
                    value: activeSettings.prefill ?? '',
                    onChange: function (e) { updateField('prefill', e.target.value.trim() === '' ? null : e.target.value.trim()); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'CPU 工作线程 (--pool-workers, 空=不改动, 0=删旗标)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, step: 1, placeholder: '如 14',
                    value: activeSettings.poolWorkers ?? '',
                    onChange: function (e) { updateField('poolWorkers', e.target.value === '' ? null : Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '专家缓存自适应频率 (--adapt-every, 1=每轮自适应; 空=不改动, 0=删旗标)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, step: 1, placeholder: '如 1',
                    value: activeSettings.adaptEvery ?? '',
                    onChange: function (e) { updateField('adaptEvery', e.target.value === '' ? null : Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '自适应换入换出专家数 (--adapt-swaps; 空=不改动, 0=删旗标)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, step: 1, placeholder: '如 160',
                    value: activeSettings.adaptSwaps ?? '',
                    onChange: function (e) { updateField('adaptSwaps', e.target.value === '' ? null : Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '自适应衰减系数 (--adapt-decay, 0~1 典型 0.97; 空=不改动, 0=删旗标)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, step: 0.01, placeholder: '如 0.97',
                    value: activeSettings.adaptDecay ?? '',
                    onChange: function (e) { updateField('adaptDecay', e.target.value === '' ? null : Number(e.target.value)); }
                  }),
                  h('div', { style: { fontSize: 11, color: '#94a3b8' } }, '三态：留空=保持运行配置文件现状；0=删除该旗标(回到引擎默认)；有效值=写入。当前显示值来自运行配置文件回读；引擎卡另显示运行实例实际生效值(spec / min-p / 线程数)，不一致会列入「与运行实例不一致」差异表。')
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '路由尾部跳过 (STRATA_ROUTE_TAIL_SKIP, 空=未设置)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, step: 1,
                    placeholder: '空 = 引擎自动判断；7 = 开启(推荐)；0 = 强制关闭',
                    value: (activeSettings.engineEnv || {})['STRATA_ROUTE_TAIL_SKIP'] ?? '',
                    onChange: function (e) { setEnvEntry('STRATA_ROUTE_TAIL_SKIP', e.target.value); }
                  }),
                  h('div', { style: { fontSize: 11, color: '#94a3b8' } }, '数值 N：verify 窗口内每 token 都以 rank≤N 路由到的未命中专家直接跳过（缺专家的 12-16GB 卡 +10~20% 解码，答案略有差异）')
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '并发请求数 (--parallel, 0=适配显卡)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 0, max: 8,
                    value: activeSettings.parallel ?? 0,
                    onChange: function (e) { updateField('parallel', Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '服务端口 (--port)'),
                  h('input', {
                    type: 'number', className: 'sac-input', min: 1024, max: 65535,
                    value: activeSettings.enginePort || 8080,
                    onChange: function (e) { updateField('enginePort', Number(e.target.value)); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '访问范围 (--access)'),
                  h(
                    'select',
                    {
                      className: 'sac-select',
                      value: activeSettings.access || 'local',
                      onChange: function (e) { updateField('access', e.target.value); }
                    },
                    h('option', { value: 'local' }, 'local (仅本机 127.0.0.1)'),
                    h('option', { value: 'lan' }, 'lan (局域网，建议配 API key)'),
                    h('option', { value: 'cloudflare' }, 'cloudflare (需 cloudflared)'),
                    h('option', { value: 'tailscale' }, 'tailscale (需已连接)')
                  ),
                  h('div', { style: { fontSize: 11, color: '#94a3b8', marginTop: 4 } }, '访问范围是启动期旗标：保存只影响下次启动，正在运行实例的监听绑定不会变——改完需先「停止」再「启动」。lan 时 Strata 把监听写成 0.0.0.0，但 Windows 防火墙默认拦 TCP 入站（Strata 只提示不自动放行，需管理员加规则放行 8080）；lan 且 API Key 留空 = 局域网无鉴权。当前真实监听看 排障页 /diagnose 的 portProbe。')
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'API Key (可选，--api-key)'),
                  h('input', {
                    type: 'text', className: 'sac-input', placeholder: '留空则不启用鉴权',
                    value: activeSettings.apiKey || '',
                    onChange: function (e) { updateField('apiKey', e.target.value); }
                  })
                ),
                h(
                  'div',
                  { className: 'sac-field full' },
                  h('label', { className: 'sac-label' }, '引擎环境变量 (STRATA_*，写入 env 块 + launch --set，重启模型后生效)'),
                  Object.keys(activeSettings.engineEnv || {}).map(function (k) {
                    return h(
                      'div',
                      { key: k, style: { display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' } },
                      h('input', {
                        type: 'text', className: 'sac-input', style: { flex: '1 1 45%' },
                        value: k, readOnly: true, title: '变量名不可直接修改：删除后重新添加即可'
                      }),
                      h('input', {
                        type: 'text', className: 'sac-input', style: { flex: '1 1 45%' }, placeholder: '值（清空后保存即删除）',
                        value: String((activeSettings.engineEnv || {})[k] || ''),
                        onChange: function (e) { setEnvEntry(k, e.target.value); }
                      }),
                      h('button', { className: 'sac-btn danger', style: { flexShrink: 0 }, onClick: function () { removeEnvEntry(k); } }, '✕')
                    );
                  }),
                  h(
                    'div',
                    { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
                    h('input', {
                      type: 'text', className: 'sac-input', style: { flex: '1 1 45%' },
                      placeholder: '变量名（如 STRATA_ROUTE_TAIL_SKIP）',
                      value: newEnvKey, onChange: function (e) { setNewEnvKey(e.target.value); }
                    }),
                    h('input', {
                      type: 'text', className: 'sac-input', style: { flex: '1 1 45%' },
                      placeholder: '值（如 7）',
                      value: newEnvValue, onChange: function (e) { setNewEnvValue(e.target.value); }
                    }),
                    h('button', { className: 'sac-btn', style: { flexShrink: 0 }, onClick: addEnvEntryFromInputs }, '＋ 添加')
                  ),
                  h(
                    'div',
                    { style: { fontSize: 11.5, color: '#64748b', marginTop: 2, lineHeight: 1.6 } },
                    'STRATA_ROUTE_TAIL_SKIP 已有上方专用下拉框（此处同步显示）；本编辑器用于其他 STRATA_* 变量（如 STRATA_TAIL_SKIP_MAX_CACHED、STRATA_PIN_BY_NEED）。值留空保存时即删除该变量。'
                  )
                )
              )
            ),

            // 服务端默认参数（runconfig.py 可编辑键）
            h(
              'div',
              { className: 'sac-card' },
              h('div', { className: 'sac-card-header' }, h('h3', { className: 'sac-card-title' }, '🎛️ 采样与服务默认值 (strata-<model>.json)'), srcPill),
              h(
                'div',
                { className: 'sac-form-grid' },
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, h('span', null, '温度 (sampling.temperature)'), h('span', null, activeSettings.temperature ?? 0.7)),
                  h('input', { type: 'number', step: 0.05, min: 0, max: 2, className: 'sac-input', value: activeSettings.temperature ?? 0.7, onChange: function (e) { updateField('temperature', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, h('span', null, 'Top-P (sampling.top_p)'), h('span', null, activeSettings.topP ?? 0.95)),
                  h('input', { type: 'number', step: 0.01, min: 0.05, max: 1, className: 'sac-input', value: activeSettings.topP ?? 0.95, onChange: function (e) { updateField('topP', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'Top-K (sampling.top_k, 1-64)'),
                  h('input', { type: 'number', step: 1, min: 1, max: 64, className: 'sac-input', value: activeSettings.topK ?? 20, onChange: function (e) { updateField('topK', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'Min-P (sampling.min_p, 0=不启用)'),
                  h('input', { type: 'number', step: 0.01, min: 0, max: 1, className: 'sac-input', value: activeSettings.minP ?? 0, onChange: function (e) { updateField('minP', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '重复惩罚 (sampling.presence_penalty)'),
                  h('input', { type: 'number', step: 0.1, min: 0, max: 2, className: 'sac-input', value: activeSettings.presencePenalty ?? 0, onChange: function (e) { updateField('presencePenalty', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'Anthropic 未要求思考时的行为 (anthropic_thinking)'),
                  h(
                    'select',
                    {
                      className: 'sac-select',
                      value: activeSettings.anthropicThinking || '',
                      onChange: function (e) { updateField('anthropicThinking', e.target.value); }
                    },
                    h('option', { value: '' }, '未设置（默认 = model：按模型思考）'),
                    h('option', { value: 'model' }, 'model — 未要求思考的请求也按模型思考'),
                    h('option', { value: 'on_request' }, 'on_request — 仅请求明确要求时思考（省思考预算）')
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '思考强度 (reasoning_effort)'),
                  h(
                    'select',
                    {
                      className: 'sac-select',
                      value: activeSettings.reasoningEffort || 'none',
                      onChange: function (e) { updateField('reasoningEffort', e.target.value); }
                    },
                    h('option', { value: 'none' }, 'none (关闭思考)'),
                    h('option', { value: 'low' }, 'low'),
                    h('option', { value: 'medium' }, 'medium'),
                    h('option', { value: 'high' }, 'high')
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '思考 Token 上限 (reasoning_budget_tokens)'),
                  h('input', { type: 'number', step: 1024, min: 0, max: 131072, className: 'sac-input', value: activeSettings.reasoningBudgetTokens ?? 16000, onChange: function (e) { updateField('reasoningBudgetTokens', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '空闲自动卸载秒数 (idle_unload_s, 0=不卸载)'),
                  h('input', { type: 'number', step: 60, min: 0, className: 'sac-input', value: activeSettings.idleUnloadS ?? 0, onChange: function (e) { updateField('idleUnloadS', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '引擎静默超时 (engine_silence_s, 默认 300, 0=一直等待)'),
                  h('input', { type: 'number', step: 30, min: 0, className: 'sac-input', value: activeSettings.engineSilenceS ?? 300, onChange: function (e) { updateField('engineSilenceS', Number(e.target.value)); } })
                ),
                h(
                  'div',
                  { className: 'sac-field full' },
                  h(
                    'label',
                    { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' } },
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(activeSettings.apiMonitor),
                      onChange: function (e) { updateField('apiMonitor', e.target.checked); }
                    }),
                    '开启 API 监控页 (api_monitor，保留最近 100 条请求的提示与回答供 /api-monitor 查看)'
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field full' },
                  h(
                    'label',
                    { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' } },
                    h('input', {
                      type: 'checkbox',
                      checked: activeSettings.fitMaxTokens !== false,
                      onChange: function (e) { updateField('fitMaxTokens', e.target.checked); }
                    }),
                    '截短放不进上下文的 max_tokens (fit_max_tokens，默认开；关闭则像 llama.cpp 一样返回 400)'
                  )
                )
              )
            ),

            // 安装路径
            h(
              'div',
              { className: 'sac-card' },
              h(
                'div',
                { className: 'sac-card-header' },
                h('h3', { className: 'sac-card-title' }, '🗂️ 本机安装路径 (无效时自动发现回填，可手动修正)'),
                h('button', { className: 'sac-btn', onClick: handleCopyDiagnose }, '📋 复制诊断信息')
              ),
              (function () {
                if (!status) return null;
                // 宿主没有 pathSources 字段 = host 进程仍在运行 v2.4 之前的旧模块（界面热更新了，宿主没有）
                if (status.pathSources === undefined) {
                  return h(
                    'div',
                    { style: { fontSize: 11.5, color: '#b91c1c', lineHeight: 1.7 } },
                    '⚠ 宿主进程仍在运行旧版插件（无路径解析数据，host 代码版本 < v2.4）。请完全退出 DeepSeek Harness（含托盘图标）后重新打开，使宿主加载最新代码。'
                  );
                }
                var src = status.pathSources || {};
                var CN = { saved: '已保存', env: '环境变量', detected: '自动探测', missing: '未找到', 'settings-file': '设置文件', 'app-settings': '应用设置', documents: '文档目录', 'default': '默认' };
                var FIELDS = [['strataCliPath', 'CLI'], ['terminalDir', '终端目录'], ['strataInstallDir', '安装根目录'], ['strataComponentsDir', '组件目录'], ['strataDataDir', '数据目录'], ['runConfigDir', '首选配置目录']];
                var anyBad = FIELDS.some(function (f) { return src[f[0]] && src[f[0]] !== 'saved' && src[f[0]] !== 'env'; });
                return h(
                  'div',
                  { style: { fontSize: 11.5, color: anyBad ? '#b45309' : '#64748b', lineHeight: 1.7 } },
                  '路径来源: ' +
                    FIELDS.map(function (f) {
                      return f[1] + '(' + (CN[src[f[0]]] || src[f[0]] || '?') + ')';
                    }).join(' · ') +
                    (anyBad ? ' —— 标记非「已保存」的字段为自动发现值，保存参数后会固化' : '') +
                    (status.pluginVersion ? ' · 宿主插件版本 v' + status.pluginVersion : '')
                );
              })(),
              h(
                'div',
                { className: 'sac-form-grid' },
                h(
                  'div',
                  { className: 'sac-field full' },
                  h('label', { className: 'sac-label' }, 'strata CLI (strata.cmd)'),
                  h('input', { type: 'text', className: 'sac-input', value: activeSettings.strataCliPath || '', onChange: function (e) { updateField('strataCliPath', e.target.value); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'STRATA_INSTALL_DIR'),
                  h('input', { type: 'text', className: 'sac-input', value: activeSettings.strataInstallDir || '', onChange: function (e) { updateField('strataInstallDir', e.target.value); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'STRATA_DATA_DIR (模型数据)'),
                  h('input', { type: 'text', className: 'sac-input', value: activeSettings.strataDataDir || '', onChange: function (e) { updateField('strataDataDir', e.target.value); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, 'STRATA_COMPONENTS_DIR (引擎组件)'),
                  h('input', { type: 'text', className: 'sac-input', value: activeSettings.strataComponentsDir || '', onChange: function (e) { updateField('strataComponentsDir', e.target.value); } })
                ),
                h(
                  'div',
                  { className: 'sac-field' },
                  h('label', { className: 'sac-label' }, '首选运行配置目录 (strata-<model>.json，实际会自动发现多个)'),
                  h('input', { type: 'text', className: 'sac-input', value: activeSettings.runConfigDir || '', onChange: function (e) { updateField('runConfigDir', e.target.value); } })
                ),
                h(
                  'div',
                  { className: 'sac-field full' },
                  h('label', { className: 'sac-label' }, '已发现的运行配置目录'),
                  h(
                    'div',
                    { style: { fontSize: 12, color: '#475569', lineHeight: 1.7, wordBreak: 'break-all' } },
                    ((installation.runConfigPlaces || []).length > 0
                      ? (installation.runConfigPlaces || []).map(function (p) {
                          return h('div', { key: p.path }, '· ' + p.path + ' （' + p.source + '，' + p.configCount + ' 个配置）');
                        })
                      : h('div', null, '（未在任何已知目录发现 strata-*.json：面板目录 / STRATA_INSTALL_DIR / STRATA_DATA_DIR\\install / 终端目录 / %APPDATA%\\Strata\\settings.json 记住的 installs / 应用共享 install 目录）'))
                  )
                ),
                h(
                  'div',
                  { className: 'sac-field full' },
                  h(
                    'label',
                    { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' } },
                    h('input', {
                      type: 'checkbox',
                      checked: activeSettings.useProxyAndMirror !== false,
                      onChange: function (e) { updateField('useProxyAndMirror', e.target.checked); }
                    }),
                    '启动/升级时使用代理 http://127.0.0.1:7897 与 HF 镜像 hf-mirror.com（需要外网代理的环境开启）'
                  )
                )
              ),
              h(
                'div',
                { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', flexWrap: 'wrap' } },
                h('button', { className: 'sac-btn', onClick: handleSaveSettings, disabled: busy }, '💾 保存参数到运行配置'),
                h('button', { className: 'sac-btn primary', onClick: handleStartEngine, disabled: busy }, engine.online ? '🚀 保存并重启模型 (--restart)' : '🚀 保存并启动模型')
              )
            )
          )
        );
      }

      // ---- 升级页（strata update / components rollback）----
      function renderUpdateTab() {
        var report = updReport && updReport.report;
        var feed = (report && report.feed) || null;
        var eng = (report && report.engine) || null;
        var ctl = (report && report.control) || null;
        var app = (report && report.app) || null;
        var compState = (updStatus && updStatus.componentState) || (updReport && updReport.componentState) || null;
        var prevEngine = compState && compState.engine && compState.engine.previous;
        var activeEngine = compState && compState.engine && compState.engine.active;
        var lastResult = (updStatus && updStatus.lastResult) || null;
        var history = (compState && compState.history) || [];
        var engineStatusPill = function (st) {
          if (st === 'current') return h('span', { className: 'sac-pill online' }, '已是最新');
          if (st === 'available') return h('span', { className: 'sac-pill warning' }, '可升级');
          if (st === 'install') return h('span', { className: 'sac-pill warning' }, '未安装，源中可用');
          return h('span', { className: 'sac-pill danger' }, st || '—');
        };
        var mib = function (n) {
          return n != null ? Math.round(n / 1048576) + ' MiB' : '—';
        };

        return h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
          // 1. 当前安装版本
          h(
            'div',
            { className: 'sac-card' },
            h('div', { className: 'sac-card-header' }, h('h3', { className: 'sac-card-title' }, '📦 当前安装的组件')),
            h('div', { className: 'sac-kv-row' }, h('span', null, 'Control（实际生效，随 strata update 升级）'), h('span', { className: 'sac-kv-val' }, (installation.controlActive && installation.controlActive.version) || (ctl && ctl.installed) || '—（未通过 strata update 安装）')),
            h('div', { className: 'sac-kv-row' }, h('span', null, 'Control 已安装版本'), h('span', { className: 'sac-kv-val' }, (installation.controlVersions || []).join('、') || '—')),
            h('div', { className: 'sac-kv-row', title: '终端文件夹不随 strata update 变化；升级终端需重新运行官方安装脚本 install.ps1' }, h('span', null, '终端文件夹（不随 strata update 变化）'), h('span', { className: 'sac-kv-val' }, installation.terminalVersion || '—')),
            h('div', { className: 'sac-kv-row' }, h('span', null, '引擎组件 (active)'), h('span', { className: 'sac-kv-val' }, activeEngine || (installation.engines || []).join('、') || '—')),
            h('div', { className: 'sac-kv-row' }, h('span', null, '已安装引擎目录'), h('code', { className: 'sac-kv-val' }, (installation.engines || []).join('、') || '—')),
            h('div', { className: 'sac-kv-row' }, h('span', null, '可回滚版本 (previous)'), h('span', { className: 'sac-kv-val' }, prevEngine || '无（升级一次后自动保留旧版）')),
            (compState && compState.feed)
              ? h('div', { className: 'sac-kv-row' }, h('span', null, '组件目录记住的更新源'), h('code', { className: 'sac-kv-val' }, compState.feed.source + ' (sequence ' + compState.feed.sequence + ')'))
              : null,
            history.length > 0
              ? h(
                  'div',
                  { className: 'sac-kv-row' },
                  h('span', null, '升级历史 (最近 ' + Math.min(3, history.length) + ' 条)'),
                  h('span', { className: 'sac-kv-val' }, history.slice(-3).reverse().map(function (hh) {
                    return (hh.action || '?') + ' ' + (hh.from || '∅') + '→' + (hh.to || '?') + (hh.ok ? ' ✓' : ' ✗');
                  }).join(' · '))
                )
              : null
          ),

          // v2.5.7③：运行实例不在组件体系内（本地构建/旧组件）→ 讲清升级/回滚的影响范围
          (status && status.components && status.components.runningInSync === false)
            ? h(
                'div',
                { className: 'sac-card', style: { borderLeft: '3px solid #d97706' } },
                h(
                  'div',
                  { style: { fontSize: 12.5, color: '#b45309' } },
                  '⚠ 当前运行实例的引擎版本 ' + (status.components.runningVersion || '?') +
                    ' 与组件体系 active（' + (status.components.active || '?') +
                    '）不一致——运行实例多半来自组件目录之外的本地构建或旧组件。升级/回滚只改变组件目录内容，不会改变正在运行的实例；要让新组件生效，需停止服务后用「启动」重新拉起。'
                )
              )
            : null,

          // 2. 检查更新
          h(
            'div',
            { className: 'sac-card' },
            h(
              'div',
              { className: 'sac-card-header' },
              h('h3', { className: 'sac-card-title' }, '🔎 检查更新 (strata update --check)'),
              h('button', { className: 'sac-btn primary', onClick: handleUpdateCheck, disabled: updChecking || busy }, updChecking ? '检查中...' : '检查更新')
            ),
            h(
              'div',
              { className: 'sac-field full' },
              h('label', { className: 'sac-label' }, '更新源 (--feed，官方签名源)'),
              h('input', {
                type: 'text', className: 'sac-input',
                value: activeSettings.updateFeed || '',
                placeholder: 'https://github.com/Niko1221/Strata/releases/latest/download/strata-feed.json',
                onChange: function (e) { updateField('updateFeed', e.target.value); }
              })
            ),
            h('div', { style: { fontSize: 11.5, color: '#64748b' } }, '注：组件目录记住的更新源可能是本地离线源（离线安装时留下，会永远显示”已最新”），因此这里默认显式使用官方签名源；也可改为本地目录路径做离线安装。网络访问走启动环境里的代理设置。'),
            report
              ? h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                  h('div', { className: 'sac-kv-row' }, h('span', null, '更新源'), h('span', { className: 'sac-kv-val' }, 'sequence ' + (feed && feed.sequence) + ' · ' + (feed && feed.channel) + ' 通道 · 签名 ' + (feed && feed.key_id) + ' (' + (feed && feed.trusted_by) + ') · 生成于 ' + String(feed && feed.generated_at || '').replace('T', ' ').replace('Z', ' UTC'))),
                  h(
                    'div',
                    { className: 'sac-kv-row' },
                    h('span', null, '引擎 (Engine)'),
                    h('span', { className: 'sac-kv-val' }, engineStatusPill(eng.status), ' ',
                      ((eng.installed || {}).version || '未安装') + (eng.offered && eng.status === 'available' ? ' → ' + eng.offered.version + ' (' + mib(eng.download_bytes) + ')' : ''),
                      eng.offered && eng.offered.min_driver && eng.offered.min_driver.nvidia ? ' · 需驱动 ≥ ' + eng.offered.min_driver.nvidia : '')
                  ),
                  (eng.reasons && eng.reasons.length > 0)
                    ? h('div', { style: { fontSize: 11.5, color: '#94a3b8' } }, '未选中的包: ' + eng.reasons.slice(0, 2).join('；') + (eng.reasons.length > 2 ? ' 等 ' + eng.reasons.length + ' 条' : ''))
                    : null,
                  h('div', { className: 'sac-kv-row' }, h('span', null, 'Control (终端控制组件)'), h('span', { className: 'sac-kv-val' }, (ctl.installed || '?') + ' → ' + (ctl.offered || '?') + ' · ' + (ctl.status || '—') + ' · ' + mib(ctl.download_bytes))),
                  h('div', { className: 'sac-kv-row' }, h('span', null, '桌面应用 (App, 可选)'), h('span', { className: 'sac-kv-val' }, '源提供 ' + (app.offered || '?') + ' · ' + mib(app.download_bytes) + ' · 本机未安装桌面端')),
                  report.serving && report.serving.length
                    ? h('div', { style: { fontSize: 11.5, color: '#b45309' } }, '有引擎正在服务 (' + report.serving.map(function (s) { return s.profile; }).join('、') + ')：正式升级会先停止它。')
                    : null
                )
              : h('div', { style: { fontSize: 12, color: '#64748b' } }, '尚未检查。点击右上「检查更新」读取官方源的签名报告（只读，不下载组件）。')
          ),

          // 3. 执行升级 + 进度日志
          h(
            'div',
            { className: 'sac-card' },
            h(
              'div',
              { className: 'sac-card-header' },
              h('h3', { className: 'sac-card-title' }, '⬆️ 执行升级 (strata update)'),
              h(
                'div',
                { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } },
                h(
                  'label',
                  { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 12, color: '#475569', cursor: 'pointer' } },
                  h('input', { type: 'checkbox', checked: updForce, onChange: function (e) { setUpdForce(e.target.checked); } }),
                  '--force 重试失败/被回滚的版本'
                ),
                h('button', { className: 'sac-btn success', onClick: handleUpdateApply, disabled: busy || updRunning }, updRunning ? '升级进行中...' : '🚀 停止服务并升级')
              )
            ),
            h('div', { style: { fontSize: 12, color: '#64748b' } }, '流程与 strata update 完全一致：停止服务 → 下载签名包并校验哈希/签名 → 测试启动（启动、答一个 token、停止）→ 切换；旧引擎版本保留，可随时回滚。调优预设只标记复检，不删除。'),
            updStatus
              ? h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                  h(
                    'div',
                    { className: 'sac-kv-row' },
                    h('span', null, '任务状态'),
                    h('span', { className: 'sac-kv-val' },
                      h('span', { className: 'sac-pill ' + (updStatus.running ? 'warning' : 'stopped') }, updStatus.running ? '● 运行中 (pid ' + updStatus.pid + ')' : '○ 空闲'),
                      ' ',
                      updStatus.command || '')
                  ),
                  lastResult
                    ? h(
                        'div',
                        { style: { padding: '8px 12px', borderRadius: 8, background: lastResult.ok ? '#ecfdf5' : '#fef2f2', border: '1px solid ' + (lastResult.ok ? '#a7f3d0' : '#fecaca'), color: lastResult.ok ? '#065f46' : '#991b1b', fontSize: 12 } },
                        (lastResult.results
                          ? lastResult.results.map(function (r) {
                              return r.component + ': ' + r.status + ((r.installed_before && r.installed_before.version) || r.installed_before ? ' ' + ((r.installed_before && r.installed_before.version) || r.installed_before) + '→' + ((r.installed_after && r.installed_after.version) || r.installed_after || '') : '') + (r.error ? ' · ' + r.error : '');
                            }).join('；')
                          : lastResult.from
                            ? '引擎已回滚: ' + lastResult.from + ' → ' + lastResult.to + (lastResult.presets_marked ? '（调优预设已标记复检）' : '')
                            : JSON.stringify(lastResult).slice(0, 300))
                      )
                    : null,
                  h(
                    'div',
                    { className: 'sac-log-box' },
                    '# ' + (updStatus.logPath || '') + '\n' + ((updStatus.logTail || []).join('\n') || '（暂无输出）')
                  )
                )
              : h('div', { style: { fontSize: 12, color: '#64748b' } }, '尚未执行过升级。')
          ),

          // 4. 回滚
          h(
            'div',
            { className: 'sac-card' },
            h(
              'div',
              { className: 'sac-card-header' },
              h('h3', { className: 'sac-card-title' }, '⏮ 回滚引擎 (strata components rollback)'),
              h('button', { className: 'sac-btn danger', onClick: handleUpdateRollback, disabled: busy || updRunning || !prevEngine }, prevEngine ? '回滚到 ' + prevEngine : '无可回滚版本')
            ),
            h('div', { style: { fontSize: 12, color: '#64748b' } }, '仅当最近一次升级保留了旧版本时可用（升级成功后 previous 自动记录）。回滚后如想再试新版本，用上方 --force 升级。')
          )
        );
      }

      var online = Boolean(engine.online);
      return h(
        'div',
        { className: 'sac-root', 'data-plugin': PKG_ID },
        h(
          'div',
          { className: 'sac-container' },
          // 顶栏
          h(
            'div',
            { className: 'sac-header' },
            h(
              'div',
              { className: 'sac-title-row' },
              h('div', { className: 'sac-brand-badge' }, 'AI'),
              h(
                'div',
                null,
                h(
                  'h1',
                  { className: 'sac-title' },
                  'AI管理中心',
                  h('span', { className: 'sac-pill ' + (online ? 'online' : 'stopped') }, online ? '● 运行中: ' + (engine.model || '') : '○ 未运行')
                ),
                h('div', { className: 'sac-subtitle' }, 'Strata 本地推理引擎 · ' + (installation.cliPath || activeSettings.strataCliPath || '') + (installation.terminalVersion ? ' (终端 ' + installation.terminalVersion + ')' : ''))
              )
            ),
            h(
              'div',
              { className: 'sac-tabs', role: 'tablist' },
              h('button', { className: 'sac-tab-btn' + (activeTab === 'monitor' ? ' active' : ''), onClick: function () { setActiveTab('monitor'); } }, '📊 监控 (Monitor)'),
              h('button', { className: 'sac-tab-btn' + (activeTab === 'models' ? ' active' : ''), onClick: function () { setActiveTab('models'); } }, '🧩 模型与参数 (Models)'),
              h('button', { className: 'sac-tab-btn' + (activeTab === 'update' ? ' active' : ''), onClick: function () { setActiveTab('update'); } }, '⬆️ 升级 (Update)' + (updRunning ? ' ●' : ''))
            ),
            h(
              'div',
              { className: 'sac-actions' },
              h('button', { className: 'sac-btn success', onClick: handleStartEngine, disabled: busy }, online ? '▶ 重启模型' : '▶ 启动模型'),
              h('button', { className: 'sac-btn danger', onClick: handleStopEngine, disabled: busy }, '■ 停止服务'),
              h('button', { className: 'sac-btn', onClick: handleUnload, disabled: busy }, '⏏ 卸载显存'),
              h('button', { className: 'sac-btn', onClick: handleOpenWeb }, '🌐 Web 控制台')
            )
          ),

          toast
            ? h(
                'div',
                { className: 'sac-toast' },
                h('span', { style: { minWidth: 0 } }, 'ℹ️ ' + toast),
                h('button', { style: { background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }, onClick: function () { setToast(''); } }, '✕')
              )
            : null,

          activeTab === 'monitor' ? renderMonitorTab() : activeTab === 'models' ? renderModelsTab() : renderUpdateTab()
        )
      );
    }

    var inject = ['slots'];

    function apply(ctx) {
      ensureStyles();

      // 1. 左侧栏「记忆系统」下方注册入口
      ctx.slots.inject('sidebar.panellist', function () {
        return ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 25,
            label: 'AI管理中心'
          },
          SidebarEntryIcon
        );
      });

      // 2. 主视图注册管理面板
      ctx.slots.inject('main', function () {
        return ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID
          },
          StrataAiCenterPanel
        );
      });

      // 侧栏重渲染时保持顺序（v2.5.7⑤：兜底观察器，400ms 防抖；专用观察器在侧栏容器定位后挂上）
      if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
        var obs = new MutationObserver(function () {
          schedulePin(400);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        if (typeof ctx.effect === 'function') {
          ctx.effect(function () {
            return function () {
              obs.disconnect();
            };
          }, 'dsh-strata-ai-center:sidebar-order');
        }
      }
    }

    return {
      name: PKG_ID,
      inject: inject,
      apply: apply,
      StrataAiCenterPanel: StrataAiCenterPanel,
      SidebarEntryIcon: SidebarEntryIcon
    };
  }

  if (typeof window !== 'undefined' && window.__ModuleLoader__ && typeof window.__ModuleLoader__.load === 'function') {
    window.__ModuleLoader__.load({
      id: PKG_ID,
      factory: function (requireFn) {
        return createPlugin(requireFn);
      }
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = createPlugin;
  }
})();
