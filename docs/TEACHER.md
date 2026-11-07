# 老师管理与验收

## 开课前登记

主仓库为 f3484134/AIBT-WORKSHOP-261107，公开、默认分支 main。学生使用自己的 Fork 和 PR，不需要老师仓库写入权限或共享密码。

1. 合并本更新，确认 Actions 已启用。
2. [course.json](../course.json) 预置 4 个练习和 5 个可扩充组别。
3. 每组填写可交个人作品的 members，以及可交共同作品的 representatives，例如：

```json
{
  "id": "group-03",
  "members": ["member-a", "member-b"],
  "representatives": ["group-uploader"]
}
```

示例账号需要替换。账号暂不确定就保留空数组；该角色不能正式提交，连接测试仍可进行。仅个人作业可以只填 members；仅小组作业可以只填 representatives；两类同时进行就分别填写。同一账号可列入多个组，也可同时是成员及代表，代表不必属于本组个人提交名单。

名单以老师 main 为准，不要求真名或联系方式，学生不能通过修改自己的 Fork 获得权限。增加组别使用 group-06 等，编号为 01–99，不要求预先建作品目录。

## 两类作品分别归档

| 角色 | 作品位置 | 并行与重交 |
|---|---|---|
| 个人 | submissions/lesson-NN/group-NN/individual/<账号>/ | 每人独立 PR，同组可多人并行 |
| 小组代表 | submissions/lesson-NN/group-NN/team/ | 每组每练习一个待审 PR，换代表前处理原单 |

相同账号可在同一练习提交自己的个人作品，也能代表小组交共同作品，两类互不覆盖。PR 标题分别为 [练习NN][第NN组][个人] <账号>、[练习NN][第NN组][小组] <账号>。修改复用同一作品的打开 PR，关闭/合并后补交使用 -r2 等版本。

## 审阅与维护

自动分组检查验证实际作者、来源、角色、练习、组别、类型、范围、README、链接与大小。检查及总览只使用可信代码，权限只读，不执行学生作品。课程测试入口为 `node tools/run-tests.mjs`，只运行仓库 tests/，不会发现作品中的测试脚本。

课程维护 PR（名单、教材、Skill、工作流及明确要求的文件清理）请由老师添加 course-maintenance 标签，再人工审阅全部差异。维护 PR 不计入作业，不阻挡重复检查，也不会被 helper 复用为正式作业。

建议 main 要求 PR 审阅及分组检查通过；本更新不修改仓库保护设置。教师另一个账号可以 Approve 和合并由学生测试账号创建的维护 PR；GitHub 不允许作者批准自己的 PR。

## 课堂总览

[课堂作品总览](https://github.com/f3484134/AIBT-WORKSHOP-261107/actions/workflows/submission-overview.yml)最新成功运行的 Summary 按练习、组别、个人/小组及账号排列。个人按成员显示，小组共同作品单列，区分未交、待登记、草稿、待审、已有版本和已合并，不将小组作品算成每个人都已提交。

PR 更新/关闭/合并和 main 更新会刷新，也可手动 Run workflow。总览写入 Actions 摘要，不自动推送 main；本地可用 `node tools/build-overview.mjs --output overview.md` 生成 Markdown。自动检查与总览需要本次更新合并到老师 main 后启用。

## Qoder / WorkBuddy 验收

统一分发 [Skill 2.0.0 ZIP](../downloads/aibt-workshop.zip?raw=true)。Qoder 安装到课程项目 .qoder/skills/aibt-workshop，WorkBuddy 从技能界面导入，保留 scripts 和 references 并重开对话。

1. 学生账号完整测试 Fork、文字/PNG、跨仓库草稿 PR；老师测试无法涵盖学生 Fork。
2. 登记两个成员及一个代表，用 README、图片和 PDF/PPTX 分别提交个人及小组作品。
3. 验证同组个人可并行、各目录独立，同一人可以交两类作品和获授权的不同组作品。
4. 改文件重交，确认复用相同类型的原单；合并后补交使用新版本。
5. 验证未登记账号、跨个人目录、跨类型或跨组提交被拒绝。
6. 在实际 Qoder/WorkBuddy UI、Connector 和教室网络中验收。没有完整 Connector 能力时使用 Node.js 20+ 与 gh，不把本地打包测试当成产品 UI 已验证。

## 升级与维护

旧版账号目录不会自动移动或删除，当前没有待迁移的已合并学生作品。请统一升级旧 Skill，旧连接测试 PR 保留。

维护命令：`node tools/run-tests.mjs`、`python3 tools/package-skill.py`、`git diff --check`。Skill 修改后同步更新 ZIP 和 SHA-256。单个 PR 检查用 `node tools/check-submission.mjs --pr <编号>`。
