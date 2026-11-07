# 老师管理与验收

## 课程设置

主仓库为 f3484134/AIBT-WORKSHOP-261107，公开、默认分支 main。学生代表用个人 GitHub 账号 Fork、上传到自己分支，再向老师创建 PR；不需要给学生老师仓库的写入权限或共享密码。

## 开课前登记

1. 合并分组提交更新，确认 Actions 已启用。
2. 查看根目录 [course.json](../course.json)：已有 4 个练习和 5 个组别占位，组数可增加到 99，删除尚未使用的占位也可以。
3. 收集每组代表的 GitHub login，将对应 representative 的 null 改为账号字符串，例如：

```json
{ "id": "group-03", "representative": "your-group-representative" }
```

示例账号需要替换，不要求真名、手机号或邮箱。名单只在老师 main 生效；学生修改自己 Fork 的名单不会取得权限。未登记代表不能正式提交，仍能连接测试。更换代表前处理该组同练习的未关闭 PR。

课程维护 PR（名单、教材、Skill、工作流）由老师创建/添加 course-maintenance 标签，再人工审阅完整差异；该标签是维护者明确授权，不能给普通作业随意添加。

## 归档与审阅

作品固定按 `submissions/lesson-NN/group-NN/` 排列，由 Skill 创建目录。每组每练习一个打开的 PR，标题 `[练习01][第03组] <login>`。同组修改复用原单，已关闭/合并后新开 -r2 等版本。

自动「分组提交检查」会核对实际作者、代表、课次、组号、分支、标题、文件范围、README、重命名、删除、链接及大小。工作流使用可信 base 代码及登记，权限只读，不执行学生作品、不自动合并。

建议在 main 的规则中要求 PR 审阅及分组提交检查通过；本更新不修改仓库保护设置。教师用另一个账号审阅学生/维护账号创建的 PR，可以 Approve 和合并；GitHub 不允许作者批准自己的 PR。

## 按练习与组别查看总览

打开 [课堂作品总览](https://github.com/f3484134/AIBT-WORKSHOP-261107/actions/workflows/submission-overview.yml)，进入最新成功运行的 Summary。表格包含每个练习和组别、代表、状态、已合并作品和待审 PR。

- 待登记：代表为空；未交：没有已合并作品或打开的组别 PR。
- 草稿/待审：已有 PR，仍需查看 Checks 和 Files changed。
- 已合并：main 有该组作品 README；有更新 PR 时另标注「已有版本」。

PR 更新、关闭、合并和 main 更新都会刷新报告，也可 Run workflow 手动刷新。报告写入 Actions 摘要，不自动推送 main；本地可用 `node tools/build-overview.mjs --output overview.md` 生成 Markdown。实际动作和名单需要本次 PR 合并后才在老师 main 生效。

## Qoder / WorkBuddy 验收

统一分发 [Skill 2.0.0 ZIP](../downloads/aibt-workshop.zip?raw=true)。Qoder 安装到课程项目 .qoder/skills/aibt-workshop；WorkBuddy 由技能界面导入。保持 scripts、references 完整，重新打开对话。

1. 用学生个人账号执行初始化和完整文字/PNG/草稿 PR 测试；老师模式不能验证学生 Fork。
2. 登记一个实际小组代表，用 README、图片和一份 PDF/PPTX 提交练习一及对应组号。
3. 确认目的地 lesson-01/group-NN、二进制 SHA、PR 作者/base/head，以及分组检查结果。
4. 修改同组作品，确认更新同一个打开的 PR；老师合并后补交，应创建新版本 PR。
5. 换一个未登记账号或尝试跨组目录，确认被拒绝；在实际教室网络和两款产品中完成界面验收。

不要把本地 helper/ZIP 测试当作 WorkBuddy/Qoder UI 或所有 Connector 版本已验证。Connector 能力不足时用 Node.js 20+、gh 备用方案；不要求所有学生预先安装 CLI。

## 维护与升级

旧版按账号归档的作品不自动移动、删除；当前仓库尚无需要迁移的已合并学生作品。旧版 Skill 的正式作业路径会被新检查拒绝，请按 [安装指引](INSTALL.md) 统一升级；旧连接测试 PR 保留。

维护者执行 `node --test`、`python3 tools/package-skill.py`、`git diff --check`。打包器生成可重复 ZIP 及 SHA-256；源 Skill 修改后必须同步更新下载包。检查单个 PR 用 `node tools/check-submission.mjs --pr <编号>`。
