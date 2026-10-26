// dsh-strata-ai-center — host side (Node ESM)
// 与本机实际安装的 Strata (Niko1221/Strata, terminal 0.1.49.2 / engine 0.1.48) 对应：
//   CLI        D:\Strata\terminal\current\bin\strata.cmd   (strata launch ...)
//   运行配置   D:\Strata\strata-<model>.json                 (serve/runconfig.py 的字段与写入规则)
//   引擎服务   http://127.0.0.1:8080  (/health /v1/status /v1/telemetry /metrics /v1/chat/completions /unload /config)
//   启动脚本参照 C:\Users\Administrator\AppData\Local\Temp\launch-iq3s-128k.ps1
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const name = 'dsh-strata-ai-center';
export const inject = [];

const ROUTE_PREFIX = '/__dsh-strata-ai-center';
const SETTINGS_VERSION = 2;

// 插件版本（package.json，模块加载时读一次）：/status 会带上，用于识别宿主进程是否还在跑旧代码
const PLUGIN_VERSION = (() => {
  try {
    return JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  } catch (_e) {
    return null;
  }
})();

// ---------------------------------------------------------------------------
// 真实模型目录：提取自本机 terminal 0.1.49.2 的 setup.py 模型表
// (strata_cli/launch/catalog.py → tools/strata_mcp.py → setup.py MODELS/FAMILIES)
const CONTEXTS = [8192, 32768, 65536, 131072, 204800, 262144, 393216, 524288];

const KV_BYTES_PER_LAYER = { fp16: 2112, int8: 1056, q4_0: 576, k8v4: 816 }; // setup.py UD_FIT_KV_BYTES, 13 层注意力
const UMA_EXPERTS = 24576; // setup.py UMA_EXPERTS: 48 层 x 512 专家

const FAMILIES = {
  qwen: { title: 'Qwen3.8-Flash-Next', about: '原版模型 (ISTA-DASLab GSQ-RCO 量化)' },
  swift: { title: 'Swift 1.5', about: 'UkisAI 微调版：思考链短约 63%，出答案快约 1.8 倍' },
  coder: { title: 'Qwen3.8-Flash-Next Coder', about: '半量专家（保留代码/工具/图像）：约 32 GB 内存即可，非编程任务较弱' },
  unsloth: { title: 'Qwen3.8-Flash-Next (Unsloth)', about: 'UD 4/5/6/8-bit 高精度档' },
  gyro: { title: 'Qwen3.8-Flash-Next (Gyro)', about: '最小内存档 (Trellis 量化)' },
  nvfp4: { title: 'Qwen3.8-Flash-Next (NVFP4)', about: 'FP4 专家，仅 NVIDIA 卡' },
  qwen36: { title: 'Qwen3.6-35B-A3B', about: '35B MoE / 3B 激活的小表亲，同 tokenizer' },
  deepseek41: { title: 'DeepSeek-V4.1-Flash', about: '超大模型，需 239-508 GB 磁盘与专用包' }
};

const MODEL_TABLE = [
  { family: 'qwen', sizes: [
    { model: 'Q2_0', id: 'q2_0', about: '2-bit，速度最快', downloadGb: 66.4, memoryGb: 35.0, ramNeededGb: 48, expertsGb: 34.0, images: true },
    { model: 'IQ2_XS', id: 'iq2_xs', about: '2-bit i-quant，质量略好，速度接近', downloadGb: 68.0, memoryGb: 36.5, ramNeededGb: 48, expertsGb: 35.5, images: true },
    { model: 'IQ3_XXS', id: 'iq3_xxs', about: '3-bit i-quant，质量更好，更慢（每 token 更多 CPU 计算）', downloadGb: 75.8, memoryGb: 43.9, ramNeededGb: 60, expertsGb: 42.9, images: true },
    { model: 'IQ3_S', id: 'iq3_s', about: '3.5-bit i-quant，最佳质量（追平原模型），最慢；需要 64 GB 内存', downloadGb: 83.6, memoryGb: 51.3, ramNeededGb: 62, expertsGb: 50.3, images: true }
  ] },
  { family: 'swift', sizes: [
    { model: 'IQ2_XS', id: 'swift-iq2_xs', about: '2-bit i-quant，质量略好，速度接近', downloadGb: 68.0, memoryGb: 36.5, ramNeededGb: 48, expertsGb: 35.5, images: true },
    { model: 'IQ3_XXS', id: 'swift-iq3_xxs', about: '3-bit i-quant，质量更好，更慢', downloadGb: 75.8, memoryGb: 43.9, ramNeededGb: 60, expertsGb: 42.9, images: true },
    { model: 'IQ3_S', id: 'swift-iq3_s', about: '3.5-bit i-quant，最佳质量，最慢', downloadGb: 83.6, memoryGb: 51.3, ramNeededGb: 62, expertsGb: 50.3, images: true }
  ] },
  { family: 'coder', sizes: [
    { model: 'IQ1_M', id: 'coder-iq1_m', about: 'Coder 唯一档位：半量专家，按 IQ3_S 方式存储 (3.5 bit)', downloadGb: 58.4, memoryGb: 24.4, ramNeededGb: 32, expertsGb: 23.4, images: true }
  ] },
  { family: 'unsloth', sizes: [
    { model: 'UD-IQ4_XS', id: 'unsloth-ud-iq4_xs', about: '~4-bit 动态量化；内存 <80 GB 时部分专家从 SSD 读取', downloadGb: 93.7, memoryGb: 60.5, ramNeededGb: 48, expertsGb: 59.5, images: true },
    { model: 'UD-Q4_K_XL', id: 'unsloth-ud-q4_k_xl', about: '4-bit K-quant 动态量化', downloadGb: 111.3, memoryGb: 78.0, ramNeededGb: 48, expertsGb: 77.0, images: true },
    { model: 'UD-Q5_K_XL', id: 'unsloth-ud-q5_k_xl', about: '5-bit，接近 Q8_0 质量', downloadGb: 158.3, memoryGb: 99.4, ramNeededGb: 108, expertsGb: 98.4, images: true },
    { model: 'UD-Q6_K_XL', id: 'unsloth-ud-q6_k_xl', about: '6-bit，Q6_K 专家 + Q8_0 downs', downloadGb: 169.2, memoryGb: 110.2, ramNeededGb: 118, expertsGb: 109.2, images: true },
    { model: 'Q8_0', id: 'unsloth-q8_0', about: '8-bit 参考质量；192 GB 级别主机', downloadGb: 188.2, memoryGb: 129.3, ramNeededGb: 136, expertsGb: 128.3, images: true }
  ] },
  { family: 'gyro', sizes: [
    { model: 'Gyro-S', id: 'gyro-gyro-s', about: '最小档：VRAM+RAM 合计 27.6 GB；质量低于 2-3-bit 档', downloadGb: 58.5, memoryGb: 27.6, ramNeededGb: 27.6, expertsGb: 25.8, memTotal: true, images: true },
    { model: 'Gyro-M', id: 'gyro-gyro-m', about: '约 IQ3_XXS 质量，省约 20% 显存（合计 35 GB）', downloadGb: 92.0, memoryGb: 35.0, ramNeededGb: 35.0, expertsGb: 32.1, memTotal: true, images: true }
  ] },
  { family: 'nvfp4', sizes: [
    { model: 'NVFP4', id: 'nvfp4-nvfp4', about: 'GPTQ 转换的 NVFP4；RTX 50 有 FP4 张量核，其他 NVIDIA 卡按 8-bit 精度运行', downloadGb: 128.0, memoryGb: 69.0, ramNeededGb: 80, expertsGb: 68.0, images: true },
    { model: 'NVFP4-NVIDIA', id: 'nvfp4-nvfp4-nvidia', about: 'NVIDIA 官方 NVFP4 checkpoint，大小速度同 NVFP4', downloadGb: 128.0, memoryGb: 69.0, ramNeededGb: 80, expertsGb: 68.0, images: true },
    { model: 'NVFP4-QAD', id: 'nvfp4-nvfp4-qad', about: '为 FP4 训练的版本；102 GB 下载需在本机再转换一次 (约 40 分钟 + 110 GB 磁盘)', downloadGb: 102.2, memoryGb: 69.0, ramNeededGb: 80, expertsGb: 68.0, images: true }
  ] },
  { family: 'qwen36', sizes: [
    { model: 'UD-Q4_K_XL', id: 'qwen36-ud-q4_k_xl', about: '4-bit 动态量化，最小', downloadGb: 22.9, memoryGb: 22.3, ramNeededGb: 32, expertsGb: 21.3, images: true },
    { model: 'UD-Q6_K_XL', id: 'qwen36-ud-q6_k_xl', about: '6-bit 动态量化，更接近原模型', downloadGb: 32.6, memoryGb: 31.3, ramNeededGb: 44, expertsGb: 30.3, images: true },
    { model: 'Q8_0', id: 'qwen36-q8_0', about: '8-bit，最接近原模型', downloadGb: 37.8, memoryGb: 36.2, ramNeededGb: 52, expertsGb: 35.2, images: true }
  ] },
  { family: 'deepseek41', sizes: [ // multi_file：需要 --dsv41-package，本插件内不可直接启动
    { model: 'IST-DAS-1.75bpw', id: 'deepseek-v4.1-flash-ist-das-1.75bpw', about: '最小官方版 (239 GB 磁盘)；代码可用，散文较弱', downloadGb: 239.3, memoryGb: 34.0, ramNeededGb: 34, expertsGb: 17.0, memTotal: true, images: false },
    { model: 'IST-DAS-2.00bpw', id: 'deepseek-v4.1-flash-ist-das-2.00bpw', about: '较小官方版 (257 GB 磁盘)，约 5-7 tok/s', downloadGb: 256.8, memoryGb: 40.0, ramNeededGb: 40, expertsGb: 23.0, memTotal: true, images: false },
    { model: 'IST-DAS-2.25bpw', id: 'deepseek-v4.1-flash-ist-das-2.25bpw', about: '更好官方版 (274 GB 磁盘)', downloadGb: 273.8, memoryGb: 44.0, ramNeededGb: 44, expertsGb: 27.0, memTotal: true, images: false },
    { model: 'UD-Q8_K_XL', id: 'deepseek-v4.1-flash-ud-q8_k_xl', about: '508 GB，多卡/数百 GB 内存机型', downloadGb: 508.4, memoryGb: 306.0, ramNeededGb: 306, expertsGb: 289.0, memTotal: true, images: false }
  ] }
];

// setup.py 内存适配规则的移植 (strata_cli/launch/catalog.py fit_on / native-fit.ts fitOn)
const DENSE_GB = 5.0;
const SYSTEM_ROOM_GB = 10.0;
const DENSE_EXTRA_GB = 1.0;

function round1(n) {
  return Math.round(n * 10) / 10;
}

