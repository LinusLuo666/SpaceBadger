# CI/CD 配置说明

## 概述

SpaceBadger 使用 GitHub Actions 实现持续集成和持续部署（CI/CD）。

## 工作流说明

### 1. CI Workflow (`.github/workflows/ci.yml`)

**触发条件：**
- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**执行任务：**
- **代码质量检查**
  - ESLint 代码规范检查
  - Prettier 格式检查
  - TypeScript 类型检查（Node + Web）

- **跨平台构建测试**
  - 在 Ubuntu、macOS、Windows 上构建应用
  - 确保代码在所有平台上可编译
  - 上传构建产物（保留7天）

**本地测试命令：**
```bash
# 运行所有检查（在提交前执行）
pnpm lint
pnpm exec prettier --check .
pnpm typecheck

# 构建测试
pnpm build
```

---

### 2. Test Workflow (`.github/workflows/test.yml`)

**触发条件：**
- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**执行任务：**
- 运行单元测试
- 生成代码覆盖率报告
- 上传到 Codecov（可选）

**状态：** ⚠️ 当前禁用，等待测试框架配置完成（计划 Week 8）

**本地测试命令：**
```bash
pnpm test                  # 运行测试
pnpm test:coverage         # 生成覆盖率报告
```

---

### 3. Release Workflow (`.github/workflows/release.yml`)

**触发条件：**
- 推送以 `v*.*.*` 格式的 Git tag（如 `v1.0.0`）

**执行任务：**
- **多平台构建**
  - macOS: 构建 `.dmg` 安装包
  - Windows: 构建 `.exe` 安装程序
  - Linux: 构建 `.AppImage`, `.snap`, `.deb` 包

- **自动发布**
  - 创建 GitHub Release
  - 上传所有平台的安装包
  - 生成变更日志（基于 Git commits）

---

## 发布流程

### 准备发布

1. **确保代码质量**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```

2. **更新版本号**
   编辑 `package.json`：
   ```json
   {
     "version": "1.0.0"
   }
   ```

3. **更新 CHANGELOG**（手动或使用工具）
   ```bash
   # 可选：使用 conventional-changelog
   pnpm exec conventional-changelog -p angular -i CHANGELOG.md -s
   ```

4. **提交并推送**
   ```bash
   git add .
   git commit -m "chore: release v1.0.0"
   git push origin main
   ```

### 触发发布

5. **创建并推送 tag**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

6. **等待 GitHub Actions 完成**
   - 访问 `https://github.com/<username>/SpaceBadger/actions`
   - 监控 Release workflow 进度
   - 构建时间：约 15-30 分钟（三个平台并行）

7. **验证发布**
   - 访问 `https://github.com/<username>/SpaceBadger/releases`
   - 检查安装包是否上传成功
   - 下载并测试安装包

---

## 最佳实践

### 分支策略

- **main**: 生产分支，始终可发布
- **develop**: 开发分支，集成最新功能
- **feature/***: 功能分支，从 develop 分出
- **bugfix/***: 修复分支，从 develop 分出
- **hotfix/***: 紧急修复，从 main 分出

### 工作流程

1. 从 `develop` 创建 `feature/xxx` 分支
2. 开发完成后创建 Pull Request 到 `develop`
3. CI 自动运行检查
4. 代码审查通过后合并
5. 定期从 `develop` 合并到 `main`
6. 在 `main` 上打 tag 触发发布

### Commit 规范

建议使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试相关
chore: 构建/工具配置
```

示例：
```bash
git commit -m "feat: 添加 Treemap 可视化组件"
git commit -m "fix: 修复扫描进度计算错误"
git commit -m "docs: 更新 README 安装说明"
```

---

## 环境变量与密钥

### GitHub Secrets 配置

发布流程需要以下 secrets（自动提供）：
- `GITHUB_TOKEN`: GitHub 自动生成，用于发布 Release

### 可选配置

如需代码签名（macOS/Windows）：
1. 访问 `Settings > Secrets and variables > Actions`
2. 添加以下 secrets：
   - `CSC_LINK`: macOS 证书（base64）
   - `CSC_KEY_PASSWORD`: 证书密码
   - `WIN_CSC_LINK`: Windows 证书
   - `WIN_CSC_KEY_PASSWORD`: 证书密码

如需 Codecov 集成：
- `CODECOV_TOKEN`: Codecov token

---

## 故障排查

### CI 失败常见原因

1. **Lint 失败**
   ```bash
   pnpm lint --fix  # 自动修复
   ```

2. **Type check 失败**
   ```bash
   pnpm typecheck:node
   pnpm typecheck:web
   # 检查类型错误并修复
   ```

3. **Build 失败**
   - 检查依赖版本
   - 删除 `node_modules` 和 `pnpm-lock.yaml` 重新安装
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Release 失败常见原因

1. **Tag 格式错误**
   - 必须是 `v` 开头 + 语义化版本号
   - 正确：`v1.0.0`, `v1.2.3-beta.1`
   - 错误：`1.0.0`, `release-1.0`

2. **构建超时**
   - 检查 electron-builder 配置
   - 确保依赖正确安装

3. **上传失败**
   - 检查 `dist/` 目录是否有生成文件
   - 验证 GitHub token 权限

---

## 性能优化

### 加速 CI 构建

1. **使用 pnpm 缓存**（已配置）
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'pnpm'
   ```

2. **并行运行任务**
   - CI 已配置多平台并行构建
   - Release 同时构建三个平台

3. **缓存依赖**
   - pnpm 自动缓存 node_modules
   - GitHub Actions 缓存 pnpm store

### 减少构建时间

当前预估时间：
- CI Lint & Type Check: 3-5 分钟
- CI Build Test (单平台): 5-8 分钟
- Release (三平台并行): 15-30 分钟

---

## 后续改进

### 计划添加的功能

1. **自动化测试**（Week 8）
   - 启用单元测试 workflow
   - 集成 E2E 测试（Playwright）

2. **自动版本管理**
   - 集成 `semantic-release`
   - 自动生成 CHANGELOG
   - 自动更新版本号

3. **性能监控**
   - 构建大小追踪
   - 性能回归检测

4. **预发布渠道**
   - Beta 版本自动发布
   - 每日构建（Nightly builds）

5. **代码质量报告**
   - SonarCloud 集成
   - 代码覆盖率趋势

---

## 参考资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [electron-builder CI 配置](https://www.electron.build/configuration/publish.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

**文档版本:** 1.0.0
**最后更新:** 2025-12-30
