# dsh-strata-ai-center 交接文档（v2.5.3，2026-10-25）

> 写给接手维护的 AI / 开发者。目标：读完即可安全地继续开发、测试、发布本插件。
> 一切"为什么这样做"的坑都记录在 §7，改动前务必先读。

## 1. 项目概览

**dsh-strata-ai-center** 是 DeepSeek Harness (DSH) 的本地插件，在左侧栏「记忆系统」下方加一个「AI管理中心」面板，管理本机安装的 [Strata](https://github.com/Niko1221/Strata) 推理引擎：启停模型、编辑运行配置、组件升级回滚、真实监控数据。

| 项 | 值 |
| --- | --- |
| 插件源码目录（也是 DSH 实际加载目录） | `C:\Users\Administrator\.dsh\profiles\desktop\dsh-strata-ai-center` |
| GitHub 仓库 | https://github.com/newgacker/dsh-strata-ai-center （公开，main 分支） |
| 当前版本 | 2.5.3（commit `913e268`） |
| 文件构成 | `package.json`、`cordis.patch.yml`、`install-plugin.ps1`、`README.md`、`LICENSE`(MIT)、`lib/index.js`(host 端 ~1500 行)、`lib/client.js`(client 端 ~1700 行)、本文件 |
| 插件状态文件（每机独立，不入库） | `~/.dsh/strata-ai-center/settings.json`（settingsVersion=2） |

**设计底线（不可违反）**：所有路径、命令、端点、数值必须与本机真实 Strata 对应，禁止编造/虚构默认数据（v1.0.1 就是这么写坏的）。无数据时如实显示"—/未找到"。

## 2. 架构与 DSH 插件机制

- **加载方式**：`~/.dsh/profiles/desktop/node_modules/dsh-strata-ai-center` 是指向源码目录的符号链接；profile 的 `package.json` dependencies + `dsh.profile.bundles` 已注册。改源码后**完全退出 DSH（含托盘）重开**才重载 host 模块。
- **host 端 `lib/index.js`**（Node ESM）：`apply()` 把 `createRouteHandler()` 注册为 DSH webServer 的前缀路由 `/__dsh-strata-ai-center/*`。路由清单：`GET /status`、`GET /ping`、`GET /diagnose`、`POST /settings`、`POST /engine/start`、`POST /engine/stop`、`POST /engine/unload`、`POST /web/open`、`POST /benchmark`、`GET /launch-status`、`GET /update/check`、`GET /update/status`、`POST /update/apply`、`POST /update/rollback`。
- **client 端 `lib/client.js`**（IIFE + `window.__ModuleLoader__` 工厂，ES5 风格 `React.createElement`）：注册 `sidebar.panellist` 入口和 `main` 槽位的面板；三个标签页（监控/模型与参数/升级）。所有数据来自 `/status` 轮询（2.5s，页面不可见时暂停）。
- **每次请求入口处**都执行 `resolveInstallPaths()`（§4.1）与路径回填，全路由生效。

## 3. 本机 Strata 安装事实（开发机，RTX 3080 10GB + 64GB RAM）

- CLI：`D:\Strata\terminal\current\bin\strata.cmd`（current 是 junction → 0.1.49.2）；自带 Python `terminal\current\python\python.exe`；服务入口 `terminal\current\serve\server.py`
- 运行配置：`D:\Strata\strata-<model>.json`（已装 iq3_s、q2_0）；launch 生成的 profile 配置在 `%LOCALAPPDATA%\Strata\launch\iq3_s-128k.json`；预设 `%APPDATA%\Strata\launch-presets`（有 "IQ3_S 128K"）；真实引擎日志 `%LOCALAPPDATA%\Strata\launch\*.engine.log`
- 引擎组件：`D:\Strata\components\engine\0.1.48-windows-x86_64-cuda-cuda13`；注意 `%LOCALAPPDATA%\Strata\components` 是空壳（只有 .updates，无 engine），**不是**有效组件目录
- Strata 自己的设置 `%APPDATA%\Strata\settings.json`：`installs: ["D:\\Strata"]`、`data_dir: "D:\\Strata-Models"`
- 托管启动脚本（用户参照物）：`C:\Users\Administrator\AppData\Local\Temp\launch-iq3s-128k.ps1`
- HTTP 端点（:8080，全部实测存在）：`/health`、`/v1/status`（含 `last_timings` 速度/draft 接受率、`machine`）、`/v1/telemetry`（`devices`/`ram`/`recent`）、`/metrics`（JSON，`engine` 块含 kv/kv_resident/expert_slots/expert_cache_mib/spec/pool_workers/pcie_frac/vram_free_mib）、`/v1/chat/completions`（响应带 `timings`）、`/v1/messages`、`/v1/responses`、`GET|POST /config`、`POST /unload`、`POST /load`；`/api-monitor` 仅当 `api_monitor=true` 时存在
- 模型专家总量 24576（48 层 × 512，setup.py `UMA_EXPERTS`）

## 4. 关键对接规则（全部从 Strata 源码移植，勿凭感觉改）

### 4.1 路径自动发现
- **终端目录与 CLI**：根候选 `STRATA_INSTALL_DIR` > `D:\Strata` > `%LOCALAPPDATA%\Strata` > `~/.local/share/strata`；每个根先试 `terminal\current`，**没有 current 就扫 `terminal\<版本目录>` 取最大版本**（v2.4.2 修的坑）；**v2.5.5**：CLI 还认根级 `bin\strata(.cmd)`（「源码 checkout+本地构建」布局，例：`D:\Strata\bin\strata.cmd`）；无 `bin\` 但含 `python\python(.exe)`+`serve\server.py` 的终端目录也认（serve 回退启动结构）；根命中条件放宽为「bin 终端 / serve 终端 / 根级 CLI」任一即可；`detected` 增加 `terminalKind`（bin/serve），`/diagnose` 探针增加 `rootHasCli`/`currentHasServe`/`versions[].hasServe`。
- **运行配置目录**（移植 `strata_control/discovery.py places()`）：面板目录 > `STRATA_INSTALL_DIR` > `STRATA_DATA_DIR\install` > 终端自身目录 > `%APPDATA%\Strata\settings.json` 的 `installs`（`STRATA_SETTINGS_FILE` 可覆盖）> `<components>\..\install` 及其 `app-settings.json` 的 `installs`；忽略回收站/Trash；排除 `*.shared-settings.json`；同名配置先命中者优先
- **组件目录**（`engine_component.components_dir()`）：`STRATA_COMPONENTS_DIR` > `<root>\components` > `%LOCALAPPDATA%\Strata\components`，须含 `engine/` 或 `.updates/`
- **数据目录**（`discovery.data_dir()`）：`STRATA_DATA_DIR` > 设置文件 `data_dir`（own 与 app 后改者胜）> `app-settings.json` > `Documents\Strata`（含 OneDrive，须含模型）> `<root>-Models`
- **路径字段回填**（`resolveInstallPaths`）：保存值存在则沿用（来源 `saved`），无效时按上述规则回填（`detected`/`env`/`settings-file`…），来源通过 `/status.pathSources` 暴露、面板逐字段标注

### 4.2 运行配置读写（`serve/runconfig.py` 规则）
- 保存时：先备份 `.bak`，写临时文件再 rename；**只动认识的键，其余原样保留**
- 引擎旗标写 `args`（`--vram-reserve-mib`、`--kv-resident`、`--max-context`、`--kv`、`--pcie-frac`），顶层镜像字段（`context`/`kv`/`vram_reserve_mib`）同步，`args_written` 若存在也同步；**args 是权威，镜像可能滞后**
- "缺省即默认"键（`api_monitor`/`idle_unload_s`/`fit_max_tokens`/`engine_silence_s`/`anthropic_thinking`）：未设置=删除键走默认，回读解析成生效值
- `anthropic_thinking` 是强校验枚举 `model|on_request`，**非法值会让服务器拒绝启动**——只写合法值
- 引擎在线时同时 `POST /config {"set": {...}}` 同步运行实例（它写自己持有的 profile 配置文件，该实例**下次启动**才生效）；`reasoning_effort`/`presence_penalty`/context/kv 不在 /config 支持范围，只写 D: 文件
- 表单真值来源 = 回读 `strata-<model>.json`（`readRunConfigSnapshot`，args 优先）；与运行实例不一致的键经 `liveDiffs` 在面板黄色提示

### 4.3 启停与升级
- 启动：`strata.cmd launch --model <id> --context <tokens> --kv <fmt> --vision <mode> --mtp on|off --access local --port 8080 --yes --no-tui [--parallel N] --set kv-resident=… --set vram-reserve-mib=… [--set pcie-frac=…] [--set STRATA_X=V…] [--restart(在线时)]`；环境 = `STRATA_INSTALL_DIR/COMPONENTS_DIR/DATA_DIR` (+可选代理 127.0.0.1:7897 与 hf-mirror，默认关)。CLI 缺失时回退 `python serve/server.py --engine strata --config <发现的配置> --port …`（同 run-*.bat）
- 引擎环境变量（`engineEnv`）：写入 `strata-<model>.json` 的 `env` 块 + `launch --set KEY=VALUE`（launch 的 `settings.as_argv_changes` 把非 `--` 且 `STRATA_` 开头的键分流进 `cfg.env`）+ 子进程环境，`server.py child_env` 保证引擎进程收到。`STRATA_ROUTE_TAIL_SKIP` 有专用数字输入框（空=未设置；7=推荐，缺专家 12-16GB 卡 +10~20% 解码；0=强制关；NVFP4 包强制关），直接绑定 engineEnv
- 停止：`strata launch --stop`（整实例停+释放显存）；卸载显存：`POST /unload`（**必须 `Content-Type: application/json`**，否则 415；auto_load 下次请求自动重载）
- 升级：`strata update --check --output json --feed <官方源>`（只读）；正式升级先停服务（否则 exit 7）再后台跑 `strata update --output jsonl [--force]`，日志 `%TEMP%\dsh-strata-ai-center-update.log`，UI 3s 轮询 `/update/status`；回滚 `strata components rollback`（仅当 `.updates/state.json` 的 engine.previous 非空）。**必须显式 `--feed` GitHub 官方源**（组件目录记住的是离线源 `D:\Strata\local-feed`，永远显示已最新）；查新需代理

### 4.4 模型目录
内嵌 setup.py 真实模型表（8 家族 25 尺寸，真实下载/内存数值），`installed` 由扫描 strata-*.json 得出；容量评估移植 `fitOn`（DENSE_GB=5、SYSTEM_ROOM_GB=10、DENSE_EXTRA_GB=1）；KV 估算 `tokens×13×{fp16:2112,int8:1056,q4_0:576,k8v4:816}B`。

## 5. 开发与测试方法（本机实操验证过的）

```bash
# 语法检查（本机无系统 node，用 DSH 自带 Electron）
DSH_EXE="C:/Users/Administrator/AppData/Local/Programs/DeepSeek Harness/DeepSeek Harness.exe"
ELECTRON_RUN_AS_NODE=1 "$DSH_EXE" --check lib/index.js && ELECTRON_RUN_AS_NODE=1 "$DSH_EXE" --check lib/client.js
```

- **冒烟测试**（不依赖 DSH）：`import(pathToFileURL('.../lib/index.js'))` → `createRouteHandler({})` → 用 mock req/res（`{method,url,on(ev,cb){...},destroy(){}}` / `{writeHead,end}`）直接调路由。**用 `DSH_HOME=<临时目录>` 隔离状态文件**；要模拟异机布局再用 `STRATA_INSTALL_DIR`/`STRATA_SETTINGS_FILE` 指向临时目录。测试里写 JSON 文件**用正斜杠路径**（Windows 反斜杠转义在 bash/python 里极易出错）
- **模拟 DSH 精简 PATH**：node 进程内先 `process.env.PATH='C:\某目录'` 再调路由（Electron 本体必须正常 PATH 启动，否则静默无输出）
- **真实启动测试**：引擎离线时 `POST /engine/start` → 轮询 `/health`（~40s 就绪）→ 查 profile 配置 env/args → `POST /engine/stop` 恢复。加载耗 RAM ~62GB/64GB
- **排障入口**：面板「📋 复制诊断信息」= `GET /diagnose`（根候选逐项探测 + 保存值/解析值/来源 + 启动命令预览）；`/status` 带 `pluginVersion`
- 查 DSH 宿主实际跑的代码版本：找 DSH 进程监听端口（`netstat -ano` + tasklist），`curl http://127.0.0.1:<port>/__dsh-strata-ai-center/status` 看 `pluginVersion`/`pathSources` 形状

## 6. 发布流程

```bash
cd C:/Users/Administrator/.dsh/profiles/desktop/dsh-strata-ai-center
# 改 package.json version → 改代码 → 语法检查 → 冒烟
git add -A && git commit -m "vX.Y.Z: ..." && git push origin main
```

- git 推送凭据已存 Windows 凭据管理器（GCM），免密；git 作者 `newgacker <30762765+newgacker@users.noreply.github.com>`
- 用户端更新：`dsh plugin --profile desktop update dsh-strata-ai-center`（`dsh plugin` 原样转发 pnpm）
- **npm 发布未做**（包名 `dsh-strata-ai-center` 未被占用；发布后进 DSH 插件市场 registry.npmjs.org；社区索引 awesome-dsh-plugin.com 可提交收录）

## 7. 踩坑记录（改代码前必读，血泪教训）

1. **spawn 裸 `'cmd.exe'` 在 DSH 宿主内 ENOENT**（libuv 按 PATH 查找，宿主 PATH 被精简；无效 cwd 同样报此错）。一律用 `resolveCmdExe()`（ComSpec > SystemRoot\System32）+ `safeCwd()`；`buildLaunchEnv` 给子进程 PATH 前置 System32。
2. **DSH `patchReload: "live"` 只热更 client，host 模块要完全重启 DSH 才重载**——出现"新版界面+旧版行为"先查宿主 `/status` 的 `pluginVersion`（面板在错配时会红字提示）。
3. **`/unload`、`/config` 等控制端点要求 `Content-Type: application/json` 且无跨域 Origin**——Node 侧 POST 必须带 JSON 头。
4. **配置镜像字段会滞后于 args**（如 vram_reserve_mib 顶层 700 vs args 1280）：读以 args 为准，写要双写。
5. **有的安装没有 `terminal\current`**，只有版本目录——探测必须两步走（v2.4.2）。
6. **`anthropic_thinking` 等强校验键**：非法值让服务器拒启；"缺省即默认"键不设置时要**删除**而非写默认值。
7. **引擎环境变量必须重启模型才生效**；`/config` 不支持 env 键。
8. **升级检查必须显式 `--feed` 官方源**且需代理；`gh auth login --web` 弹出的控制台窗口在本机闪退不可用——GitHub 授权走 GCM（`git credential fill`），gh 用 `GH_TOKEN` 环境变量（GCM 令牌缺 `read:org` 被 `gh auth login` 拒）。
9. **面板表单只回读 `strata-<model>.json`，不回读运行实例内存值**——避免把运行中的旧值写回文件覆盖用户待生效的选择（用 liveDiffs 展示差异而非覆盖）。
10. **测试写 JSON 别用反斜杠路径**（printf/python 转义地狱），用正斜杠；`%APPDATA%\Strata\settings.json` 的 installs 正是真实数据源。
11. 引擎离线时**不要编造监控数据**（v1 的原罪）——显示"—/未运行"。
12. 每次改 host 端后让用户**完全退出 DSH（含托盘）重开**，仅刷新页面无效。

## 8. 待办 / 未验证项

- `POST /update/apply` 从未真实执行过（会停引擎 + 下载 ~554 MiB）；check/status/rollback 已实测
- npm publish（需 npm 账号）、awesome-dsh-plugin.com 收录提交
- 升级页对 DeepSeek-V4.1-Flash 家族（需 `--dsv41-package`）只展示不可启动（`launchable: false`），未做包选择
- Linux/macOS 理论支持（路径候选已含 `~/.local/share/strata`）但从未实测
- 历史遗留：`%LOCALAPPDATA%\Strata\components` 空壳目录可能被误认为组件目录（已在 `hasComponents` 里用 engine/.updates 存在性挡住）

## 9. 外部资源

- Strata 源码本机有一份：`D:\Strata\terminal\0.1.49.2\`（`serve/runconfig.py`、`strata_control/discovery.py`、`engine_component.py`、`strata_cli/launch/*`、`strata_cli/update_cmd.py`、`docs/TERMINAL_LAUNCH.md`、`docs/MANAGEMENT_PROTOCOL.md`）——**遇到行为不确定就读本机源码，比猜靠谱**
- 上游仓库：https://github.com/Niko1221/Strata ；官方更新源 `…/releases/latest/download/strata-feed.json`
- 本插件仓库：https://github.com/newgacker/dsh-strata-ai-center （README 有完整功能与安装文档）