function fitOn(size, ramGb, vramGb) {
  const memory = size.memoryGb || round1((size.expertsGb || 0) + DENSE_EXTRA_GB);
  const vram = Number(vramGb) || 0;
  if (!ramGb || ramGb <= 0) {
    return { memoryGb: memory, vramUseGb: 0, ramUseGb: 0, spillGb: 0, known: false };
  }
  const experts = Math.max(0, memory - DENSE_EXTRA_GB);
  const onGpu = Math.max(0, Math.min(experts, vram - DENSE_GB));
  const ramRoom = Math.max(0, ramGb - SYSTEM_ROOM_GB);
  const spill = Math.max(0, round1(experts - onGpu - ramRoom));
  const inRam = Math.max(0, experts - onGpu - spill);
  const vramUse = vram > 0 ? Math.min(vram, DENSE_GB + onGpu) : 0;
  return {
    memoryGb: memory,
    vramUseGb: round1(vramUse),
    ramUseGb: round1(inRam + (vram <= 0 ? DENSE_EXTRA_GB : 0)),
    spillGb: spill,
    known: true
  };
}

function fitWords(fit) {
  if (!fit.known) return { level: 'unknown', text: '未检测到内存信息' };
  if (fit.spillGb <= 0) return { level: 'fits', text: '装得下 (fits)' };
  if (fit.spillGb <= 30) return { level: 'tight', text: `偏紧：约 ${fit.spillGb} GB 专家需从 SSD 读取` };
  return { level: 'no', text: `过大：约 ${fit.spillGb} GB 需 SSD 流式，速度明显下降` };
}

function kvGbFor(tokens, kv) {
  const bytes = KV_BYTES_PER_LAYER[kv] || KV_BYTES_PER_LAYER.int8;
  return round1((tokens * 13 * bytes) / 1e9);
}

// Strata 安装根目录候选（有序去重）：STRATA_INSTALL_DIR > D:\Strata（自定义盘）>
// %LOCALAPPDATA%\Strata（Windows 一键安装）> ~/.local/share/strata（Linux/macOS）
function strataRootCandidates(localAppData, home) {
  const roots = [
    process.env.STRATA_INSTALL_DIR,
    'D:\\Strata',
    path.join(localAppData, 'Strata'),
    path.join(home, '.local', 'share', 'strata')
  ].filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const r of roots) {
    const key = path.resolve(r).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Strata 安装路径自动探测（发布给其他机器使用；优先级见 getDefaultSettings）
// 布局参照 docs/TERMINAL_LAUNCH.md：终端在 <root>/terminal/<版本目录>（常有 current 链接指过去，
// 但没有 current 的安装也要认），运行配置 strata-<model>.json 在安装根目录或 <root>/install。
// v2.5.5 起还认「源码 checkout + 本地构建」新布局：CLI 在根级 <root>/bin/strata(.cmd)，
// 且 terminal/<current|版本目录> 只有 python\+serve\（serve 回退启动所需）没有 bin\ 也认。
function detectStrataPaths() {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const isWin = process.platform === 'win32';
  const cliName = isWin ? 'strata.cmd' : 'strata';
  const hasRunConfigs = (dir) => {
    try {
      return fs.readdirSync(dir).some((n) => /^strata-.+\.json$/i.test(n));
    } catch (_e) {
      return false;
    }
  };
  const hasServePair = (d) =>
    fs.existsSync(path.join(d, 'python', isWin ? 'python.exe' : 'python')) &&
    fs.existsSync(path.join(d, 'serve', 'server.py'));
  for (const root of strataRootCandidates(localAppData, home)) {
    // 终端目录候选：<root>/terminal/current 优先，其次版本号最大的目录（0.1.49.2 这类命名，字典序即可）
    let binTerminal = null; // 带 bin/<cli> 的终端目录（老布局，v2.4.2 规则不变）
    let serveTerminal = null; // 只有 python+serve 的终端目录（serve 回退启动结构）
    const cur = path.join(root, 'terminal', 'current');
    const candidates = fs.existsSync(cur) ? [cur] : [];
    try {
      const tdir = path.join(root, 'terminal');
      const versions = fs.readdirSync(tdir).filter((n) => /^\d+\.\d+/.test(n)).sort();
      for (let i = versions.length - 1; i >= 0; i--) candidates.push(path.join(tdir, versions[i]));
    } catch (_e) {
      // ignore
    }
    for (const c of candidates) {
      if (!binTerminal && fs.existsSync(path.join(c, 'bin', cliName))) binTerminal = c;
      if (!serveTerminal && hasServePair(c)) serveTerminal = c;
      if (binTerminal && serveTerminal) break;
    }
    const rootCli = path.join(root, 'bin', cliName);
    const hasRootCli = fs.existsSync(rootCli);
    if (!binTerminal && !serveTerminal && !hasRootCli) continue;
    const resolveDir = (d) => {
      try {
        return fs.realpathSync(d);
      } catch (_e) {
        return d;
      }
    };
    const terminalDir = binTerminal ? resolveDir(binTerminal) : serveTerminal ? resolveDir(serveTerminal) : null;
    let runConfigDir = root;
    if (!hasRunConfigs(root)) {
      const installDir = path.join(root, 'install');
      if (fs.existsSync(installDir) && hasRunConfigs(installDir)) runConfigDir = installDir;
    }
    const cliFromTerminal = terminalDir ? path.join(terminalDir, 'bin', cliName) : null;
    return {
      terminalDir,
      terminalKind: binTerminal ? 'bin' : serveTerminal ? 'serve' : null,
      strataCliPath:
        cliFromTerminal && fs.existsSync(cliFromTerminal) ? cliFromTerminal : hasRootCli ? rootCli : null,
      strataInstallDir: root,
      strataComponentsDir: path.join(root, 'components'),
      strataDataDir: fs.existsSync(`${root}-Models`) ? `${root}-Models` : path.join(localAppData, 'Strata'),
      runConfigDir
    };
  }
  return null;
}

// 默认设置：优先级 挂载配置(pluginConfig) > STRATA_* 环境变量 > 自动探测 > 兜底值；
// 首次打开后可在「模型与参数 → 安装路径」里手动修正。
function getDefaultSettings(pluginConfig = {}) {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
  const isWin = process.platform === 'win32';
  const detected = detectStrataPaths() || {};
  const installDir =
    pluginConfig.strataInstallDir || process.env.STRATA_INSTALL_DIR || detected.strataInstallDir || 'D:\\Strata';
  return {
    settingsVersion: SETTINGS_VERSION,
    strataCliPath:
      pluginConfig.strataCliPath ||
      detected.strataCliPath ||
      path.join(installDir, 'terminal', 'current', 'bin', isWin ? 'strata.cmd' : 'strata'),
    terminalDir: pluginConfig.terminalDir || detected.terminalDir || path.join(installDir, 'terminal', 'current'),
    strataInstallDir: installDir,
    strataComponentsDir:
      pluginConfig.strataComponentsDir || process.env.STRATA_COMPONENTS_DIR || detected.strataComponentsDir ||
      path.join(installDir, 'components'),
    strataDataDir:
      pluginConfig.strataDataDir || process.env.STRATA_DATA_DIR || detected.strataDataDir || `${installDir}-Models`,
    runConfigDir: pluginConfig.runConfigDir || process.env.STRATA_INSTALL_DIR || detected.runConfigDir || installDir,
    launchStateDir: path.join(localAppData, 'Strata', 'launch'),
    presetsDir: path.join(appData, 'Strata', 'launch-presets'),
    enginePort: Number(pluginConfig.defaultPort) || 8080,
    access: 'local',
    selectedModel: 'iq3_s',
    contextLength: 131072,
    kvFormat: 'int8',
    visionMode: 'cpu',
    mtpEnabled: true,
    kvResident: 65536,
    vramReserveMib: 1280,
    pcieFrac: 0, // --pcie-frac: CPU/PCIe 分担份额 0~1；0 = 不写入旗标（跟随 strata tune 调优值/引擎默认）
    parallel: 0, // 0 = 适配显卡 (launch 默认)
    // 引擎进程环境变量 (STRATA_*)：写入 strata-<model>.json 的 env 块，启动时同时经
    // launch --set KEY=VALUE 与进程环境传递。如 STRATA_ROUTE_TAIL_SKIP=7（0=关，见引擎二进制说明）。
    engineEnv: {},
    // 下载代理与 HF 镜像（如 127.0.0.1:7897 + hf-mirror.com）。默认关闭，供需要的用户在面板中开启。
    useProxyAndMirror: false,
    // 官方签名更新源 (strata_cli/update_cmd.py DEFAULT_FEED)。注意：组件目录记住的源是
    // D:\Strata\local-feed（离线安装用，永远显示“已最新”），因此检查/升级时必须显式传 --feed。
    updateFeed: 'https://github.com/Niko1221/Strata/releases/latest/download/strata-feed.json',
    temperature: 0.7,
    topP: 0.95,
    topK: 20,
    minP: 0,
    presencePenalty: 0,
    reasoningEffort: 'none',
    reasoningBudgetTokens: 16000,
    apiMonitor: false,
    idleUnloadS: 0,
    fitMaxTokens: true, // runconfig 默认：截短放不进上下文的 max_tokens
    engineSilenceS: 300, // runconfig 默认：引擎静默超时（0 = 一直等待）
    anthropicThinking: '', // runconfig 枚举：''=未设置(默认 model) | 'model' | 'on_request'（非法值会导致服务器拒启）
    apiKey: ''
  };
}

function getStateFilePath() {
  const dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  const dir = path.join(dshHome, 'strata-ai-center');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_e) {
    return path.join(os.tmpdir(), 'dsh-strata-ai-center-state.json');
  }
  return path.join(dir, 'settings.json');
}

function loadSettings(pluginConfig) {
  const defaults = getDefaultSettings(pluginConfig);
  const file = getStateFilePath();
  try {
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Number(raw.settingsVersion) === SETTINGS_VERSION) {
        return { ...defaults, ...raw };
      }
      // 旧版状态文件：仅保留 API key，其余采用与真实安装一致的新默认值
      return { ...defaults, apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '' };
    }
  } catch (_e) {
    // ignore
  }
  return defaults;
}

function saveSettings(nextSettings) {
  const file = getStateFilePath();
  try {
    fs.writeFileSync(file, JSON.stringify(nextSettings, null, 2), 'utf8');
  } catch (_e) {
    // ignore
  }
  return nextSettings;
}

// ---------------------------------------------------------------------------
// 本地引擎 HTTP 探测 (真实端点：/health /v1/status /v1/telemetry /metrics ...)
function httpRequestJson(urlStr, options = {}) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const headers = {
        Accept: 'application/json',
        ...(options.headers || {})
      };
      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json'; // /unload /config 等控制端点要求 JSON 体
      }
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port,
          path: u.pathname + u.search,
          method: options.method || 'GET',
          headers,
          timeout: options.timeout || 1500
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
            if (data.length > 4 * 1024 * 1024) req.destroy();
          });
          res.on('end', () => {
            let parsed = null;
            try {
              parsed = JSON.parse(data);
            } catch (_e) {
              /* keep null */
            }
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data: parsed,
              text: parsed ? undefined : data
            });
          });
        }
      );
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'timeout' });
      });
      if (options.body !== undefined) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

