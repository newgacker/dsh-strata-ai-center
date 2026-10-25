# AI管理中心 (`dsh-strata-ai-center`) — DeepSeek Harness 本地 Strata 引擎管理插件

专为 **DeepSeek Harness (DSH)** 打造的本地 [Strata (`Niko1221/Strata`)](https://github.com/Niko1221/Strata) 引擎管理面板。安装后在 DSH 左侧导航栏 **「记忆系统」** 正下方出现 **「AI管理中心」**，提供 **「监控 (Monitor)」**、**「模型与参数 (Models)」** 与 **「升级 (Update)」** 三个页面。v2.0 起所有路径、命令、端点与字段均与本机实际安装的 Strata 对应（terminal 0.1.49.2 / engine 0.1.48 / Windows），v2.1 新增基于 `strata update` 的组件升级与回滚。

## 与本机安装的对应关系

下表是开发机（自定义安装到 `D:\Strata`）的示例；其他机器上插件会**自动探测** Strata 安装位置（`STRATA_*` 环境变量 > `D:\Strata\terminal\current` > `%LOCALAPPDATA%\Strata\terminal\current`（Windows 一键安装） > `~/.local/share/strata/terminal/current`（Linux/macOS）），探测结果可在「模型与参数 → 安装路径」中手动修正。

**运行配置文件（`strata-<model>.json`）的发现**与 Strata 自身（`strata_control/discovery.py`）同一套规则，按顺序扫描多个目录、取先命中者，并在面板中列出全部命中目录：面板设置的目录 > `STRATA_INSTALL_DIR` > `STRATA_DATA_DIR\install` > 终端自身目录 > `%APPDATA%\Strata\settings.json`（或 `~/.config/strata/settings.json`）记住的 `installs` > 桌面应用共享的 `<components>\..\install` 及其 `app-settings.json` 记住的目录；回收站/Trash 中的目录被忽略，`*.shared-settings.json` 不算运行配置。保存参数时写回该文件**实际所在**的目录。

**「本机安装路径」的字段回填（v2.4）**：每次请求都按实际磁盘解析——保存值存在则沿用，无效时自动发现并回填（CLI/终端目录按常见安装位置探测、安装根目录由终端位置推导、组件目录按 `STRATA_COMPONENTS_DIR > <root>\components > %LOCALAPPDATA%\Strata\components`、数据目录按 Strata 设置文件的 `data_dir`（后改者胜）> `Documents\Strata` 含模型 > 安装根旁默认、首选配置目录取第一个实际含配置的目录）。面板中每个字段标注来源（已保存/环境变量/自动探测/设置文件/未找到），保存参数后回填值即固化。

| 项目 | 开发机示例值 |
| --- | --- |
| strata CLI | `D:\Strata\terminal\current\bin\strata.cmd`（→ `0.1.49.2`） |
| 自带 Python | `D:\Strata\terminal\current\python\python.exe` |
| 服务入口 | `D:\Strata\terminal\current\serve\server.py` |
| 运行配置 | `D:\Strata\strata-<model>.json`（当前生效：`strata-iq3_s.json`） |
| 引擎组件 | `D:\Strata\components\engine\0.1.48-windows-x86_64-cuda-cuda13` |
| 模型数据 | `D:\Strata-Models`（`packs/`、`models/`、`mtp/`） |
| launch 预设 | `%APPDATA%\Strata\launch-presets`（已有 `IQ3_S 128K`） |
| 运行实例状态 | `%LOCALAPPDATA%\Strata\launch\`（`*.engine.log` 等真实日志） |
| 引擎服务 | `http://127.0.0.1:8080`（`/health`、`/v1/status`、`/v1/telemetry`、`/metrics`、`/v1/chat/completions`、`/v1/messages`、`/v1/responses`、`/config`、`/unload`、`/load`） |
| 启动方式 | `strata launch --model iq3_s --context 128k --kv int8 --vision cpu --mtp on --access local --port 8080 --yes --no-tui --set kv-resident=65536 --set vram-reserve-mib=1280` |

## 功能

### 监控页（数据全部来自真实端点）
* **速度**：解码 tokens/s 与预填充 tokens/s（`/v1/status` 的 `last_timings`，或 `/metrics` 的 `live`/`rates`），MTP 接受率（`draft_n_accepted / draft_n`）。
* **显卡**：`/v1/telemetry` 的 `devices`（显存、负载、温度、功耗），后备 `nvidia-smi`；引擎可用显存余量来自 `/metrics` 的 `vram_free_mib`。
* **内存 / CPU**：`/v1/telemetry` 的 `ram`，后备系统读数。
* **专家缓存**：`/metrics` 的 `expert_slots`（对照模型专家总量 24,576 = 48 层 × 512，setup.py `UMA_EXPERTS`）、`expert_cache_mib`、KV 格式与常驻量。
* **四级分层**：显存专家缓存 / 系统内存专家池 / CPU+PCIe（`pool_workers`、`pcie_frac`、`--spec`）/ SSD N-gram 表，数字均取自 `/metrics`。
* **基准测试**：向 `/v1/chat/completions` 发送真实 64-token 请求，直接读响应中的 `timings`。
* **日志**：尾部读取 `%LOCALAPPDATA%\Strata\launch\*.engine.log` 与插件启动输出。

### 模型页
* **模型目录**：内嵌本机 terminal 0.1.49.2 `setup.py` 模型表（Qwen3.8-Flash-Next Q2_0/IQ2_XS/IQ3_XXS/IQ3_S、Swift 1.5、Coder IQ1_M、Unsloth UD-IQ4_XS~Q8_0、Gyro-S/M、NVFP4、Qwen3.6-35B-A3B、DeepSeek-V4.1-Flash），含真实下载体积、内存需求与 `installed` 标记（扫描 `strata-<id>.json`）。
* **本机容量评估**：移植 setup.py 的 `fitOn` 规则（DENSE 5 GB / 系统预留 10 GB），按实时 RAM/显存计算 `vramUseGb / ramUseGb / spillGb` 与 KV 估算（`13 层 × {fp16:2112, int8:1056, q4_0:576, k8v4:816} B/token`）。
* **引擎参数**（映射到 `strata launch` 真实旗标）：`--context`（8K~512K）、`--kv`（int8/q4_0/k8v4/fp16）、`--vision`（on/cpu/gpu/off）、`--mtp`、`--parallel`、`--access`、`--port`、`--api-key`、`--set kv-resident`、`--set vram-reserve-mib`、`--set pcie-frac`（v2.5.1：CPU/PCIe 分担份额 0~1，0=不写入旗标跟随 `strata tune` 调优值/引擎默认，监控页可看运行实例的实际值并在差异提示中对比）。
* **引擎环境变量（v2.5，`STRATA_*`）**：`STRATA_ROUTE_TAIL_SKIP` 有**专用数字输入框**（可手动输入任意数值；留空=引擎自动判断，7=推荐开启，0=强制关闭，直接绑定无需手填名称）；其他 `STRATA_*` 键值（如 `STRATA_TAIL_SKIP_MAX_CACHED`）用通用 key-value 编辑器增删。保存时写入 `strata-<model>.json` 的 `env` 块；经插件启动时同时通过 `launch --set KEY=VALUE`（launch 会分流进运行配置的 env 块）与子进程环境传递，`server.py` 的 `child_env` 保证引擎进程收到；重启模型后生效。`STRATA_ROUTE_TAIL_SKIP` 语义（引擎自带说明）：默认关闭（缓存命中率低时跳过未命中专家反而损失投机采样接受率）；数值 N 表示 verify 窗口内每 token 都以 rank≤N 路由到的未命中专家直接跳过（12-16GB 缺专家卡 +10~20% 解码，答案略有差异）；0=强制关闭；NVFP4 包始终关闭。
* **服务默认值**（`serve/runconfig.py` 可编辑键）：`sampling.temperature/top_p/top_k/min_p`、`presence_penalty`、`reasoning_effort`、`reasoning_budget_tokens`、`api_monitor`、`idle_unload_s`、`fit_max_tokens`（截短超长 max_tokens，默认开）、`engine_silence_s`（引擎静默超时，默认 300 秒，0=一直等待）、`anthropic_thinking`（v2.5.3：Anthropic 请求未要求思考时的行为，枚举 `model`（默认，按模型思考）/ `on_request`（仅请求明确要求时思考）；只写合法枚举，非法值会被服务器拒绝启动）。
* **表单真值来源（v2.1.1）**：参数表单的初始值回读自 `D:\Strata\strata-<model>.json`（引擎旗标以 `args` 为准，顶层镜像字段仅作后备），不再使用可能过时的插件快照；引擎在线时同时读取运行实例的 `/config` 视图，配置文件与运行中实例不一致的键会在表单上方显示黄色差异提示（如 `KV 格式 配置 k8v4 / 运行 int8`），重启模型后生效配置文件的值。
* **保存**：离线时按 runconfig 规则直接写 `D:\Strata\strata-<model>.json`（备份 `.bak`、参数镜像同步 `args`/`args_written`）；在线时同时 `POST /config` 由服务器校验并写入运行实例的配置。

### 启停控制
* **启动/重启**：调用 `strata launch ... --yes --no-tui`（引擎在线时自动追加 `--restart`），环境变量与 `launch-iq3s-128k.ps1` 一致（`STRATA_INSTALL_DIR` / `STRATA_COMPONENTS_DIR` / `STRATA_DATA_DIR` / 代理 / HF 镜像）；CLI 缺失时回退到 `python serve/server.py --engine strata --config strata-<model>.json`（同 `run-iq3_s.bat`）。
* **停止服务**：`strata launch --stop`（停止 launch 启动的服务并释放显存）。
* **卸载显存**：`POST /unload`（JSON 体，请求间隙立即归还显存；`auto_load` 会在下次请求时重新加载）。
* **Web 控制台**：打开引擎内置页面 `http://127.0.0.1:8080/`。

### 升级页（v2.1 新增，`strata update` / `strata components rollback`）
* **当前组件**：终端/Control 版本、active 引擎目录、`components/.updates/state.json` 里的 previous 版本、记住的更新源与升级历史。
* **检查更新**：`strata update --check --output json --feed <官方源>`（只读）。注意组件目录记住的更新源可能是本地离线源（离线安装时留下，会永远显示"已最新"），因此默认显式使用 GitHub 官方签名源；需要代理的环境在「安装路径」卡片勾选代理后检查/升级走代理，也可把源改成本地目录做离线安装。报告含引擎/Control/桌面应用三部分与 `serving` 提示。
* **执行升级**：先 `strata launch --stop` 停止服务，再后台运行 `strata update --output jsonl [--force]`（下载签名包 → 校验哈希/签名 → 测试启动成功才切换；旧版本保留）。进度写入 `%TEMP%\dsh-strata-ai-center-update.log`，页面每 3 秒轮询展示日志尾部与最终结果。
* **回滚**：`strata components rollback`（仅当上次升级保留了 previous 时可用）。

## 目录结构

```text
dsh-strata-ai-center/
├── package.json          # DSH Bundle 与 Web Client 插件清单
├── cordis.patch.yml      # Cordis 挂载补丁（本机 Strata 路径）
├── install-plugin.ps1    # Windows 一键安装/修复脚本 (UTF-8 无 BOM)
├── README.md
└── lib/
    ├── index.js          # Host 端 (Node ESM)：HTTP 路由、真实端点聚合、strata launch 启停、runconfig 写入
    └── client.js         # Client 端 (__ModuleLoader__ 闭包工厂)：左侧栏入口与监控/模型双页面
```

## 安装（任选其一）

前置条件：本机已安装 [Strata](https://github.com/Niko1221/Strata)（`strata launch` 可用）与 DeepSeek Harness。

### 方式一：从 GitHub 安装（推荐）

```powershell
dsh plugin --profile desktop add https://github.com/<你的用户名>/dsh-strata-ai-center.git
```

也可以在 DSH 界面「插件 → 添加插件」中粘贴仓库地址。更新到最新版：

```powershell
dsh plugin --profile desktop update dsh-strata-ai-center
```

### 方式二：从 npm 安装（发布后即进入 DSH 插件市场的可搜索范围）

```powershell
dsh plugin --profile desktop add dsh-strata-ai-center
```

### 方式三：本地安装

```powershell
dsh plugin --profile desktop add <本插件目录>
# 或在解压后的目录中执行一键挂载脚本：
powershell -ExecutionPolicy Bypass -File .\install-plugin.ps1
```

安装后重启 `DeepSeek Harness.exe`，在左侧栏「记忆系统」下方出现「AI管理中心」。首次打开请在「模型与参数 → 安装路径」核对自动探测的路径（strata.cmd / 运行配置目录等），不对时直接改。

> 面板状态保存在 `~/.dsh/strata-ai-center/settings.json`（每台机器各自独立）；需要外网代理下载模型/组件的环境，可在「安装路径」卡片勾选代理与 HF 镜像。
