# 老师管理与验收

## 开课前准备

主仓库为 f3484134/AIBT-WORKSHOP-261107，公开、默认分支 main。学生使用自己的 Fork 和 PR，不需要老师仓库写入权限或共享密码。

1. 合并本更新，确认 Actions 已启用。
2. [course.json](../course.json) 已列出 4 个练习，并使用 self-reported 自报模式；不包含成员或代表名单。
3. 统一分发 Skill 2.1.0，让学生完成首次连接测试。

**老师无需建立各组账号名单，也无需预建各组文件夹。** 学生提交时填写课堂组号（1–99）和个人/小组类型，工具读取实际登录账号，自动整理目录。首次出现的新组别同样可以提交。同一账号可跨组，也可同时交个人与共同作品。

自动检查能验证实际提交账号和文件范围，不能证明学生确实属于该组或获得组内代表资格；这些由老师审核 PR 时确认。填错组号时先处理错组 PR，再按正确组号重交；已合并作品的移动或清理由老师审阅维护 PR，不自动迁移。

## 两类作品分别归档

| 方式 | 作品位置 | 并行与重交 |
|---|---|---|
| 个人 | submissions/lesson-NN/group-NN/individual/<账号>/ | 每人独立 PR，同组可多人并行 |
| 小组代表 | submissions/lesson-NN/group-NN/team/ | 每组每练习一个待审 PR，换代表前处理原单 |

PR 标题分别为 [练习NN][第NN组][个人] <账号>、[练习NN][第NN组][小组] <账号>。修改复用同一作品的打开 PR，关闭/合并后补交使用 -r2 等版本。

多位代表同时提交时，Skill 在创建前后复查，以 PR 编号较早的一单为准，只关闭本次新建的较晚重复单，保留上传分支并给出链接。无法确认时学生会收到待处理提示，老师核对并协调；既有 PR 不自动关闭。

## 审阅与维护

自动检查验证作者、来源、开放练习、自报组号、类型、范围、README、链接与大小。检查及总览使用可信代码，权限只读，不执行学生作品。课程测试入口为 `node tools/run-tests.mjs`，只运行根 tests/。

课程维护 PR（课程配置、教材、Skill、工作流及明确要求的文件清理）请由老师添加 course-maintenance 标签，再人工审阅全部差异。维护 PR 不计入作业、不阻挡重复检查，也不复用为作业。

建议 main 要求 PR 审阅及分组检查通过；本更新不修改仓库保护设置。教师另一个账号可以 Approve 和合并由学生测试账号创建的维护 PR；GitHub 不允许作者批准自己的 PR。

## 课堂总览

[课堂作品总览](https://github.com/f3484134/AIBT-WORKSHOP-261107/actions/workflows/submission-overview.yml)最新成功运行的 Summary 自动发现已合并目录和打开的正式 PR，按练习、组别、类型和账号排列，分别显示个人与共同作品、暂无提交、草稿、待审和已合并。没有提交记录时不要求建名单。

**没有完整名单，无法判断全班谁还没交。** “暂无提交”仅表示已出现组别在该练习/类型下尚无记录；不能把共同作品算成每个人都已交，也不能据此认定某人缺交。

PR 更新/关闭/合并和 main 更新会刷新，也可手动 Run workflow。总览写入 Actions 摘要，不自动推送 main；本地可用 `node tools/build-overview.mjs --output overview.md` 生成 Markdown。新分组检查和总览须合并后启用。

## Qoder / WorkBuddy 验收

统一分发 [Skill 2.1.0 ZIP](../downloads/aibt-workshop.zip?raw=true)。Qoder 安装到课程项目 .qoder/skills/aibt-workshop，WorkBuddy 从技能界面导入，保留 scripts/references 并重开对话。

1. 学生账号完整测试 Fork、文字/PNG、跨仓库草稿 PR；老师测试无法涵盖学生 Fork。
2. 无需任何名单，用两个学生账号分别提交同组个人作品，再由其中一人提交共同作品。
3. 首次填写第八组，验证自动归档；同一账号可提交不同组及两类作品。
4. 改文件重交，确认复用相同类型的原单；合并后补交使用新版本。
5. 验证冒用别人的账号目录、跨本次目标目录或填入未开放练习被拒绝。
6. 在实际 Qoder/WorkBuddy UI、Connector 和教室网络中验收。能力不足时使用 Node.js 20+ 与 gh；本地打包测试不代表产品 UI 已验证。

旧版账号目录不会自动移动或删除，现有已安装 Skill 与连接测试 PR 保留。维护命令：`node tools/run-tests.mjs`、`python3 tools/package-skill.py`、`git diff --check`。Skill 修改后同步 ZIP 和 SHA-256。