// nvidia-smi 后备探测（引擎离线时仍可显示显卡状态）
async function queryGpuHardware() {
  try {
    const { stdout } = await execFileAsync(
      'nvidia-smi',
      ['--query-gpu=index,name,memory.total,memory.used,utilization.gpu,temperature.gpu,power.draw', '--format=csv,noheader,nounits'],
      { timeout: 2500, windowsHide: true }
    );
    const lines = stdout.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      return lines.map((line) => {
        const p = line.split(',').map((s) => s.trim());
        const totalMib = parseFloat(p[2]) || 0;
        const usedMib = parseFloat(p[3]) || 0;
        return {
          index: parseInt(p[0], 10) || 0,
          name: p[1] || 'GPU',
          vramTotalGb: round1(totalMib / 1024),
          vramUsedGb: round1(usedMib / 1024),
          loadPercent: parseFloat(p[4]) || 0,
          tempC: parseFloat(p[5]) || 0,
          powerW: Math.round(parseFloat(p[6])) || 0,
          source: 'nvidia-smi'
        };
      });
    }
  } catch (_e) {
    // ignore
  }
  return null;
}

// ---------------------------------------------------------------------------
// 插件动作日志 + 真实引擎日志尾部
const managedProcesses = { logBuffer: [], enginePid: null, startedAt: null, lastCommand: null };

// strata update / components rollback 的后台进程状态（升级可能持续数分钟）
const updateProc = {
  pid: null,
  startedAt: null,
  command: null,
  logPath: path.join(os.tmpdir(), 'dsh-strata-ai-center-update.log')
};

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

// 从 CLI 输出中解析 JSON 对象行（stderr 警告可能混在其中）
function parseJsonObjectLines(text) {
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    try {
      out.push(JSON.parse(t));
    } catch (_e) {
      /* skip */
    }
  }
  return out;
}

// 解析 cmd.exe 的绝对路径：DSH 宿主进程的 PATH 可能被精简，裸 'cmd.exe' 会 ENOENT。
// ComSpec 几乎总被设置；再兜底 SystemRoot\System32。
function resolveCmdExe() {
  const candidates = [
    process.env.ComSpec,
    path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe'),
    'C:\\Windows\\System32\\cmd.exe'
  ];
  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return c;
    } catch (_e) {
      /* next */
    }
  }
  return 'cmd.exe';
}

// 子进程 cwd 保护：目录不存在时宁可不传（无效 cwd 也会导致 spawn ENOENT）
function safeCwd(dir) {
  try {
    if (dir && fs.existsSync(dir)) return dir;
  } catch (_e) {
    /* ignore */
  }
  return undefined;
}

function appendLog(line) {
  const ts = new Date().toISOString().slice(11, 19);
  managedProcesses.logBuffer.push(`[${ts}] ${line}`);
  if (managedProcesses.logBuffer.length > 300) {
    managedProcesses.logBuffer.shift();
  }
}

function tailFile(filePath, maxLines) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.slice(-maxLines);
  } catch (_e) {
    return [];
  }
}

function newestFile(dir, suffix) {
  try {
    if (!fs.existsSync(dir)) return null;
    let best = null;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(suffix)) continue;
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isFile() && (!best || st.mtimeMs > best.mtimeMs)) {
        best = { path: full, mtimeMs: st.mtimeMs };
      }
    }
    return best;
  } catch (_e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 「本机安装路径」各字段的实际解析：保存值在磁盘上存在则沿用，否则按 Strata 自身规则探测回填。
// 规则来源: engine_component.components_dir() 与 discovery.data_dir()/data_dir_choices()。
function dataDirEntryOf(settingsFile) {
  try {
    const d = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    if (d && typeof d.data_dir === 'string' && d.data_dir) {
      let at = Number(d.data_dir_at);
      if (!(at > 0)) {
        try {
          at = fs.statSync(settingsFile).mtimeMs;
        } catch (_e) {
          at = 0;
        }
      }
      return { dir: d.data_dir, at };
    }
  } catch (_e) {
    /* ignore */
  }
  return null;
}

function holdsModels(folder) {
  try {
    return ['Models', 'models', 'packs'].some((sub) => {
      const p = path.join(folder, sub);
      return fs.existsSync(p) && fs.statSync(p).isDirectory() && fs.readdirSync(p).length > 0;
    });
  } catch (_e) {
    return false;
  }
}

function documentsDirs() {
  const out = [];
  const home = os.homedir();
  if (process.env.STRATA_DOCUMENTS_DIR) out.push(process.env.STRATA_DOCUMENTS_DIR);
  if (process.platform === 'win32') {
    const user = process.env.USERPROFILE || home;
    out.push(path.join(user, 'Documents'));
    for (const key of ['OneDrive', 'OneDriveConsumer', 'OneDriveCommercial']) {
      if (process.env[key]) out.push(path.join(process.env[key], 'Documents'));
    }
  } else {
    if (process.env.XDG_DOCUMENTS_DIR) out.push(process.env.XDG_DOCUMENTS_DIR);
    out.push(path.join(home, 'Documents'));
  }
  return [...new Set(out)];
}

function resolveInstallPaths(settings) {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const isWin = process.platform === 'win32';
  const exists = (p) => {
    try {
      return Boolean(p) && fs.existsSync(p);
    } catch (_e) {
      return false;
    }
  };
  const detected = detectStrataPaths();
  const paths = {};
  const sources = {};

  // strata CLI 与终端目录
  paths.strataCliPath = exists(settings.strataCliPath)
    ? settings.strataCliPath
    : detected && exists(detected.strataCliPath)
    ? detected.strataCliPath
    : settings.strataCliPath;
  sources.strataCliPath = exists(paths.strataCliPath) ? (paths.strataCliPath === settings.strataCliPath ? 'saved' : 'detected') : 'missing';

  // v2.5.5：无 bin/<cli> 与 strata.py、但含 python+serve（serve 回退启动所需）的目录也认作终端目录
  const isTerminal = (d) =>
    exists(path.join(d, 'bin', isWin ? 'strata.cmd' : 'strata')) ||
    exists(path.join(d, 'strata.py')) ||
    (exists(path.join(d, 'python', isWin ? 'python.exe' : 'python')) && exists(path.join(d, 'serve', 'server.py')));
  paths.terminalDir = isTerminal(settings.terminalDir) ? settings.terminalDir : detected ? detected.terminalDir : settings.terminalDir;
  sources.terminalDir = isTerminal(paths.terminalDir) ? (paths.terminalDir === settings.terminalDir ? 'saved' : 'detected') : 'missing';

  // 安装根目录（terminal 的上两级；终端缺失时退而求其次：实际存在的根目录候选）
  paths.strataInstallDir = exists(settings.strataInstallDir)
    ? settings.strataInstallDir
    : (detected && detected.strataInstallDir) ||
      strataRootCandidates(localAppData, home).find((r) => exists(r) && r !== home) ||
      path.dirname(path.dirname(paths.terminalDir));
  sources.strataInstallDir = exists(paths.strataInstallDir)
    ? paths.strataInstallDir === settings.strataInstallDir ? 'saved' : 'detected'
    : 'missing';

  // 组件目录：STRATA_COMPONENTS_DIR > 保存值 > <root>/components > %LOCALAPPDATA%/Strata/components
  const hasComponents = (d) => exists(d) && (exists(path.join(d, 'engine')) || exists(path.join(d, '.updates')));
  if (process.env.STRATA_COMPONENTS_DIR && hasComponents(process.env.STRATA_COMPONENTS_DIR)) {
    paths.strataComponentsDir = process.env.STRATA_COMPONENTS_DIR;
    sources.strataComponentsDir = 'env';
  } else if (hasComponents(settings.strataComponentsDir)) {
    paths.strataComponentsDir = settings.strataComponentsDir;
    sources.strataComponentsDir = 'saved';
  } else {
    const cands = [
      path.join(paths.strataInstallDir, 'components'),
      ...strataRootCandidates(localAppData, home).map((r) => path.join(r, 'components')),
      path.join(localAppData, 'Strata', 'components')
    ];
    const hit = cands.find(hasComponents);
    paths.strataComponentsDir = hit || settings.strataComponentsDir || cands[cands.length - 1];
    sources.strataComponentsDir = hit ? 'detected' : 'missing';
  }

  // 数据目录：STRATA_DATA_DIR > 保存值 > 设置文件 data_dir(own/app 后改者胜) > Documents/Strata 含模型 > 默认
  if (process.env.STRATA_DATA_DIR && exists(process.env.STRATA_DATA_DIR)) {
    paths.strataDataDir = process.env.STRATA_DATA_DIR;
    sources.strataDataDir = 'env';
  } else if (exists(settings.strataDataDir)) {
    paths.strataDataDir = settings.strataDataDir;
    sources.strataDataDir = 'saved';
  } else {
    const appSettings = path.join(path.dirname(paths.strataComponentsDir), 'app-settings.json');
    const entries = [
      dataDirEntryOf(ownSettingsFile()) ? { ...dataDirEntryOf(ownSettingsFile()), source: 'settings' } : null,
      dataDirEntryOf(appSettings) ? { ...dataDirEntryOf(appSettings), source: 'app' } : null
    ].filter(Boolean).sort((a, b) => b.at - a.at);
    let found = null;
    for (const e of entries) {
      if (e.source === 'settings') {
        found = { dir: e.dir, src: 'settings-file' };
        break;
      }
      if (e.source === 'app' && exists(e.dir)) {
        found = { dir: e.dir, src: 'app-settings' };
        break;
      }
    }
    if (!found) {
      for (const d of documentsDirs()) {
        const cand = path.join(d, 'Strata');
        if (holdsModels(cand)) {
          found = { dir: cand, src: 'documents' };
          break;
        }
      }
    }
    if (!found && exists(`${paths.strataInstallDir}-Models`)) found = { dir: `${paths.strataInstallDir}-Models`, src: 'default' };
    if (found) {
      paths.strataDataDir = found.dir;
      sources.strataDataDir = found.src;
    } else {
      paths.strataDataDir = settings.strataDataDir;
      sources.strataDataDir = 'missing';
    }
  }

  // 首选运行配置目录：保存值存在则沿用，否则用第一个实际发现配置的目录
  if (exists(settings.runConfigDir)) {
    paths.runConfigDir = settings.runConfigDir;
    sources.runConfigDir = 'saved';
  } else {
    const first = discoverRunConfigPlaces(settings)[0];
    if (first) {
      paths.runConfigDir = first.path;
      sources.runConfigDir = 'detected';
    } else {
      paths.runConfigDir = settings.runConfigDir;
      sources.runConfigDir = 'missing';
    }
  }

  return { paths, sources };
}

// ---------------------------------------------------------------------------
// 运行配置 (strata-<model>.json) 的多目录发现：strata_control/discovery.py places() 的移植。
// 顺序：面板设置的目录 (explicit) > STRATA_INSTALL_DIR > STRATA_DATA_DIR/install >
//       终端自身目录 (here) > 设置文件记住的 installs (remembered) > 桌面应用共享 install (app)。
function isRunConfigName(name) {
  return (
    typeof name === 'string' &&
    name.startsWith('strata-') &&
    name.endsWith('.json') &&
    !name.endsWith('.shared-settings.json') &&
    name.length > 'strata-.json'.length
  );
}

function listRunConfigFiles(dir) {
  try {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
    return fs.readdirSync(dir).filter(isRunConfigName).sort();
  } catch (_e) {
    return [];
  }
}

function ownSettingsFile() {
  if (process.env.STRATA_SETTINGS_FILE) return process.env.STRATA_SETTINGS_FILE;
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Strata', 'settings.json');
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'strata', 'settings.json');
}

