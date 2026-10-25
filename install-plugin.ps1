# PowerShell One-Click Installer & Repair Tool for DSH "AI管理中心" (dsh-strata-ai-center)
# 彻底修复 pnpm-lock.yaml / package.json / .ignored 中的 node_modules 自引用死锁问题

$ErrorActionPreference = "Continue"

$PluginName = "dsh-strata-ai-center"
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE ".dsh" }
$DshAppDir = Join-Path $env:LOCALAPPDATA "Programs\DeepSeek Harness"
$DshExe = Join-Path $DshAppDir "DeepSeek Harness.exe"
$PnpmMjs = Join-Path $DshAppDir "resources\runtime\primary-runtime\dependencies\pnpm\dist\pnpm.mjs"

# 1. 将插件本体存放在稳定的外部目录 ~/.dsh/local-plugins/dsh-strata-ai-center
$ExternalStoreRoot = Join-Path $DshHome "local-plugins"
if (-not (Test-Path -LiteralPath $ExternalStoreRoot)) {
    New-Item -ItemType Directory -Force -Path $ExternalStoreRoot | Out-Null
}
$PluginRealDir = Join-Path $ExternalStoreRoot $PluginName

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  正在修复并安装 DSH 插件: AI管理中心 ($PluginName)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

if ($SourceDir -ne $PluginRealDir) {
    if (Test-Path -LiteralPath $PluginRealDir) {
        cmd.exe /c "rmdir /s /q `"$PluginRealDir`"" 2>$null
        Remove-Item -LiteralPath $PluginRealDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Force -Path $PluginRealDir | Out-Null
    Copy-Item -Path (Join-Path $SourceDir "*") -Destination $PluginRealDir -Recurse -Force
}
Write-Host "[1/4] 插件源码已就位: $PluginRealDir" -ForegroundColor Green

# 2. 遍历 ~/.dsh/profiles/* 清理冲突目录并修复 package.json 与 pnpm-lock.yaml
$ProfilesRoot = Join-Path $DshHome "profiles"
if (-not (Test-Path -LiteralPath $ProfilesRoot)) {
    New-Item -ItemType Directory -Force -Path (Join-Path $ProfilesRoot "desktop") | Out-Null
}

$ProfileDirs = Get-ChildItem -LiteralPath $ProfilesRoot -Directory
# 使用相对于 ~/.dsh/profiles/<profile> 的标准 pnpm link 路径
$RelativeLinkSpec = "link:../../local-plugins/$PluginName"
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

foreach ($Prof in $ProfileDirs) {
    $ProfPath = $Prof.FullName
    $ProfName = $Prof.Name
    Write-Host "`n[2/4] 正在修复 Profile [$ProfName]: $ProfPath" -ForegroundColor Yellow

    # (A) 强制清理 node_modules/dsh-strata-ai-center 与 node_modules/.ignored
    $BadNodeModuleDir = Join-Path $ProfPath "node_modules\$PluginName"
    $IgnoredRootDir = Join-Path $ProfPath "node_modules\.ignored"

    if (Test-Path -LiteralPath $BadNodeModuleDir) {
        cmd.exe /c "rmdir /s /q `"$BadNodeModuleDir`"" 2>$null
        Remove-Item -LiteralPath $BadNodeModuleDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [✓] 已移除旧目录/符号链接: $BadNodeModuleDir" -ForegroundColor Green
    }
    if (Test-Path -LiteralPath $IgnoredRootDir) {
        cmd.exe /c "rmdir /s /q `"$IgnoredRootDir`"" 2>$null
        Remove-Item -LiteralPath $IgnoredRootDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [✓] 已清空残留缓存目录: $IgnoredRootDir" -ForegroundColor Green
    }

    # (B) 修复 package.json 中的自引用路径
    $PkgJsonPath = Join-Path $ProfPath "package.json"
    if (Test-Path -LiteralPath $PkgJsonPath) {
        try {
            $PkgContent = Get-Content -LiteralPath $PkgJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if (-not $PkgContent.dependencies) {
                $PkgContent | Add-Member -MemberType NoteProperty -Name "dependencies" -Value ([PSCustomObject]@{})
            }
            $PkgContent.dependencies | Add-Member -MemberType NoteProperty -Name $PluginName -Value $RelativeLinkSpec -Force

            if ($PkgContent.dsh -and $PkgContent.dsh.profile -and $PkgContent.dsh.profile.bundles) {
                if ($PkgContent.dsh.profile.bundles -notcontains $PluginName) {
                    $PkgContent.dsh.profile.bundles += $PluginName
                }
            }
            $JsonOut = $PkgContent | ConvertTo-Json -Depth 10
            [System.IO.File]::WriteAllText($PkgJsonPath, $JsonOut, $Utf8NoBom)
            Write-Host "  [✓] 已更新 package.json -> $RelativeLinkSpec" -ForegroundColor Green
        } catch {
            Write-Host "  [!] 更新 package.json 出错: $_" -ForegroundColor Red
        }
    }

    # (C) 关键修复：替换 pnpm-lock.yaml 中缓存的旧 node_modules/dsh-strata-ai-center 自引用记录
    $LockfilePath = Join-Path $ProfPath "pnpm-lock.yaml"
    if (Test-Path -LiteralPath $LockfilePath) {
        $LockText = [System.IO.File]::ReadAllText($LockfilePath, [System.Text.Encoding]::UTF8)
        $UpdatedLock = $LockText `
            -replace 'file:\./node_modules/dsh-strata-ai-center', $RelativeLinkSpec `
            -replace 'file:node_modules/dsh-strata-ai-center', $RelativeLinkSpec `
            -replace 'link:\./node_modules/dsh-strata-ai-center', $RelativeLinkSpec `
            -replace 'link:node_modules/dsh-strata-ai-center', $RelativeLinkSpec
        if ($UpdatedLock -ne $LockText) {
            [System.IO.File]::WriteAllText($LockfilePath, $UpdatedLock, $Utf8NoBom)
            Write-Host "  [✓] 已清除 pnpm-lock.yaml 中的 node_modules 自引用缓存记录" -ForegroundColor Green
        } else {
            Write-Host "  [✓] 已检查 pnpm-lock.yaml 状态正常" -ForegroundColor Green
        }
    }

    # (D) 确保 cordis.patch.yml 中包含挂载项（不带机器相关配置，路径由插件自动探测）
    $PatchYmlPath = Join-Path $ProfPath "cordis.patch.yml"
    if (Test-Path -LiteralPath $PatchYmlPath) {
        $PatchText = [System.IO.File]::ReadAllText($PatchYmlPath, [System.Text.Encoding]::UTF8)
        if ($PatchText -notmatch "dsh-strata-ai-center") {
            $AppendBlock = "`n- insert:`n    - id: strata-ai-center`n      name: 'dsh-strata-ai-center'`n"
            [System.IO.File]::AppendAllText($PatchYmlPath, $AppendBlock, $Utf8NoBom)
            Write-Host "  [✓] 已写入挂载配置至: $PatchYmlPath" -ForegroundColor Green
        }
    }

    # (E) 调用 DSH 内置 pnpm 完成标准链接并刷新 lockfile / .modules.yaml
    if ((Test-Path -LiteralPath $DshExe) -and (Test-Path -LiteralPath $PnpmMjs)) {
        Write-Host "[3/4] 正在调用 DSH 内置 pnpm 同步链接 [$ProfName]..." -ForegroundColor Yellow
        Push-Location $ProfPath
        try {
            $env:ELECTRON_RUN_AS_NODE = "1"
            & $DshExe $PnpmMjs install --no-frozen-lockfile 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
            Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
        } catch {
            Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
        }
        Pop-Location
    }

    # (F) 兜底保障：若 pnpm 未创建链接，则补充建立目录联接
    if (-not (Test-Path -LiteralPath $BadNodeModuleDir)) {
        $NodeModulesRoot = Join-Path $ProfPath "node_modules"
        if (-not (Test-Path -LiteralPath $NodeModulesRoot)) {
            New-Item -ItemType Directory -Force -Path $NodeModulesRoot | Out-Null
        }
        cmd.exe /c "mklink /J `"$BadNodeModuleDir`" `"$PluginRealDir`"" | Out-Null
        Write-Host "  [✓] 已建立目录联接: $BadNodeModuleDir -> $PluginRealDir" -ForegroundColor Green
    }
}

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "  [4/4] ✅ 修复与安装全部完成！现在可以打开 DeepSeek Harness 了。" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
