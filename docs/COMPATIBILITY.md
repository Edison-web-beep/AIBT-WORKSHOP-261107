# 相容性與官方資料

整理日期：2026-11-05。這些是官方文件確認的功能；本課程 Skill 仍以當前實際可呼叫工具及真實試交為準。

| 工具 | 安裝 Skill | GitHub 判斷 |
|---|---|---|
| WorkBuddy | 技能介面匯入 ZIP | 官方列出 GitHub Connector；未公開保證每個版本皆提供 Fork、二進位上傳和 PR，因此先測工具 |
| Qoder IDE | `.qoder/skills/aibt-workshop/` | 支援 MCP／Connector 與原生 Git commit/push；原生 Git UI 不等於 Agent 已有 Fork 工具 |
| QoderWork | `~/.qoderwork/skills/aibt-workshop/` | 與 Qoder IDE 的 Skill 路徑不同；依實際工具檢查 |
| Codex | 專案 `.agents/skills/aibt-workshop/` | 可用本地工具與已連接 GitHub；不同 Connector 版本提供的寫入能力不同 |
| Claude Code | `.claude/skills/aibt-workshop/` | 可走 CLI 或配置 GitHub MCP |
| Claude Cowork | Customize → Skills 匯入 ZIP | GitHub「Add from GitHub」是取用內容的功能說明，不能據此推定可以寫回 |

GitHub CLI **不是 Skill 的必要條件**。使用 helper 時才需要 Node.js 20+ 和 gh。Skill 是操作流程；Connector／CLI 才是帳號授權與上傳通道，不能用 Skill 繞過登入。

GitHub 官方 MCP 有 Fork、分支、文字檔案和 PR 工具；二進位檔不能直接塞進僅收文字 content 的工具。可用 Git blob base64 API 的 connector 或 CLI helper 才能保留這些格式。

官方來源：

- [WorkBuddy Skills 匯入](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)
- [WorkBuddy 預設連接器](https://www.workbuddy.cn/document/default-mcp-connectors)
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
- [GitHub Fork 說明](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo)
- [從 Fork 建 PR](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork)
- [GitHub CLI](https://cli.github.com/)

GitHub Classroom 已於 2026 年 8 月停用；本課程流程不依賴它。[官方公告](https://github.blog/changelog/2026-08-27-github-classroom-deprecated/)