function rememberedInstalls(settingsFile) {
  try {
    const d = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    const items = d && Array.isArray(d.installs) ? d.installs : [];
    return items
      .filter((x) => typeof x === 'string' && x && path.isAbsolute(x))
      .slice(0, 20)
      .filter((p) => !/(^|[\\/])\$recycle\.bin([\\/]|$)|(^|[\\/])\.trash(-\d+)?([\\/]|$)|([\\/])trash[\\/](files|info|expunged)/i.test(p));
  } catch (_e) {
    return [];
  }
}

function discoverRunConfigPlaces(settings) {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const compDefault = path.join(localAppData, 'Strata', 'components');
  const compDir = settings.strataComponentsDir && fs.existsSync(settings.strataComponentsDir)
    ? settings.strataComponentsDir
    : compDefault;
  const appRoot = path.dirname(compDir); // Windows: %LOCALAPPDATA%\Strata；自定义盘: <root>

  const cands = [];
  if (settings.runConfigDir) cands.push([settings.runConfigDir, 'explicit']);
  if (process.env.STRATA_INSTALL_DIR) cands.push([process.env.STRATA_INSTALL_DIR, 'explicit']);
  if (process.env.STRATA_DATA_DIR) cands.push([path.join(process.env.STRATA_DATA_DIR, 'install'), 'datadir']);
  if (settings.terminalDir) cands.push([settings.terminalDir, 'here']); // 源码 checkout 跑过 setup 时配置在终端目录内
  for (const p of rememberedInstalls(ownSettingsFile())) cands.push([p, 'remembered']);
  cands.push([path.join(appRoot, 'install'), 'app']); // 桌面应用与终端共享的安装目录
  for (const p of rememberedInstalls(path.join(appRoot, 'app-settings.json'))) cands.push([p, 'app']);

  const seen = new Set();
  const out = [];
  for (const [dir, source] of cands) {
    let key;
    try {
      key = fs.realpathSync(dir).toLowerCase();
    } catch (_e) {
      key = path.resolve(dir).toLowerCase();
    }
    if (seen.has(key)) continue;
    seen.add(key);
    const configs = listRunConfigFiles(dir);
    if (configs.length > 0) out.push({ path: dir, source, configCount: configs.length });
  }
  return out;
}

