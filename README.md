# dujiao-user 二开维护说明

这个仓库是从源仓库 [dujiao-next/user](https://github.com/dujiao-next/user) fork 出来的二开版本，用于在保留自定义功能的同时，持续合并源仓库后续更新。

当前推荐的维护方式是：

- `origin`：你自己的 fork 仓库，用来保存二开代码
- `upstream`：源仓库，用来同步官方新提交
- `main`：你自己的长期维护主分支
- `feat/*`、`fix/*`：日常开发分支，开发完成后再合并回 `main`

## 当前远程仓库

本仓库建议保持如下远程关系：

```bash
origin   = git@github.com:iamobj/dujiao-user.git
upstream = https://github.com/dujiao-next/user.git
```

可随时用下面命令确认：

```bash
git remote -v
```

## 项目启动

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 推荐开发流程

不要长期直接在 `main` 上开发，推荐每次从 `main` 拉一个功能分支：

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

开发完成后提交：

```bash
git add .
git commit -m "feat: your change"
git push origin feat/your-feature-name
```

如果你是自己一个人维护，也可以直接把功能分支合并回本地 `main`：

```bash
git checkout main
git merge feat/your-feature-name
git push origin main
```

## 以后同步源仓库更新的标准流程

以后源仓库有了新 commit，按下面流程合并到你的二开仓库。

### 1. 拉取源仓库最新提交

```bash
git fetch upstream
```

如果你想先看看源仓库更新了什么：

```bash
git log --oneline main..upstream/main
```

如果你想看具体差异：

```bash
git diff main..upstream/main
```

### 2. 切回自己的主分支

```bash
git checkout main
git pull origin main
```

这一步是为了先确保你的 `main` 和远端 fork 保持一致。

### 3. 合并源仓库更新

```bash
git merge upstream/main
```

如果没有冲突，Git 会自动生成一次 merge。

如果有冲突，按下面流程处理：

```bash
git status
```

打开冲突文件，手动保留你需要的内容，处理完成后：

```bash
git add .
git commit
```

### 4. 合并后做一次验证

至少执行：

```bash
npm install
npm run build
```

如果源仓库这次改了依赖、构建配置或接口逻辑，这一步可以尽早发现问题。

### 5. 推送到你自己的 fork

```bash
git push origin main
```

到这里，你自己的二开主分支就已经包含了源仓库最新更新。

## 推荐习惯

- 平时所有业务改动都尽量走功能分支，不要把实验性代码直接堆在 `main`
- 同步上游时，尽量先保证工作区干净，避免把未提交改动和上游更新混在一起
- 已经 push 过的 `main`，优先使用 `merge` 同步上游，不建议对外公开分支频繁 `rebase`
- 每次同步上游后，至少做一次构建验证；如果这个项目有部署环境，最好再做一次关键页面冒烟测试

## 常用命令速查

查看远程：

```bash
git remote -v
```

拉取源仓库更新：

```bash
git fetch upstream
```

查看源仓库比你多了哪些提交：

```bash
git log --oneline main..upstream/main
```

把源仓库合并到当前 `main`：

```bash
git checkout main
git pull origin main
git merge upstream/main
git push origin main
```

## 一句话原则

日常开发合并到你自己的 `main`，官方更新通过 `upstream/main` 再合并进来，这样最适合长期二开和持续跟进源仓库。

## 发布
```bash
npm run release:tag
```
等镜像发布完成，就去服务器更新 user 端镜像tag