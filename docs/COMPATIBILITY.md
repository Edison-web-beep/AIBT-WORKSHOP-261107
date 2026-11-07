# 相容性与官方资料

整理日期：2026-11-05。这些是官方文件确认的功能；本课程 Skill 仍以当前实际可调用工具及真实试交为准。

| 工具 | 安装 Skill | GitHub 判断 |
|---|---|---|
| WorkBuddy | 技能界面导入 ZIP | 官方列出 GitHub Connector；未公开保证每个版本皆提供 Fork、二进制上传和 PR，因此先测工具 |
| Qoder IDE | `.qoder/skills/aibt-workshop/` | 支持 MCP／Connector 与原生 Git commit/push；原生 Git UI 不等于 Agent 已有 Fork 工具 |
| QoderWork | `~/.qoderwork/skills/aibt-workshop/` | 与 Qoder IDE 的 Skill 路径不同；依实际工具检查 |
| Codex | 项目 `.agents/skills/aibt-workshop/` | 可用本地工具与已连接 GitHub；不同 Connector 版本提供的写入能力不同 |
| Claude Code | `.claude/skills/aibt-workshop/` | 可走 CLI 或配置 GitHub MCP |
| Claude Cowork | Customize → Skills 导入 ZIP | GitHub「Add from GitHub」是取用内容的功能说明，不能据此推定可以写回 |

GitHub CLI **不是 Skill 的必要条件**。使用 helper 时才需要 Node.js 20+ 和 gh。Skill 是操作流程；Connector／CLI 才是账号授权与上传通道，不能用 Skill 绕过登录。

## 分组版 2.0.0

Qoder 与 WorkBuddy 使用同一个 Skill，Connector 路线也必须读取老师 main 的 course.json，核对练习、组号、个人/小组类型及对应角色账号，不能因没有 CLI 而省略分组验证。Qoder 项目安装和 WorkBuddy ZIP 均包含 scripts/workshop.mjs、scripts/course.mjs 与 references/transports.md；不引入 npm 依赖。

维护测试覆盖带中文/空格路径的项目安装、拒绝覆盖、独立 ZIP 解压后运行 helper 和完整性校验。两款产品实际版本的 UI 载入、Connector 授权与课堂网络仍须按 [老师验收步骤](TEACHER.md) 现场验证。

GitHub 官方 MCP 有 Fork、分支、文字文件和 PR 工具；二进制文件不能直接塞进仅收文字 content 的工具。可用 Git blob base64 API 的 connector 或 CLI helper 才能保留这些格式。

官方来源：

- [WorkBuddy Skills 导入](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)
- [WorkBuddy 默认连接器](https://www.workbuddy.cn/document/default-mcp-connectors)
- [WorkBuddy Connector](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Connector)
- [Qoder Skills](https://docs.qoder.com/extensions/skills)
- [QoderWork Skills](https://docs.qoder.com/qoderwork/skills)
- [Qoder Connectors](https://docs.qoder.com/qoder/connectors)
- [Qoder Git 提交](https://docs.qoder.com/qoder/review-and-commit)
- [Codex Skills](https://learn.chatgpt.com/docs/build-skills)
- [Claude Skills／Cowork](https://support.claude.com/en/articles/12512180-use-skills-in-claude)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Claude GitHub integration](https://support.claude.com/en/articles/10167454-use-the-github-integration)
- [GitHub 官方 MCP Server](https://github.com/github/github-mcp-server)
- [GitHub Fork 说明](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo)
- [从 Fork 建 PR](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork)
- [GitHub CLI](https://cli.github.com/)

GitHub Classroom 已于 2026 年 8 月停用；本课程流程不依赖它。[官方公告](https://github.blog/changelog/2026-08-27-github-classroom-deprecated/)