// 按发现顺序找 strata-<modelId>.json；找不到返回 null
function findRunConfigFile(settings, modelId) {
  const fileName = `strata-${String(modelId || '').toLowerCase()}.json`;
  for (const place of discoverRunConfigPlaces(settings)) {
    const full = path.join(place.path, fileName);
    try {
      if (fs.existsSync(full)) return { path: full, place: place.source, dir: place.path };
    } catch (_e) {
      // ignore
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 本地安装扫描：strata-<model>.json 运行配置 / 终端版本 / 引擎组件 / 数据包 / 预设
function scanStrataInstallation(settings) {
  // 聚合所有发现目录里的运行配置（同名文件以先发现的目录为准，同 discovery/catalog 的去重规则）
  const places = discoverRunConfigPlaces(settings);
  const runConfigs = [];
  const seenFiles = new Set();
  for (const place of places) {
    for (const entry of listRunConfigFiles(place.path)) {
      if (seenFiles.has(entry)) continue;
      seenFiles.add(entry);
      const fullPath = path.join(place.path, entry);
      let parsed = null;
      try {
        parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      } catch (_e) {
        /* keep null */
      }
      const modelId = entry.replace(/^strata-/i, '').replace(/\.json$/i, '').toLowerCase();
      runConfigs.push({
        modelId,
        file: entry,
        path: fullPath,
        place: place.source,
        exists: true,
        modelName: parsed ? parsed.model_name || null : null,
        port: parsed ? parsed.port || null : null,
        context: parsed ? parsed.context || null : null,
        kv: parsed ? parsed.kv || null : null,
        mtp: parsed ? Boolean(parsed.mtp) : null,
        vramReserveMib: parsed ? parsed.vram_reserve_mib ?? null : null,
        vision: parsed ? Boolean(parsed.vision) : null,
        modifiedAt: fs.statSync(fullPath).mtime.toISOString()
      });
    }
  }

  const listDir = (p) => {
    try {
      return fs.existsSync(p) ? fs.readdirSync(p).filter((n) => !n.startsWith('.')) : [];
    } catch (_e) {
      return [];
    }
  };

  // 终端目录优先取 current 指向的版本目录名
  let terminalVersion = null;
  try {
    const cur = path.join(settings.strataInstallDir || '', 'terminal', 'current');
    if (fs.existsSync(cur)) {
      terminalVersion = path.basename(fs.realpathSync(cur));
    }
  } catch (_e) {
    /* ignore */
  }

  const presets = [];
  try {
    if (fs.existsSync(settings.presetsDir)) {
      for (const entry of fs.readdirSync(settings.presetsDir)) {
        if (!entry.endsWith('.json')) continue;
        try {
          const p = JSON.parse(fs.readFileSync(path.join(settings.presetsDir, entry), 'utf8'));
          presets.push({
            name: p.name || entry.replace(/\.json$/i, ''),
            model: p.model || null,
            context: p.context || null,
            kv: p.kv || null,
            vision: p.vision || null,
            mtp: p.mtp || null,
            port: p.port || null,
            usedAt: p.used_at || p.saved_at || null
          });
        } catch (_e) {
          /* skip bad preset */
        }
      }
    }
  } catch (_e) {
    /* ignore */
  }

  const cliFound = Boolean(settings.strataCliPath && fs.existsSync(settings.strataCliPath));
  const bundledPython = path.join(settings.terminalDir || '', 'python', 'python.exe');
  const serverPy = path.join(settings.terminalDir || '', 'serve', 'server.py');

  return {
    cliFound,
    cliPath: settings.strataCliPath,
    terminalDir: settings.terminalDir,
    terminalVersion,
    terminalVersions: listDir(path.join(settings.strataInstallDir || '', 'terminal')),
    bundledPython: fs.existsSync(bundledPython) ? bundledPython : null,
    serverPy: fs.existsSync(serverPy) ? serverPy : null,
    runConfigDir: settings.runConfigDir, // 面板设置的首选目录
    runConfigPlaces: places, // 实际发现的全部目录（含来源标记）
    runConfigs,
    componentsDir: settings.strataComponentsDir,
    engines: listDir(path.join(settings.strataComponentsDir || '', 'engine')),
    dataDir: settings.strataDataDir,
    packs: listDir(path.join(settings.strataDataDir || '', 'packs')),
    presetsDir: settings.presetsDir,
    presets,
    launchStateDir: settings.launchStateDir
  };
}

// 组件升级状态：D:\Strata\components\.updates\state.json（strata_control/updater.py 维护）
function readUpdaterState(settings) {
  try {
    const file = path.join(settings.strataComponentsDir || '', '.updates', 'state.json');
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_e) {
    return null;
  }
}

// 回读运行配置 strata-<model>.json（面板表单的真值来源）。
// 引擎旗标以 args 为准（runconfig.py 的规则：顶层镜像字段可能滞后），其余键读对应字段。
function readRunConfigSnapshot(settings) {
  const found = findRunConfigFile(settings, settings.selectedModel);
  const fallback = path.join(settings.runConfigDir, `strata-${(settings.selectedModel || '').toLowerCase()}.json`);
  const configFile = found ? found.path : fallback;
  const empty = { path: configFile, exists: false, values: null, place: found ? found.place : null };
  try {
    if (!found) return empty;
    const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const args = Array.isArray(cfg.args) ? cfg.args : [];
    const argVal = (flag) => {
      const i = args.indexOf(flag);
      if (i !== -1 && i < args.length - 1) {
        const v = args[i + 1];
        return /^\d+$/.test(String(v)) ? Number(v) : v;
      }
      return null;
    };
    const numOr = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const s = cfg.sampling || {};
    return {
      path: configFile,
      exists: true,
      place: found.place,
      values: {
        // 引擎环境变量块（cfg.env，server.py child_env 会应用到引擎进程）；缺省即空
        engineEnv:
          cfg.env && typeof cfg.env === 'object' && !Array.isArray(cfg.env)
            ? Object.fromEntries(Object.entries(cfg.env).map(([k, v]) => [String(k), String(v)]))
            : {},
        temperature: numOr(s.temperature),
        topP: numOr(s.top_p),
        topK: numOr(s.top_k),
        minP: numOr(s.min_p),
        presencePenalty: numOr(s.presence_penalty),
        reasoningEffort: typeof cfg.reasoning_effort === 'string' ? cfg.reasoning_effort : null,
        reasoningBudgetTokens: numOr(cfg.reasoning_budget_tokens),
        // 这四个键"缺省即默认"，回读时直接解析成生效值，避免插件快照残留旧值
        apiMonitor: cfg.api_monitor === true,
        idleUnloadS: numOr(cfg.idle_unload_s) ?? 0,
        fitMaxTokens: cfg.fit_max_tokens !== false,
        engineSilenceS: numOr(cfg.engine_silence_s) ?? 300,
        anthropicThinking: cfg.anthropic_thinking === 'model' || cfg.anthropic_thinking === 'on_request' ? cfg.anthropic_thinking : '',
        vramReserveMib: argVal('--vram-reserve-mib') ?? numOr(cfg.vram_reserve_mib),
        kvResident: argVal('--kv-resident'),
        pcieFrac: (() => {
          const v = argVal('--pcie-frac');
          return v != null && Number.isFinite(Number(v)) ? Number(v) : null;
        })(),
        contextLength: argVal('--max-context') ?? numOr(cfg.context),
        kvFormat: argVal('--kv') || (typeof cfg.kv === 'string' ? cfg.kv : null),
        mtpEnabled: typeof cfg.mtp === 'boolean' ? cfg.mtp : null
      }
    };
  } catch (_e) {
    return empty;
  }
}

// ---------------------------------------------------------------------------
// 组装完整状态：全部来自真实端点 / 真实文件，无编造数值
async function gatherFullStatus(settings, pathSources = null) {
  const engineUrl = `http://127.0.0.1:${settings.enginePort}`;
  const headers = settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {};

  const [health, v1status, telemetry, metrics, configResp] = await Promise.all([
    httpRequestJson(`${engineUrl}/health`, { headers, timeout: 1200 }),
    httpRequestJson(`${engineUrl}/v1/status`, { headers, timeout: 1200 }),
    httpRequestJson(`${engineUrl}/v1/telemetry`, { headers, timeout: 1200 }),
    httpRequestJson(`${engineUrl}/metrics`, { headers, timeout: 1200 }),
    httpRequestJson(`${engineUrl}/config`, { headers, timeout: 1200 })
  ]);

  const online = Boolean(health.ok);
  const h = (health.ok && health.data) || {};
  const st = (v1status.ok && v1status.data) || {};
  const tel = (telemetry.ok && telemetry.data) || {};
  const met = (metrics.ok && metrics.data) || {};
  const mEngine = met.engine || {};
  const live = met.live || {};
  const last = st.last_timings || {};

  // 显卡：优先 /v1/telemetry devices，其次 /v1/status machine.gpu，最后 nvidia-smi
  let gpus = null;
  if (Array.isArray(tel.devices) && tel.devices.length > 0) {
    gpus = tel.devices.map((d) => ({
      index: d.index ?? 0,
      name: d.name || 'GPU',
      vramTotalGb: round1((d.mem_total || 0) / 1024 ** 3),
      vramUsedGb: round1((d.mem_used || 0) / 1024 ** 3),
      loadPercent: d.util ?? 0,
      tempC: d.temp ?? 0,
      powerW: Math.round((d.power || 0) * 10) / 10,
      source: 'telemetry'
    }));
  } else if (st.machine && st.machine.gpu && st.machine.gpu.total_mib) {
    const g = st.machine.gpu;
    gpus = [{
      index: 0,
      name: g.name || 'GPU',
      vramTotalGb: round1(g.total_mib / 1024),
      vramUsedGb: round1(g.used_mib / 1024),
      loadPercent: g.util_pct ?? 0,
      tempC: g.temp_c ?? 0,
      powerW: g.power_w ?? 0,
      source: 'v1/status'
    }];
  }
  if (!gpus) {
    gpus = (await queryGpuHardware()) || [];
  }

  // 内存：优先 telemetry 字节值
  let ram = null;
  if (tel.ram && tel.ram.total) {
    ram = { totalGb: round1(tel.ram.total / 1024 ** 3), usedGb: round1(tel.ram.used / 1024 ** 3) };
  } else if (st.machine && st.machine.ram && st.machine.ram.total_gib) {
    ram = { totalGb: st.machine.ram.total_gib, usedGb: st.machine.ram.used_gib };
  }
  if (!ram) {
    const totalBytes = os.totalmem();
    ram = { totalGb: round1(totalBytes / 1024 ** 3), usedGb: round1((totalBytes - os.freemem()) / 1024 ** 3) };
  }

  const cpus = os.cpus() || [];
  const scan = scanStrataInstallation(settings);
  const installedIds = new Set(scan.runConfigs.map((r) => r.modelId));

  const vramGb = gpus.length > 0 ? Math.max(...gpus.map((g) => g.vramTotalGb || 0)) : 0;

  const draftN = Number.isFinite(last.draft_n) ? last.draft_n : null;
  const draftAccepted = Number.isFinite(last.draft_n_accepted) ? last.draft_n_accepted : null;

  const decodeTokPerSec = Number.isFinite(last.predicted_per_second)
    ? last.predicted_per_second
    : Number.isFinite(live.tok_s)
    ? live.tok_s
    : Number.isFinite(tel.rates && tel.rates.answer_tok_s)
    ? tel.rates.answer_tok_s
    : null;
  const prefillTokPerSec = Number.isFinite(last.prompt_per_second)
    ? last.prompt_per_second
    : Number.isFinite(live.prefill_tok_s_mean)
    ? live.prefill_tok_s_mean
    : null;

  // 模型目录 + 实时适配评估
  const catalog = [];
  for (const fam of MODEL_TABLE) {
    for (const size of fam.sizes) {
      const fit = fitOn(size, ram.totalGb, vramGb);
      const words = fitWords(fit);
      catalog.push({
        family: fam.family,
        familyTitle: FAMILIES[fam.family].title,
        title: `${FAMILIES[fam.family].title} ${size.model}`,
        id: size.id,
        about: size.about,
        downloadGb: size.downloadGb,
        memoryGb: size.memoryGb,
        ramNeededGb: size.ramNeededGb,
        expertsGb: size.expertsGb,
        memTotal: Boolean(size.memTotal),
        images: size.images !== false,
        installed: installedIds.has(size.id),
        launchable: fam.family !== 'deepseek41',
        fit,
        fitLevel: words.level,
        fitText: words.text,
        kvGb: kvGbFor(Number(settings.contextLength) || 131072, settings.kvFormat || 'int8')
      });
    }
  }
  const selected = catalog.find((m) => m.id === settings.selectedModel) || catalog[0];

  const engineLog = newestFile(settings.launchStateDir, '.engine.log');
  const launchLogPath = path.join(os.tmpdir(), 'dsh-strata-ai-center-launch.log');

  // ---- 表单真值来源：回读 strata-<model>.json 覆盖插件快照 ----
  const fileSnap = readRunConfigSnapshot(settings);
  const mergedSettings = { ...settings };
  if (fileSnap.values) {
    for (const [k, v] of Object.entries(fileSnap.values)) {
      if (v !== null && v !== undefined) mergedSettings[k] = v;
    }
  }

  // 运行实例一侧的实际值（/config 读的是它自己持有的配置文件 + 引擎实时参数），
  // 只用于展示差异，不覆盖表单——避免把运行中的旧值写回文件。
  const liveValues = {};
  let liveConfigFile = null;
  if (online) {
    const liveCfg = {};
    if (configResp.ok && configResp.data && Array.isArray(configResp.data.keys)) {
      liveConfigFile = configResp.data.file || null;
      for (const k of configResp.data.keys) liveCfg[k.key] = k.value;
    }
    const numOr = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    if (numOr(liveCfg['sampling.temperature']) != null) liveValues.temperature = numOr(liveCfg['sampling.temperature']);
    if (numOr(liveCfg['sampling.top_p']) != null) liveValues.topP = numOr(liveCfg['sampling.top_p']);
    if (numOr(liveCfg['sampling.top_k']) != null) liveValues.topK = numOr(liveCfg['sampling.top_k']);
    liveValues.minP = liveCfg['sampling.min_p'] == null ? (liveConfigFile ? 0 : null) : numOr(liveCfg['sampling.min_p']);
    liveValues.reasoningBudgetTokens = liveCfg['reasoning_budget_tokens'] == null ? (liveConfigFile ? 0 : null) : numOr(liveCfg['reasoning_budget_tokens']);
    liveValues.apiMonitor = liveCfg['api_monitor'] === true;
    liveValues.idleUnloadS = liveCfg['idle_unload_s'] == null ? (liveConfigFile ? 0 : null) : numOr(liveCfg['idle_unload_s']);
    liveValues.fitMaxTokens =
      typeof liveCfg['fit_max_tokens'] === 'boolean' ? liveCfg['fit_max_tokens'] : liveConfigFile ? true : null;
    liveValues.engineSilenceS =
      numOr(liveCfg['engine_silence_s']) != null ? numOr(liveCfg['engine_silence_s']) : liveConfigFile ? 300 : null;
    liveValues.anthropicThinking =
      typeof liveCfg['anthropic_thinking'] === 'string' ? liveCfg['anthropic_thinking'] : liveConfigFile ? '' : null;
    if (numOr(liveCfg['vram_reserve_mib']) != null) liveValues.vramReserveMib = numOr(liveCfg['vram_reserve_mib']);
    if (typeof liveCfg['mtp'] === 'boolean') liveValues.mtpEnabled = liveCfg['mtp'];
    if (h.max_context || (st.context && st.context.native)) liveValues.contextLength = h.max_context || st.context.native;
    if (mEngine.kv) liveValues.kvFormat = mEngine.kv;
    if (mEngine.kv_resident != null) liveValues.kvResident = mEngine.kv_resident;
    if (mEngine.pcie_frac != null && Number.isFinite(Number(mEngine.pcie_frac))) {
      liveValues.pcieFrac = Number(mEngine.pcie_frac);
    }
  }
  const DIFF_LABELS = {
    temperature: '温度', topP: 'Top-P', topK: 'Top-K', minP: 'Min-P',
    reasoningBudgetTokens: '思考预算', apiMonitor: 'API 监控页', idleUnloadS: '空闲卸载(秒)',
    fitMaxTokens: 'fit_max_tokens', engineSilenceS: '引擎静默超时(秒)', anthropicThinking: 'Anthropic 思考',
    vramReserveMib: '显存预留(MiB)', mtpEnabled: 'MTP', contextLength: '上下文', pcieFrac: 'PCIe 份额',
    kvFormat: 'KV 格式', kvResident: 'KV 常驻'
  };
  const liveDiffs = [];
  for (const [k, v] of Object.entries(liveValues)) {
    if (v === null || v === undefined) continue;
    if (String(mergedSettings[k]) !== String(v)) {
      liveDiffs.push({ key: k, label: DIFF_LABELS[k] || k, configured: mergedSettings[k], running: v });
    }
  }

  return {
    ok: true,
    timestamp: Date.now(),
    pluginVersion: PLUGIN_VERSION,
    engine: {
      online,
      service: h.service || 'strata',
      version: st.engine || (mEngine.version) || null,
      model: h.model || st.model || null,
      loaded: Boolean(h.loaded ?? st.loaded),
      state: (tel.instance && tel.instance.state) || (online ? (h.loaded ? 'ready' : 'loaded:false') : 'stopped'),
      context: h.max_context || (st.context && st.context.native) || null,
      uptimeS: st.uptime_s ?? null,
      // /metrics engine 块的真实引擎参数
      kv: mEngine.kv || null,
      kvResident: mEngine.kv_resident ?? null,
      spec: mEngine.spec ?? null,
      specMinP: mEngine.spec_min_p ?? null,
      expertSlots: mEngine.expert_slots ?? null,
      expertCacheMib: mEngine.expert_cache_mib ?? null,
      totalExperts: UMA_EXPERTS,
      poolWorkers: mEngine.pool_workers ?? null,
      pcieFrac: mEngine.pcie_frac ?? null,
      vramFreeMib: mEngine.vram_free_mib ?? null,
      // 速度（来自最近一次请求的 timings 或实时速率）
      decodeTokPerSec,
      prefillTokPerSec,
      mtpDraftN: draftN,
      mtpDraftAccepted: draftAccepted,
      mtpAcceptRate: draftN && draftAccepted != null && draftN > 0 ? +(draftAccepted / draftN).toFixed(2) : null,
      requests: (st.activity && st.activity.requests) ?? null,
      inFlight: (st.activity && st.activity.in_flight) ?? null,
      concurrency: st.concurrency || null,
      dialects: st.dialects || null,
      vision: st.vision || null,
      recent: Array.isArray(tel.recent) ? tel.recent.slice(0, 5) : [],
      totals: tel.totals || null,
      openaiBaseUrl: `${engineUrl}/v1`,
      port: settings.enginePort
    },
    hardware: {
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      cpuModel: cpus[0] ? cpus[0].model.trim() : '',
      cpuCores: cpus.length || 0,
      ram,
      gpus
    },
    installation: scan,
    catalog,
    selectedModel: selected ? { id: selected.id, title: selected.title, fit: selected.fit, fitText: selected.fitText } : null,
    update: { running: isPidAlive(updateProc.pid) },
    contexts: CONTEXTS,
    settings: mergedSettings,
    pathSources,
    settingsSources: {
      runConfigFile: { path: fileSnap.path, exists: fileSnap.exists, place: fileSnap.place || null },
      liveConfigFile: online ? liveConfigFile : null
    },
    liveDiffs,
    logs: {
      actions: managedProcesses.logBuffer.slice(-60),
      engineLog: engineLog ? tailFile(engineLog.path, 25) : [],
      engineLogPath: engineLog ? engineLog.path : null,
      launchLog: tailFile(launchLogPath, 15),
      launchLogPath
    }
  };
}

// ---------------------------------------------------------------------------
// 运行配置写入：与 serve/runconfig.py 的规则一致（只动列出的键，其余原样保留，先写 .bak）
function setArgFlag(args, flag, value) {
  const a = Array.isArray(args) ? [...args] : [];
  const i = a.indexOf(flag);
  if (i !== -1 && i < a.length - 1) {
    if (value == null) {
      a.splice(i, 2);
    } else {
      a[i + 1] = String(value);
    }
  } else if (value != null) {
    a.push(flag, String(value));
  }
  return a;
}

function applyRunConfigFile(settings) {
  const found = findRunConfigFile(settings, settings.selectedModel);
  const configFile = found ? found.path : path.join(settings.runConfigDir, `strata-${(settings.selectedModel || '').toLowerCase()}.json`);
  const result = { configFile, existed: false, changed: [], error: null };
  try {
    if (!found) {
      result.error = `在所有已知目录中未找到 strata-${(settings.selectedModel || '').toLowerCase()}.json（引擎参数将在下次 strata launch 时生成）`;
      return result;
    }
    result.existed = true;
    const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));

    const sampling = { ...(cfg.sampling || {}) };
    sampling.temperature = Number(settings.temperature);
    sampling.top_p = Number(settings.topP);
    sampling.top_k = Number(settings.topK);
    if (Number(settings.minP) > 0) sampling.min_p = Number(settings.minP);
    else delete sampling.min_p;
    sampling.presence_penalty = Number(settings.presencePenalty) || 0;
    cfg.sampling = sampling;
    result.changed.push('sampling.temperature', 'sampling.top_p', 'sampling.top_k', 'sampling.presence_penalty');

    cfg.reasoning_effort = settings.reasoningEffort || 'none';
    cfg.reasoning_budget_tokens = Number(settings.reasoningBudgetTokens) || 0;
    result.changed.push('reasoning_effort', 'reasoning_budget_tokens');

    if (settings.apiMonitor) cfg.api_monitor = true;
    else delete cfg.api_monitor;
    result.changed.push('api_monitor');

    if (Number(settings.idleUnloadS) > 0) cfg.idle_unload_s = Number(settings.idleUnloadS);
    else delete cfg.idle_unload_s;
    result.changed.push('idle_unload_s');

    // fit_max_tokens: 默认开；仅在显式关闭时写 false，true 时删除键走默认
    if (settings.fitMaxTokens === false) cfg.fit_max_tokens = false;
    else delete cfg.fit_max_tokens;
    result.changed.push('fit_max_tokens');

    // engine_silence_s: 默认 300；等于默认值时删除键，0 = 一直等待（显式写入）
    const silenceS = Number(settings.engineSilenceS);
    if (Number.isFinite(silenceS) && silenceS >= 0 && silenceS !== 300) cfg.engine_silence_s = silenceS;
    else delete cfg.engine_silence_s;
    result.changed.push('engine_silence_s');

    // anthropic_thinking: 枚举 model|on_request；仅写合法值（非法值会使服务器拒启），未设置即删除键
    if (settings.anthropicThinking === 'model' || settings.anthropicThinking === 'on_request') {
      cfg.anthropic_thinking = settings.anthropicThinking;
    } else {
      delete cfg.anthropic_thinking;
    }
    result.changed.push('anthropic_thinking');

    cfg.vram_reserve_mib = Number(settings.vramReserveMib) || 700;
    cfg.args = setArgFlag(cfg.args, '--vram-reserve-mib', cfg.vram_reserve_mib);
    result.changed.push('vram_reserve_mib');

    if (Number(settings.kvResident) > 0) {
      cfg.args = setArgFlag(cfg.args, '--kv-resident', Number(settings.kvResident));
    }
    result.changed.push('kv_resident');

    // pcie-frac: 0~1 有效则写入旗标；0/无效则移除已有旗标（回到调优/引擎默认）
    const pcieFracNum = Number(settings.pcieFrac);
    if (pcieFracNum > 0 && pcieFracNum <= 1) {
      cfg.args = setArgFlag(cfg.args, '--pcie-frac', pcieFracNum);
    } else {
      cfg.args = setArgFlag(cfg.args, '--pcie-frac', null);
    }
    result.changed.push('pcie-frac');

    // 引擎环境变量块（STRATA_*）：空则删除键走默认，非空则整体覆盖为清洗后的字符串表
    const engineEnv = settings.engineEnv && typeof settings.engineEnv === 'object' ? settings.engineEnv : {};
    const envClean = {};
    for (const [k, v] of Object.entries(engineEnv)) {
      if (typeof k === 'string' && k.trim() && v !== null && v !== undefined && String(v).trim() !== '') {
        envClean[k.trim()] = String(v).trim();
      }
    }
    if (Object.keys(envClean).length > 0) cfg.env = envClean;
    else delete cfg.env;
    result.changed.push('env(STRATA_*)');

    cfg.context = Number(settings.contextLength) || 131072;
    cfg.kv = settings.kvFormat || 'int8';
    cfg.args = setArgFlag(cfg.args, '--max-context', cfg.context);
    cfg.args = setArgFlag(cfg.args, '--kv', cfg.kv);
    if (Array.isArray(cfg.args_written)) {
      cfg.args_written = [...cfg.args];
    }
    result.changed.push('context', 'kv');

    // 备份 + 原子替换（同 runconfig.save 的做法）
    try {
      fs.copyFileSync(configFile, `${configFile}.bak`);
    } catch (_e) {
      /* 备份失败不阻断 */
    }
    const tmp = `${configFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cfg, null, 1), 'utf8');
    fs.renameSync(tmp, configFile);
    appendLog(`已按 runconfig 规则更新: ${configFile} (${result.changed.length} 项)`);
  } catch (err) {
    result.error = err.message;
    appendLog(`更新运行配置失败: ${err.message}`);
  }
  return result;
}

// 引擎在线时，把服务端支持的键同步给运行实例 (POST /config，由服务器校验并写它自己的配置)
async function pushConfigToRunningServer(settings) {
  const engineUrl = `http://127.0.0.1:${settings.enginePort}`;
  const headers = settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {};
  const health = await httpRequestJson(`${engineUrl}/health`, { headers, timeout: 1200 });
  if (!health.ok) return { online: false };
  const set = {
    'sampling.temperature': Number(settings.temperature),
    'sampling.top_p': Number(settings.topP),
    'sampling.top_k': Number(settings.topK),
    'sampling.min_p': Number(settings.minP) > 0 ? Number(settings.minP) : null,
    reasoning_budget_tokens: Number(settings.reasoningBudgetTokens) || 0,
    api_monitor: Boolean(settings.apiMonitor),
    idle_unload_s: Number(settings.idleUnloadS) > 0 ? Number(settings.idleUnloadS) : null,
    fit_max_tokens: settings.fitMaxTokens === false ? false : null,
    engine_silence_s:
      Number.isFinite(Number(settings.engineSilenceS)) && Number(settings.engineSilenceS) !== 300
        ? Number(settings.engineSilenceS)
        : null,
    anthropic_thinking:
      settings.anthropicThinking === 'model' || settings.anthropicThinking === 'on_request'
        ? settings.anthropicThinking
        : null,
    vram_reserve_mib: Number(settings.vramReserveMib) || 700
  };
  const resp = await httpRequestJson(`${engineUrl}/config`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    timeout: 4000,
    body: { set }
  });
  return { online: true, ok: resp.ok, status: resp.status, data: resp.data || resp.text || resp.error || null };
}

// ---------------------------------------------------------------------------
// 启动命令：与 launch-iq3s-128k.ps1 相同的 strata launch 调用
function buildLaunchCommand(settings, opts = {}) {
  const args = [
    settings.strataCliPath,
    'launch',
    '--model', settings.selectedModel || 'iq3_s',
    '--context', String(Number(settings.contextLength) || 131072), // CLI 接受 "128k" 或直接 token 数
    '--kv', settings.kvFormat || 'int8',
    '--vision', settings.visionMode || 'cpu',
    '--mtp', settings.mtpEnabled === false ? 'off' : 'on',
    '--access', settings.access || 'local',
    '--port', String(settings.enginePort || 8080),
    '--yes',
    '--no-tui'
  ];
  if (Number(settings.parallel) > 0) args.push('--parallel', String(settings.parallel));
  args.push('--set', `kv-resident=${Number(settings.kvResident) || 65536}`);
  args.push('--set', `vram-reserve-mib=${Number(settings.vramReserveMib) || 1280}`);
  if (Number(settings.pcieFrac) > 0 && Number(settings.pcieFrac) <= 1) {
    args.push('--set', `pcie-frac=${Number(settings.pcieFrac)}`);
  }
  // 引擎环境变量：--set STRATA_X=V 会被 launch 分流进运行配置的 env 块（settings.as_argv_changes）
  for (const [k, v] of Object.entries(settings.engineEnv || {})) {
    if (k && String(v).trim() !== '') args.push('--set', `${k}=${String(v).trim()}`);
  }
  if (opts.restart) args.push('--restart');
  if (settings.apiKey && settings.apiKey.trim()) {
    args.push('--api-key', settings.apiKey.trim());
  } else if (settings.access !== 'local') {
    args.push('--no-api-key');
  }
  return args; // [cliPath, 'launch', ...]
}

function buildLaunchEnv(settings) {
  const env = {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    PYTHONUTF8: '1'
  };
  env.STRATA_INSTALL_DIR = settings.strataInstallDir || 'D:\\Strata';
  env.STRATA_COMPONENTS_DIR = settings.strataComponentsDir || 'D:\\Strata\\components';
  env.STRATA_DATA_DIR = settings.strataDataDir || 'D:\\Strata-Models';
  if (settings.useProxyAndMirror !== false) {
    env.HTTP_PROXY = 'http://127.0.0.1:7897';
    env.HTTPS_PROXY = 'http://127.0.0.1:7897';
    env.HF_ENDPOINT = 'https://hf-mirror.com';
  } else {
    delete env.HTTP_PROXY;
    delete env.HTTPS_PROXY;
    delete env.HF_ENDPOINT;
  }
  if (settings.apiKey && settings.apiKey.trim()) {
    env.STRATA_API_KEY = settings.apiKey.trim();
  } else {
    delete env.STRATA_API_KEY; // 空 STRATA_API_KEY 会导致启动失败
  }
  // 引擎环境变量直接进入子进程环境（server.py 的 child_env 会原样带给引擎进程）
  for (const [k, v] of Object.entries(settings.engineEnv || {})) {
    if (k && String(v).trim() !== '') env[k] = String(v).trim();
  }
  // PATH 可能被宿主进程精简：确保 System32 在内（cmd 内部命令、nvidia-smi 等都依赖它）
  const sys32 = path.join(process.env.SystemRoot || env.SystemRoot || 'C:\\Windows', 'System32');
  if (env.PATH) {
    const parts = String(env.PATH).split(';').map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (!parts.includes(sys32.toLowerCase())) env.PATH = `${sys32};${env.PATH}`;
  } else {
    env.PATH = sys32;
  }
  return env;
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(data);
}

// ---------------------------------------------------------------------------

export function createRouteHandler(pluginConfig = {}) {
  let currentSettings = loadSettings(pluginConfig);

  async function runCli(cliArgs, timeoutMs) {
    // strata.cmd 不能被 Node 直接 spawn，需经 cmd.exe /c
    const cmd = currentSettings.strataCliPath || 'D:\\Strata\\terminal\\current\\bin\\strata.cmd';
    const { stdout, stderr } = await execFileAsync(resolveCmdExe(), ['/c', cmd, ...cliArgs], {
      cwd: safeCwd(currentSettings.terminalDir),
      env: buildLaunchEnv(currentSettings),
      timeout: timeoutMs || 30000,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024
    });
    return `${stdout || ''}${stderr ? `\n${stderr}` : ''}`.trim();
  }

  return async function handleRequest(req, res) {
    const urlObj = new URL(req.url || '/', 'http://127.0.0.1');
    const subPath = urlObj.pathname.slice(ROUTE_PREFIX.length) || '/status';

    // 「安装路径」字段按实际磁盘情况解析（保存值无效时自动发现回填），对本次请求全部生效
    const pathResolution = resolveInstallPaths(currentSettings);
    currentSettings = { ...currentSettings, ...pathResolution.paths };

    try {
      if (req.method === 'GET' && (subPath === '/status' || subPath === '/ping')) {
        const status = await gatherFullStatus(currentSettings, pathResolution.sources);
        return sendJson(res, 200, status);
      }

      if (req.method === 'GET' && subPath === '/diagnose') {
        // 远程机器排障：候选根目录逐项探测结果 + 解析详情，一键复制给维护者
        const home = os.homedir();
        const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
        const isWin = process.platform === 'win32';
        const cliName = isWin ? 'strata.cmd' : 'strata';
        const exists = (p) => {
          try {
            return Boolean(p) && fs.existsSync(p);
          } catch (_e) {
            return false;
          }
        };
        const servePair = (d) =>
          exists(path.join(d, 'python', isWin ? 'python.exe' : 'python')) && exists(path.join(d, 'serve', 'server.py'));
        const terminalProbes = strataRootCandidates(localAppData, home).map((root) => {
          const cur = path.join(root, 'terminal', 'current');
          let versions = [];
          try {
            versions = fs
              .readdirSync(path.join(root, 'terminal'))
              .filter((n) => /^\d+\.\d+/.test(n))
              .map((n) => ({
                name: n,
                hasCli: exists(path.join(root, 'terminal', n, 'bin', cliName)),
                hasServe: servePair(path.join(root, 'terminal', n))
              }));
          } catch (_e) {
            /* no terminal dir */
          }
          return {
            root,
            rootExists: exists(root),
            rootHasCli: exists(path.join(root, 'bin', cliName)),
            currentHasCli: exists(path.join(cur, 'bin', cliName)),
            currentHasServe: servePair(cur),
            versions
          };
        });
        const resolution = resolveInstallPaths(currentSettings);
        return sendJson(res, 200, {
          ok: true,
          pluginVersion: PLUGIN_VERSION,
          platform: `${os.type()} ${os.release()} ${os.arch()}`,
          env: {
            STRATA_INSTALL_DIR: process.env.STRATA_INSTALL_DIR || null,
            STRATA_COMPONENTS_DIR: process.env.STRATA_COMPONENTS_DIR || null,
            STRATA_DATA_DIR: process.env.STRATA_DATA_DIR || null,
            STRATA_SETTINGS_FILE: process.env.STRATA_SETTINGS_FILE || null,
            DSH_HOME: process.env.DSH_HOME || null
          },
          savedPaths: {
            strataCliPath: currentSettings.strataCliPath,
            terminalDir: currentSettings.terminalDir,
            strataInstallDir: currentSettings.strataInstallDir,
            strataComponentsDir: currentSettings.strataComponentsDir,
            strataDataDir: currentSettings.strataDataDir,
            runConfigDir: currentSettings.runConfigDir
          },
          resolvedPaths: resolution.paths,
          pathSources: resolution.sources,
          detected: detectStrataPaths(),
          terminalProbes,
          runConfigPlaces: discoverRunConfigPlaces(currentSettings),
          ownSettingsFile: ownSettingsFile(),
          launchCommandPreview: buildLaunchCommand(currentSettings, { restart: false }).join(' ')
        });
      }

      if (req.method === 'POST' && subPath === '/settings') {
        const body = await readJsonBody(req);
        if (body && typeof body === 'object') {
          currentSettings = saveSettings({ ...currentSettings, ...body, settingsVersion: SETTINGS_VERSION });
        }
        const fileResult = applyRunConfigFile(currentSettings);
        const serverResult = await pushConfigToRunningServer(currentSettings);
        const status = await gatherFullStatus(currentSettings);
        return sendJson(res, 200, {
          ok: true,
          message:
            `参数已保存${fileResult.changed.length ? `并写入 ${fileResult.configFile}` : ''}` +
            (serverResult.online ? (serverResult.ok ? '；运行实例的配置文件已同步（该实例下次启动时生效）' : '；运行实例拒绝同步，详见 syncResult') : '') +
            '。上下文/KV/视觉等引擎参数在下次启动或重启后生效。',
          fileResult,
          syncResult: serverResult,
          status
        });
      }

      if (req.method === 'POST' && subPath === '/engine/start') {
        const body = await readJsonBody(req);
        if (body && typeof body === 'object') {
          currentSettings = saveSettings({ ...currentSettings, ...body, settingsVersion: SETTINGS_VERSION });
        }
        applyRunConfigFile(currentSettings);

        const engineUrl = `http://127.0.0.1:${currentSettings.enginePort}`;
        const headers = currentSettings.apiKey ? { Authorization: `Bearer ${currentSettings.apiKey}` } : {};
        const health = await httpRequestJson(`${engineUrl}/health`, { headers, timeout: 1000 });
        const restart = Boolean(health.ok);

        const launchLogPath = path.join(os.tmpdir(), 'dsh-strata-ai-center-launch.log');
        let launchedMode = null;
        let commandPreview = '';
        try {
          if (currentSettings.strataCliPath && fs.existsSync(currentSettings.strataCliPath)) {
            const args = buildLaunchCommand(currentSettings, { restart });
            commandPreview = args.join(' ');
            appendLog(`${restart ? '重启' : '启动'} Strata: ${commandPreview}`);
            const outFd = fs.openSync(launchLogPath, 'a');
            fs.writeSync(outFd, `\n[${new Date().toISOString()}] ${commandPreview}\n`);
            const child = spawn(resolveCmdExe(), ['/c', ...args], {
              cwd: safeCwd(currentSettings.terminalDir) || safeCwd(path.dirname(currentSettings.strataCliPath)),
              env: buildLaunchEnv(currentSettings),
              detached: true,
              stdio: ['ignore', outFd, outFd],
              windowsHide: true
            });
            child.unref();
            managedProcesses.enginePid = child.pid;
            managedProcesses.startedAt = Date.now();
            managedProcesses.lastCommand = commandPreview;
            launchedMode = restart ? 'strata launch --restart' : 'strata launch';
          } else {
            // 后备：与 run-<model>.bat 相同的直接启动方式（配置文件按发现规则定位）
            const bundledPython = path.join(currentSettings.terminalDir || '', 'python', 'python.exe');
            const serverPy = path.join(currentSettings.terminalDir || '', 'serve', 'server.py');
            const cfgFound = findRunConfigFile(currentSettings, currentSettings.selectedModel);
            const configFile = cfgFound
              ? cfgFound.path
              : path.join(currentSettings.runConfigDir, `strata-${(currentSettings.selectedModel || '').toLowerCase()}.json`);
            if (fs.existsSync(bundledPython) && fs.existsSync(serverPy) && fs.existsSync(configFile)) {
              commandPreview = `${bundledPython} ${serverPy} --engine strata --config ${configFile} --port ${currentSettings.enginePort}`;
              appendLog(`通过 serve/server.py 启动: ${commandPreview}`);
              const outFd = fs.openSync(launchLogPath, 'a');
              const child = spawn(bundledPython, [serverPy, '--engine', 'strata', '--config', configFile, '--port', String(currentSettings.enginePort || 8080)], {
                cwd: path.dirname(serverPy),
                env: buildLaunchEnv(currentSettings),
                detached: true,
                stdio: ['ignore', outFd, outFd],
                windowsHide: true
              });
              child.unref();
              managedProcesses.enginePid = child.pid;
              managedProcesses.startedAt = Date.now();
              managedProcesses.lastCommand = commandPreview;
              launchedMode = 'serve/server.py';
            } else {
              appendLog(`启动失败：找不到 strata.cmd 或 server.py (${currentSettings.strataCliPath})`);
              return sendJson(res, 500, {
                ok: false,
                error: `未找到 Strata CLI (${currentSettings.strataCliPath}) 或 ${serverPy}。请在设置中核对安装路径。`
              });
            }
          }
        } catch (err) {
          appendLog(`启动失败: ${err.message}`);
          return sendJson(res, 500, { ok: false, error: err.message });
        }

        return sendJson(res, 200, {
          ok: true,
          launchedMode,
          restart,
          pid: managedProcesses.enginePid,
          command: commandPreview,
          launchLogPath
        });
      }

      if (req.method === 'POST' && subPath === '/engine/stop') {
        // strata launch --stop：停止本机 launch 启动的服务并卸载模型
        let output = '';
        let ok = false;
        try {
          if (currentSettings.strataCliPath && fs.existsSync(currentSettings.strataCliPath)) {
            appendLog('正在停止服务: strata launch --stop');
            output = await runCli(['launch', '--stop', '--output', 'json'], 90000);
            ok = true;
            appendLog(`停止命令完成: ${output.split(/\r?\n/).slice(-2).join(' ')}`);
          } else {
            throw new Error(`未找到 ${currentSettings.strataCliPath}`);
          }
        } catch (err) {
          output = String(err.stdout || err.stderr || err.message || err);
          appendLog(`停止失败: ${output.slice(0, 200)}`);
          return sendJson(res, 500, { ok: false, error: output.slice(0, 500) });
        }
        return sendJson(res, 200, { ok, output: output.slice(0, 2000) });
      }

      if (req.method === 'POST' && subPath === '/engine/unload') {
        // POST /unload：请求之间立即归还显存（auto_load 会在下次请求时重新加载）
        const engineUrl = `http://127.0.0.1:${currentSettings.enginePort}`;
        const headers = currentSettings.apiKey ? { Authorization: `Bearer ${currentSettings.apiKey}` } : {};
        appendLog(`向 ${engineUrl}/unload 发送卸载请求`);
        const resp = await httpRequestJson(`${engineUrl}/unload`, {
          method: 'POST',
          headers,
          timeout: 20000,
          body: {}
        });
        if (resp.ok) {
          appendLog(`卸载完成: ${JSON.stringify(resp.data)}`);
          return sendJson(res, 200, { ok: true, result: resp.data });
        }
        const busy = resp.status === 409;
        appendLog(`卸载未完成 (HTTP ${resp.status})`);
        return sendJson(res, busy ? 200 : 502, {
          ok: false,
          busy,
          status: resp.status,
          error: busy ? '有请求正在运行或排队，稍后重试' : resp.error || `HTTP ${resp.status}`
        });
      }

      if (req.method === 'GET' && subPath === '/launch-status') {
        // strata launch --status：由 launch 体系报告的运行实例（按需调用，避免轮询开销）
        try {
          const output = await runCli(['launch', '--status', '--output', 'json'], 45000);
          let parsed = null;
          try {
            parsed = JSON.parse(output);
          } catch (_e) {
            /* 人读格式 */
          }
          return sendJson(res, 200, { ok: true, raw: output.slice(0, 4000), data: parsed });
        } catch (err) {
          return sendJson(res, 500, { ok: false, error: String(err.stdout || err.stderr || err.message || err).slice(0, 1000) });
        }
      }

      if (req.method === 'POST' && subPath === '/web/open') {
        const url = `http://127.0.0.1:${currentSettings.enginePort}/`;
        try {
          const child = spawn(resolveCmdExe(), ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true });
          child.unref();
          appendLog(`已在浏览器打开 Web 控制台: ${url}`);
          return sendJson(res, 200, { ok: true, url });
        } catch (err) {
          return sendJson(res, 500, { ok: false, error: err.message, url });
        }
      }

      if (req.method === 'POST' && subPath === '/benchmark') {
        const engineUrl = `http://127.0.0.1:${currentSettings.enginePort}`;
        const headers = {
          'Content-Type': 'application/json',
          ...(currentSettings.apiKey ? { Authorization: `Bearer ${currentSettings.apiKey}` } : {})
        };
        const health = await httpRequestJson(`${engineUrl}/health`, { headers, timeout: 1200 });
        if (!health.ok) {
          appendLog('基准测试失败：引擎未运行');
          return sendJson(res, 200, { ok: false, error: '引擎未运行，请先启动模型' });
        }
        const model = (health.data && health.data.model) || 'strata';
        appendLog(`基准测试: 向 ${model} 发送 max_tokens=64 请求`);
        const t0 = Date.now();
        const resp = await httpRequestJson(`${engineUrl}/v1/chat/completions`, {
          method: 'POST',
          headers,
          timeout: 60000,
          body: {
            model,
            messages: [{ role: 'user', content: 'Write a 2-line Python function to reverse a list.' }],
            max_tokens: 64,
            temperature: 0,
            stream: false
          }
        });
        const elapsedSec = Math.max(0.05, (Date.now() - t0) / 1000);
        if (resp.ok && resp.data) {
          const usage = resp.data.usage || {};
          const timings = resp.data.timings || {};
          const completionTokens = usage.completion_tokens ?? timings.predicted_n ?? 0;
          const tokPerSec = Number.isFinite(timings.predicted_per_second)
            ? timings.predicted_per_second
            : +(completionTokens / elapsedSec).toFixed(1);
          const prefill = Number.isFinite(timings.prompt_per_second) ? timings.prompt_per_second : null;
          appendLog(`基准测试完成: ${completionTokens} tokens / ${elapsedSec.toFixed(2)}s, 解码 ${tokPerSec} tok/s${prefill ? `, 预填充 ${prefill} tok/s` : ''}`);
          return sendJson(res, 200, {
            ok: true,
            live: true,
            tokPerSec,
            prefillTokPerSec: prefill,
            completionTokens,
            promptTokens: usage.prompt_tokens ?? null,
            elapsedSec: +elapsedSec.toFixed(2),
            timings
          });
        }
        appendLog(`基准测试请求失败: HTTP ${resp.status}`);
        return sendJson(res, 200, { ok: false, error: `请求失败: HTTP ${resp.status} ${resp.error || ''}`.trim() });
      }

      if (req.method === 'GET' && subPath === '/update/check') {
        // strata update --check --output json：只读更新源并报告将发生的变化，不下载组件
        const feed = (currentSettings.updateFeed || '').trim();
        const args = ['update', '--check', '--output', 'json'];
        if (feed) args.push('--feed', feed);
        appendLog(`检查更新: strata ${args.join(' ')}`);
        let output = '';
        try {
          output = await runCli(args, 150000);
        } catch (err) {
          output = String(err.stdout || err.stderr || err.message || err);
          appendLog(`检查更新失败: ${output.slice(0, 200)}`);
          return sendJson(res, 200, { ok: false, error: output.slice(0, 1000), raw: output.slice(0, 2000) });
        }
        const objs = parseJsonObjectLines(output);
        const report = objs.find((o) => o.schema_version === 1 && o.feed && o.engine) || null;
        appendLog(report
          ? `检查完成: 引擎 ${report.engine.status}${report.engine.offered ? ' (源提供 ' + report.engine.offered.version + ')' : ''}, Control ${report.control.status}`
          : `检查输出无法解析: ${output.slice(0, 160)}`);
        return sendJson(res, 200, {
          ok: Boolean(report),
          report,
          componentState: readUpdaterState(currentSettings),
          running: isPidAlive(updateProc.pid),
          raw: report ? undefined : output.slice(0, 2000)
        });
      }

      if (req.method === 'GET' && subPath === '/update/status') {
        const tail = tailFile(updateProc.logPath, 60);
        // 从日志尾部找最终结果行（jsonl 事件行带 event 字段，最终结果不带）
        let lastResult = null;
        for (let i = tail.length - 1; i >= 0; i--) {
          const t = tail[i].trim();
          if (!t.startsWith('{')) continue;
          try {
            const obj = JSON.parse(t);
            if (obj.schema_version === 1 && !obj.event) {
              lastResult = obj;
              break;
            }
          } catch (_e) {
            /* skip */
          }
        }
        return sendJson(res, 200, {
          ok: true,
          running: isPidAlive(updateProc.pid),
          pid: updateProc.pid,
          startedAt: updateProc.startedAt,
          command: updateProc.command,
          logPath: updateProc.logPath,
          logTail: tail.slice(-40),
          lastResult,
          componentState: readUpdaterState(currentSettings)
        });
      }

      if (req.method === 'POST' && subPath === '/update/apply') {
        const body = await readJsonBody(req);
        if (body && typeof body.feed === 'string' && body.feed.trim()) {
          currentSettings = saveSettings({ ...currentSettings, updateFeed: body.feed.trim(), settingsVersion: SETTINGS_VERSION });
        }
        if (isPidAlive(updateProc.pid)) {
          return sendJson(res, 409, { ok: false, error: '已有升级任务在运行中' });
        }
        // 引擎服务中时更新会被拒绝 (exit 7)，先停止 launch 启动的服务
        if (body.stopFirst !== false) {
          const engineUrl = `http://127.0.0.1:${currentSettings.enginePort}`;
          const headers = currentSettings.apiKey ? { Authorization: `Bearer ${currentSettings.apiKey}` } : {};
          const health = await httpRequestJson(`${engineUrl}/health`, { headers, timeout: 1200 });
          if (health.ok) {
            appendLog('升级前停止服务: strata launch --stop');
            try {
              await runCli(['launch', '--stop', '--output', 'json'], 90000);
            } catch (err) {
              appendLog(`停止服务输出: ${String(err.stdout || err.stderr || err.message || err).slice(0, 200)}`);
            }
          }
        }
        const args = ['update', '--output', 'jsonl'];
        if (body.force) args.push('--force');
        const feed = (currentSettings.updateFeed || '').trim();
        if (feed) args.push('--feed', feed);
        appendLog(`开始升级: strata ${args.join(' ')}（下载校验需数分钟，日志见 ${updateProc.logPath}）`);
        const outFd = fs.openSync(updateProc.logPath, 'a');
        fs.writeSync(outFd, `\n[${new Date().toISOString()}] strata ${args.join(' ')}\n`);
        const child = spawn(resolveCmdExe(), ['/c', currentSettings.strataCliPath, ...args], {
          cwd: safeCwd(currentSettings.terminalDir) || safeCwd(path.dirname(currentSettings.strataCliPath)),
          env: buildLaunchEnv(currentSettings),
          detached: true,
          stdio: ['ignore', outFd, outFd],
          windowsHide: true
        });
        child.unref();
        updateProc.pid = child.pid;
        updateProc.startedAt = Date.now();
        updateProc.command = `strata ${args.join(' ')}`;
        return sendJson(res, 200, { ok: true, pid: child.pid, logPath: updateProc.logPath, command: updateProc.command });
      }

      if (req.method === 'POST' && subPath === '/update/rollback') {
        // strata components rollback：回到最近一次升级保留的旧引擎版本
        if (isPidAlive(updateProc.pid)) {
          return sendJson(res, 409, { ok: false, error: '已有升级任务在运行中' });
        }
        const state = readUpdaterState(currentSettings);
        const previous = state && state.engine && state.engine.previous;
        if (!previous) {
          return sendJson(res, 200, { ok: false, error: '没有可回滚的旧版本（最近一次升级未保留 previous，或从未升级过）' });
        }
        if (body && body.stopFirst !== false) {
          const engineUrl = `http://127.0.0.1:${currentSettings.enginePort}`;
          const headers = currentSettings.apiKey ? { Authorization: `Bearer ${currentSettings.apiKey}` } : {};
          const health = await httpRequestJson(`${engineUrl}/health`, { headers, timeout: 1200 });
          if (health.ok) {
            appendLog('回滚前停止服务: strata launch --stop');
            try {
              await runCli(['launch', '--stop', '--output', 'json'], 90000);
            } catch (err) {
              appendLog(`停止服务输出: ${String(err.stdout || err.stderr || err.message || err).slice(0, 200)}`);
            }
          }
        }
        const args = ['components', 'rollback', '--output', 'jsonl'];
        appendLog(`回滚引擎: strata ${args.join(' ')}`);
        const outFd = fs.openSync(updateProc.logPath, 'a');
        fs.writeSync(outFd, `\n[${new Date().toISOString()}] strata ${args.join(' ')}\n`);
        const child = spawn(resolveCmdExe(), ['/c', currentSettings.strataCliPath, ...args], {
          cwd: safeCwd(currentSettings.terminalDir) || safeCwd(path.dirname(currentSettings.strataCliPath)),
          env: buildLaunchEnv(currentSettings),
          detached: true,
          stdio: ['ignore', outFd, outFd],
          windowsHide: true
        });
        child.unref();
        updateProc.pid = child.pid;
        updateProc.startedAt = Date.now();
        updateProc.command = `strata ${args.join(' ')}`;
        return sendJson(res, 200, { ok: true, pid: child.pid, logPath: updateProc.logPath, previous });
      }

      return sendJson(res, 404, { ok: false, error: `Unknown route: ${subPath}` });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  };
}

export function apply(ctx, config = {}) {
  const handler = createRouteHandler(config);

  if (ctx && typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (innerCtx) => {
      const dispose = innerCtx.webServer.register({
        kind: 'prefix',
        path: ROUTE_PREFIX,
        handler
      });
      if (typeof innerCtx.effect === 'function') {
        innerCtx.effect(() => dispose, 'dsh-strata-ai-center:routes');
      }
    });
  } else if (ctx && ctx.webServer && typeof ctx.webServer.register === 'function') {
    ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler
    });
  }
}

export default { name, inject, apply, createRouteHandler };
