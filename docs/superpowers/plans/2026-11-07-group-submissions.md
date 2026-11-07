# 分组提交实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将课程提交改为练习和组别归档，提供可信检查、自动总览和可用于 Qoder/WorkBuddy 的新版 Skill。

**Architecture:** 用随 Skill 分发的 course.mjs 共享编号、登记、路径与 PR 校验。helper 读取老师 main 配置，GitHub 检查读取可信 base 配置，总览只读生成 Markdown。

**Tech Stack:** Node.js 20+ 标准库、GitHub CLI/REST、GitHub Actions、Python 标准库 ZIP。

**Spec:** docs/superpowers/specs/2026-11-07-group-submissions-design.md

## Global Constraints

- 远端目录固定为 `submissions/lesson-NN/group-NN/individual/<login>/` 或 `submissions/lesson-NN/group-NN/team/`，编号为 01–99。
- Node.js 20+；无 npm 运行依赖；保留连接测试；不自动删除、强推、合并或修改 main。
- 课程文案使用简体中文；兼容 Qoder 项目安装和 WorkBuddy ZIP 导入。
- 4 个练习、5 组占位、members/representatives 空数组；只从可信老师配置决定权限。

## Review Focus

- 代表缺失、大小写变化及非法/重复组别，不能产生远端写入。
- 跨组重命名、删除或链接，以及篡改 fork 内名单，不能绕过范围校验。
- 多个组、其他代表的未关闭 PR 和并发更新，不能互相覆盖或重复创建。
- 超过一页 PR、目录树截断、重交已合并作品，不能漏报或误报总览。
- WorkBuddy 独立解压 ZIP 和带空格/中文路径的 Qoder 安装，必须可运行 helper。

---

### Task 1: 分组契约与 helper

**Files:** Create `course.json`, `skills/aibt-workshop/scripts/course.mjs`; modify `skills/aibt-workshop/scripts/workshop.mjs`, `tests/workshop.test.mjs`; create `tests/course.test.mjs`.

**Interfaces:** Produces `groupId(value)`, `validateConfig(config)`, `submissionTarget(config,{login,lesson,group,kind})`, `parseSubmissionBranch(branch)`, `readCourseConfig(api,ref)`, `listPullRequests(api,state)`; publish accepts group/config and returns group/lesson.

- [x] Write failing tests for canonical lesson/group paths, unregistered/wrong representative refusal, README requirement, group-isolated retries/revisions and trusted config before fork creation.
- [x] Run `node tools/run-tests.mjs`; expected new behavior tests fail against existing helper.
- [x] Implement shared rules and helper; preserve connection tests and scanner limits.
- [x] Run `node tools/run-tests.mjs`; expected all current tests pass. Commit.

### Task 2: PR 检查与总览

**Files:** Extend `scripts/course.mjs`; create `tools/check-submission.mjs`, `tools/build-overview.mjs`, `.github/workflows/check-submission.yml`, `.github/workflows/submission-overview.yml`, `.github/workflows/tests.yml`, `tests/submission.test.mjs`.

**Interfaces:** Consumes Task 1 rules. Produces `validateSubmission({config,pr,files,tree,openPulls})`, `renderOverview({config,tree,prs})`; CLI `node tools/check-submission.mjs --pr N`, `node tools/build-overview.mjs [--output path]`.

- [x] Write failing tests for authorization, wrong base/head, rename/delete/link, duplicate group PRs, maintenance exemption and ordered/complete overview with pagination.
- [x] Run `node tools/run-tests.mjs`; expected new tests fail.
- [x] Implement trusted read-only check and overview workflows; test workflow uses Node 20 on Linux/Windows.
- [x] Run `node tools/run-tests.mjs`; expected all tests pass. Commit.

### Task 3: 简体中文 Skill、指引与分发

**Files:** Modify `README.md`, `docs/{STUDENT-START,PROMPTS,TEACHER,INSTALL,VALIDATION,COMPATIBILITY}.md`, `submissions/README.md`, `templates/submission/README.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `skills/aibt-workshop/{SKILL.md,references/transports.md}`, `downloads/*`; create `docs/SUBMISSION-RULES.md`, `tools/package-skill.py`, `tests/distribution.test.mjs`.

**Interfaces:** Consumes Task 1 target and Task 2 check/overview. Standalone ZIP includes every shared runtime module and reference. Installer remains non-overwriting.

- [x] Skill baseline: independently demonstrate old Skill omits group path/identity. Already observed before authoring: destination `submissions/student/lesson-01/`, no group question or validation.
- [x] Write distribution tests, run them and observe missing packaging tool fail.
- [x] Update simplified Chinese guides and Skill 2.0.0; add reproducible ZIP packaging.
- [x] Run full suite; verify ZIP hashes, Qoder install/overwrite refusal and standalone help. Independently test revised Skill behavior. Commit.

### Task 4: 个人/小组混合提交和审查修正

**Files:** course.json、course.mjs、workshop.mjs、测试、Skill/指引/ZIP、tools/run-tests.mjs、CI。

**Interfaces:** submissionTarget(...,{login,lesson,group,kind})；kind 为 individual 或 team；个人按 members、小组按 representatives 授权，分支附 /<kind>。matchingGroupPulls 排除维护 PR，个人按账号筛选、小组跨代表排他。renderOverview 分开列出个人和小组。

- [x] RED：个人独立目录、同账号跨组/跨角色、成员不能冒充代表、多个成员并行、小组排他、维护 PR 过滤及不复用、作品测试哨兵不执行。
- [x] GREEN：实现双角色、双目录、双分支和相应总览，限定根 tests/ 的跨平台测试入口。
- [x] 同步简体中文文档和 ZIP，以新混合场景独立验证 Skill；在 Node20/当前 Node 跑完整课程测试。
- [x] 针对新增混合范围进行独立审查；原审查发现以回归测试验证，不重复派原修复审查。新增范围审查发现的双代表并发重复单，以真正同时创建的回归复现后修正，并复查本项。

### Final verification and PR

- [x] Run full suite on supported Node 20 and current Node; check whitespace/diff and distribution hashes.
- [x] Obtain one independent whole-branch review; resolve important findings with regression tests.
- [x] Push only feature branch to yuhsiuli fork. Create maintenance PR to teacher main; read back base/head/author/diff and CI state. Leave approval/merge to teacher.

结果：[维护 PR #3](https://github.com/f3484134/AIBT-WORKSHOP-261107/pull/3)，作者 yuhsiuli，目标 main，公开待审，未批准或合并。43 项课程测试在本地 Node 20/当前版本及 Fork Linux/Windows Node 20 均通过；原并发问题的独立复查通过。老师 main 的新分组工作流仍需合并后启用。
