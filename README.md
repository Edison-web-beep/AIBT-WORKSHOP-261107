# AIBT WORKSHOP · 261107

课程教材、个人/小组作品与课堂提交 Skill。老师：[@f3484134](https://github.com/f3484134)。

**学生：[三步开始](docs/STUDENT-START.md) → [安装 Skill](docs/INSTALL.md) → [提交规则](docs/SUBMISSION-RULES.md)。**

1. 注册 GitHub 个人账号，安装 aibt-workshop **2.1.0**（Qoder 项目安装或 WorkBuddy ZIP 导入）。
2. 说「使用 aibt-workshop，帮我初始化课程并完成首次连接测试」。
3. 提交时说明练习、组号、个人/小组类型及作品目录，例如「提交练习一第三组的个人作品，作品在选中的文件夹」。

本课程有 **4 个练习**。每组既可多人分别提交个人作品，也可由代表提交共同作品；同一账号可以参加或代表多个组。

```text
submissions/lesson-NN/group-NN/individual/<账号>/  个人作品
submissions/lesson-NN/group-NN/team/               小组共同作品
```

学生提交时自行填写组号（1–99），账号由 GitHub 登录结果自动取得。无需老师维护成员或代表名单，也无需预先建立各组文件夹；新组别首次提交时自动归档。老师在 PR 中确认组别并审阅作品。

老师合并后作品出现在 [submissions](submissions/)。合并前可在 [PR 清单](https://github.com/f3484134/AIBT-WORKSHOP-261107/pulls)观摩。

**[查看课堂作品总览](https://github.com/f3484134/AIBT-WORKSHOP-261107/actions/workflows/submission-overview.yml)**：打开最新成功运行的 Summary，按练习、组别、个人/小组及账号查看状态、作品和 PR。没有完整名单时，总览无法判断全班谁还没交。工作流随本更新合并后启用，也可手动刷新。

| 目录 | 用途 |
|---|---|
| [lessons/](lessons/) | 教材；[练习三材料](lessons/lesson-03/README.md)已提供 |
| [submissions/](submissions/) | 按练习、组别、类型归档的作品 |
| [connection-tests/](connection-tests/) | 生成的无个人信息连接测试文件 |
| [skills/aibt-workshop/](skills/aibt-workshop/) | Qoder、WorkBuddy 共用 Skill，含完整 helper 和参考说明 |
| [downloads/](downloads/) | ZIP 与 SHA-256 |
| [docs/](docs/) | 学生/老师指引、Prompt 和验证记录 |
| [templates/](templates/) | 作品 README 范本 |
| [tools/](tools/) | 安装、打包、课程测试、提交检查及总览工具 |

**老师开课前请看 [管理指引](docs/TEACHER.md)**：确认 Actions，再统一分发新版 Skill。无需预建名单；现有个人旧目录、已安装 Skill 和连接测试不会自动迁移或删除。

仓库、Fork、PR 和历史均公开，只提交可公开作品，不放密码、API Key、个人或公司内部资料。不要求真名、手机或邮箱；转用他人作品先确认来源与授权。
