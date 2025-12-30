# GitHub Actions 配置指南

## 📌 重要：GitHub Actions 是自动的！

**好消息：** 你不需要在 GitHub 网站上配置任何东西。一旦推送代码，Actions 就会自动启用。

---

## 🚀 首次推送步骤

### 1. 提交当前更改

```bash
# 添加所有新文件和修改
git add .

# 创建提交
git commit -m "feat: 完成基础架构 - Day 1-3

- 添加 GitHub Actions CI/CD 配置
- 配置 Tailwind CSS
- 定义 TypeScript 核心类型和 IPC 协议
- 实现 DatabaseManager（SQLite）
- 创建 Zustand stores（Scanner, Snapshot, Comparison, UI）
- 添加开发计划文档

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 2. 推送到 GitHub

```bash
# 推送到远程仓库
git push origin main
```

**就这样！** GitHub Actions 现在已经启用了。

---

## ✅ CI/CD 自动触发条件

### CI Workflow (`ci.yml`)
**触发时机：**
- ✅ 每次 `git push` 到 `main` 或 `develop` 分支
- ✅ 每次创建 Pull Request 到 `main` 或 `develop`

**检查内容：**
- ESLint 代码规范
- Prettier 格式检查
- TypeScript 类型检查
- 跨平台构建测试（Ubuntu/macOS/Windows）

### Release Workflow (`release.yml`)
**触发时机：**
- ✅ 推送版本 tag（格式：`v1.0.0`）

**执行操作：**
- 构建 macOS `.dmg` 安装包
- 构建 Windows `.exe` 安装程序
- 构建 Linux `.AppImage`/`.snap`/`.deb` 包
- 自动创建 GitHub Release
- 上传所有安装包

### Test Workflow (`test.yml`)
**触发时机：**
- ✅ 每次 `git push` 到 `main` 或 `develop` 分支
- ✅ 每次创建 Pull Request

**当前状态：** ⚠️ 已创建但禁用（等待测试框架配置完成）

---

## 📊 查看 Actions 运行状态

### 方法 1：GitHub 网站

1. 访问你的仓库：`https://github.com/<username>/SpaceBadger`
2. 点击顶部的 **"Actions"** 标签
3. 查看所有 workflow 运行记录

### 方法 2：通过 Git 命令

```bash
# 使用 GitHub CLI（如果已安装）
gh run list

# 查看最新运行的详情
gh run view

# 实时查看日志
gh run watch
```

### 方法 3：推送后的反馈

推送后，你会在几秒内看到：
```bash
remote:
remote: Create a pull request for 'main' on GitHub by visiting:
remote:   https://github.com/<username>/SpaceBadger/pull/new/main
remote:
To https://github.com/<username>/SpaceBadger.git
   abc123..def456  main -> main
```

然后访问 GitHub 仓库，顶部会显示黄色进行中标志 🟡 或绿色完成标志 ✅。

---

## 🔍 首次推送后的检查清单

### ✅ 验证 Actions 已启用

1. **访问 Actions 页面**
   ```
   https://github.com/<username>/SpaceBadger/actions
   ```

2. **应该看到：**
   - 🟡 "CI" workflow 正在运行
   - 🟡 "Test" workflow 正在运行（如果已启用）
   - 📋 工作流列表：CI, Release, Test

3. **点击正在运行的 workflow**
   - 查看实时日志
   - 监控每个步骤的执行情况

### ✅ CI 应该通过的检查

第一次推送后，CI 可能会**失败**，因为：

**可能的失败原因：**

1. **ESLint 错误**
   ```bash
   # 本地修复
   pnpm lint --fix
   git add .
   git commit -m "fix: 修复 ESLint 错误"
   git push
   ```

2. **Prettier 格式问题**
   ```bash
   # 本地修复
   pnpm exec prettier --write .
   git add .
   git commit -m "style: 格式化代码"
   git push
   ```

3. **TypeScript 类型错误**
   ```bash
   # 检查错误
   pnpm typecheck

   # 修复后提交
   git add .
   git commit -m "fix: 修复类型错误"
   git push
   ```

4. **构建失败**
   - 检查是否所有依赖都在 `package.json` 中
   - 确保没有引用不存在的模块

---

## ⚙️ 可选配置（如果需要）

### GitHub Secrets（代码签名）

如果将来需要签名应用（macOS/Windows），需要添加 secrets：

1. 访问：`Settings > Secrets and variables > Actions`
2. 点击 **"New repository secret"**
3. 添加以下 secrets（可选）：

