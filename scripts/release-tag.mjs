#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output, exit } from 'node:process';

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const message = result.stderr?.trim() || `git ${args.join(' ')} 执行失败`;
    throw new Error(message);
  }

  return (result.stdout || '').trim();
}

function runGitInteractive(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    exit(result.status ?? 1);
  }
}

function gitOk(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return result.status === 0;
}

async function ask(question) {
  const rl = readline.createInterface({ input, output });

  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function getTagName() {
  const argTag = process.argv[2]?.trim();

  if (argTag) {
    return argTag;
  }

  return ask('请输入要发布的 tag 版本（例如 v1.0.1）：');
}

function validateTagName(tagName) {
  if (!tagName) {
    throw new Error('tag 不能为空');
  }

  if (/\s/.test(tagName)) {
    throw new Error('tag 不能包含空白字符');
  }

  if (!gitOk(['check-ref-format', `refs/tags/${tagName}`])) {
    throw new Error(`"${tagName}" 不是合法的 tag 名称`);
  }
}

function ensureGitRepo() {
  if (!gitOk(['rev-parse', '--is-inside-work-tree'])) {
    throw new Error('当前目录不是 Git 仓库');
  }
}

function getCurrentBranch() {
  if (!gitOk(['symbolic-ref', '--quiet', 'HEAD'])) {
    throw new Error('当前处于 detached HEAD，无法自动发布 tag');
  }

  return runGit(['branch', '--show-current']);
}

function getUpstreamBranch() {
  if (!gitOk(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])) {
    throw new Error('当前分支没有配置 upstream，请先推送一次分支并建立追踪关系');
  }

  return runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
}

function ensureOriginRemote() {
  if (!gitOk(['remote', 'get-url', 'origin'])) {
    throw new Error('未找到 origin 远端，无法推送 tag');
  }
}

function ensureTagNotExists(tagName) {
  if (gitOk(['rev-parse', '--verify', '--quiet', `refs/tags/${tagName}`])) {
    throw new Error(`tag ${tagName} 已存在`);
  }
}

async function commitIfNeeded() {
  const status = runGit(['status', '--porcelain']);

  if (!status) {
    return false;
  }

  console.log('检测到未提交改动，准备先提交本地变更。');
  const message = await ask('请输入本次提交信息（留空取消发布）：');

  if (!message) {
    throw new Error('已取消：存在未提交改动但未提供 commit message');
  }

  runGitInteractive(['add', '-A']);
  runGitInteractive(['commit', '-m', message]);

  return true;
}

function pushBranchIfNeeded(upstreamBranch) {
  const counts = runGit(['rev-list', '--left-right', '--count', `${upstreamBranch}...HEAD`]);
  const [behindText = '0', aheadText = '0'] = counts.split(/\s+/);
  const behind = Number(behindText);
  const ahead = Number(aheadText);

  if (Number.isNaN(behind) || Number.isNaN(ahead)) {
    throw new Error('无法判断当前分支与远端分支的提交差异');
  }

  if (behind > 0) {
    throw new Error(`当前分支落后远端 ${behind} 个提交，请先同步代码再发布`);
  }

  if (ahead > 0) {
    console.log(`检测到 ${ahead} 个未 push 提交，先推送当前分支到 ${upstreamBranch}。`);
    runGitInteractive(['push']);
    return true;
  }

  console.log('当前分支没有未 push 的提交。');
  return false;
}

function createAndPushTag(tagName) {
  console.log(`开始创建 tag ${tagName}。`);
  runGitInteractive(['tag', '-a', tagName, '-m', `Release ${tagName}`]);

  console.log(`开始推送 tag ${tagName} 到 origin。`);
  runGitInteractive(['push', 'origin', tagName]);
}

async function main() {
  ensureGitRepo();

  const tagName = await getTagName();
  validateTagName(tagName);
  ensureTagNotExists(tagName);
  ensureOriginRemote();

  const branchName = getCurrentBranch();
  const upstreamBranch = getUpstreamBranch();

  console.log(`当前分支：${branchName}`);
  console.log(`远端分支：${upstreamBranch}`);
  console.log('Tag 目标远端：origin');

  await commitIfNeeded();
  pushBranchIfNeeded(upstreamBranch);
  createAndPushTag(tagName);

  console.log(`发布完成：${tagName}`);
}

main().catch((error) => {
  console.error(`发布失败：${error.message}`);
  exit(1);
});