| Secret Name | 用途 | 何时需要 |
|-------------|------|----------|
| `CSC_LINK` | macOS 代码签名证书（base64） | 发布正式版时 |
| `CSC_KEY_PASSWORD` | macOS 证书密码 | 发布正式版时 |
| `WIN_CSC_LINK` | Windows 代码签名证书 | 发布正式版时 |
| `WIN_CSC_KEY_PASSWORD` | Windows 证书密码 | 发布正式版时 |
| `CODECOV_TOKEN` | Codecov 集成 token | 需要代码覆盖率报告时 |

**注意：** `GITHUB_TOKEN` 是自动提供的，不需要手动配置。

---

## 📋 常见问题

### Q1: 推送后没有看到 Actions 运行？

**检查：**
1. 确认 `.github/workflows/` 目录已推送
2. 检查分支名是否匹配（`main` 或 `develop`）
3. 查看 Actions 标签是否启用

**解决：**
```bash
# 确认文件已推送
git ls-tree -r main --name-only | grep workflows

# 应该输出：
# .github/workflows/ci.yml
# .github/workflows/release.yml
# .github/workflows/test.yml
```

### Q2: CI 一直失败怎么办？

**步骤：**
1. 点击失败的 workflow 查看详细日志
2. 找到红色 ❌ 的步骤
3. 查看错误信息
4. 在本地运行相同命令修复
5. 重新提交并推送

**本地预检命令：**
```bash
# 运行所有 CI 会执行的检查
pnpm lint
pnpm exec prettier --check .
pnpm typecheck
pnpm build
```

### Q3: 如何触发发布？

**步骤：**
```bash
# 1. 更新 package.json 版本号
# "version": "1.0.0"

# 2. 提交更改
git add package.json
git commit -m "chore: release v1.0.0"
git push

# 3. 创建并推送 tag
git tag v1.0.0
git push origin v1.0.0
```

**然后：**
- Release workflow 自动运行
- 15-30 分钟后在 Releases 页面查看
- 下载生成的安装包测试

### Q4: 如何禁用某个 workflow？

**方法 1：通过 GitHub 网站**
1. 访问 Actions 页面
2. 点击左侧要禁用的 workflow
3. 点击右上角 "..." → "Disable workflow"

**方法 2：删除 workflow 文件**
```bash
git rm .github/workflows/test.yml
git commit -m "ci: 暂时禁用测试 workflow"
git push
```

### Q5: 如何查看构建产物？

**CI 构建产物：**
1. 访问 workflow 运行页面
2. 滚动到底部 "Artifacts" 部分
3. 下载 `build-ubuntu-latest` / `build-macos-latest` 等

**Release 构建产物：**
1. 访问 `https://github.com/<username>/SpaceBadger/releases`
2. 点击最新的 Release
3. 在 "Assets" 部分下载安装包

---

## 🎯 推荐工作流

### 开发阶段

```bash
# 1. 开发功能
# ... 编码 ...

# 2. 本地测试
pnpm lint
pnpm typecheck
pnpm build

# 3. 提交
git add .
git commit -m "feat: 添加新功能"

# 4. 推送（触发 CI）
git push origin main

# 5. 查看 CI 结果
# 访问 GitHub Actions 页面
```

### 发布阶段

```bash
# 1. 确保所有测试通过
pnpm lint
pnpm typecheck
pnpm build

# 2. 更新版本号
# 编辑 package.json: "version": "1.0.0"

# 3. 提交版本更新
git add package.json
git commit -m "chore: release v1.0.0"
git push

# 4. 创建 tag（触发 Release workflow）
git tag v1.0.0
git push origin v1.0.0

# 5. 等待构建完成（15-30 分钟）
# 6. 测试下载的安装包
# 7. 编辑 Release 添加详细说明
```

---

## 📌 总结

### ✅ 自动的（无需配置）
- ✅ Workflow 启用
- ✅ `GITHUB_TOKEN` 权限
- ✅ 运行触发
- ✅ 状态通知

### ⚙️ 手动的（仅在需要时）
- ⚙️ 代码签名 Secrets
- ⚙️ 第三方集成 tokens
- ⚙️ Workflow 禁用/启用

### 🎯 下一步

1. **现在就推送代码：**
   ```bash
   git add .
   git commit -m "feat: 完成基础架构（Day 1-3）"
   git push origin main
   ```

2. **查看 Actions 运行：**
   - 访问 GitHub Actions 页面
   - 等待 CI 完成
   - 查看是否有错误

3. **修复问题（如果有）：**
   - 查看失败的步骤
   - 本地修复
   - 重新推送

4. **继续开发：**
   - 每次推送都会触发 CI
   - 确保代码质量
   - 放心开发！

---

**就是这么简单！GitHub Actions 完全自动化，你只需专注于写代码。** 🚀
