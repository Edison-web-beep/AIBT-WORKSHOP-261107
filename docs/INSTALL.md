# 安装提交 Skill

Skill 名称固定为 `aibt-workshop`，当前分组版为 **2.0.0**。同一份 Skill 包含初始化 Fork、首次连接测试与日后按练习、组别提交，不用分别装多个 Skill。Qoder 与 WorkBuddy 使用同一份 scripts、references 和规则。

## WorkBuddy：下载并导入

1. [下载 aibt-workshop.zip](../downloads/aibt-workshop.zip?raw=true)。如果 GitHub 先显示文件页，按 Download raw file。
2. 打开 WorkBuddy →「专家·技能·连接器」→「技能」→「添加技能」→「上传技能」，选这个 ZIP。界面名称可能因版本略有差异。
3. 在连接器中连接自己的 GitHub；完成 GitHub 授权。
4. 新开对话，粘贴 [首次初始化 Prompt](STUDENT-START.md)。

若 ZIP 导入器要求 SKILL.md 位于根目录，先解压，选择其中的 `aibt-workshop` 文件夹，或将该文件夹内文件重压为 ZIP。标准下载包包含一层 `aibt-workshop/`。

## Qoder / Codex / Claude Code：给 Agent 这段话

先开一个课程项目文件夹，再复制下文。它会将 Skill 装在该项目，不修改其他课程或个人全局设置。

```text
请帮我安装 AIBT 课堂提交 Skill 2.0.0（分组版）。
来源：https://github.com/f3484134/AIBT-WORKSHOP-261107
只安装 skills/aibt-workshop 这个文件夹，保留 scripts 和 references。
请识别当前工具：Qoder 放 .qoder/skills/aibt-workshop，
Codex 放 .agents/skills/aibt-workshop，Claude Code 放 .claude/skills/aibt-workshop。
请安装在当前课程项目；若已安装，先确认版本，不直接覆盖。
可以下载课程 ZIP 解压后，使用 tools/install-skill.mjs 安装。
完成后读取 SKILL.md，告诉我是否需要重新打开 IDE／对话。
接着使用 aibt-workshop 初始化并执行完整连接测试；需要我登录时提示我。
```

如果 Agent 无法下载，从 Repo 右上「Code → Download ZIP」，解压后把项目文件夹交给 Agent，说「请从这个文件夹依 docs/INSTALL.md 安装」。Skill 未出现时重新打开 IDE／对话。

Qoder 可用 `/aibt-workshop` 明确调用；Codex 可用 `$aibt-workshop`；Claude Code 可用 `/aibt-workshop`。跨工具的自然语言写法是「使用 aibt-workshop，……」。

## QoderWork / Claude Cowork

- QoderWork 与 Qoder IDE 的路径不同；依产品界面导入，或将 `aibt-workshop/` 放到 `~/.qoderwork/skills/`，再重新打开对话。不要套用 Qoder IDE 项目路径。
- Claude Cowork：Customize → Skills → 导入 [ZIP](../downloads/aibt-workshop.zip?raw=true)，并让任务能读作品文件夹。可用的 GitHub 写入能力依当前工具而定；「Add from GitHub」作为参考资料不等于能上传。

## 需要 GitHub CLI 吗？

**不一定。** Skill 先检查原生 Connector。能 Fork、创建分支、上传这次的文件格式、创建并读取 PR，就可以完成。

若只缺 Fork，可由学生在 GitHub 网页完成一次；若缺写入或图片／演示文稿上传能力，使用备用 helper，需要 [GitHub CLI](https://cli.github.com/) 和 [Node.js LTS](https://nodejs.org/)（20+），不用 npm 软件包，也不用本地 Git。

可给 Agent：

```text
当前 Connector 无法完成这次上传，请依 aibt-workshop 的 CLI 备用方案。
先检查 Node.js 和 GitHub CLI，只安装缺少的官方工具，
引导我在浏览器登录自己的 GitHub，再重新执行完整连接测试。
```

登录命令为 `gh auth login --hostname github.com --web --git-protocol https`。学生在浏览器完成登录，Agent 不需要知道密码或 Token。Connector 登录不会自动让 gh 登录。

## 安装范围与更新

项目内安装只对该项目有效；请在同一个课程项目中完成练习。WorkBuddy／Cowork 的界面导入范围依产品为准。

上课前可统一下载一次 ZIP，由老师通过课程群组或 U 盘分发；文件不含任何账号密码。这能减少 GitHub 下载不稳对安装的影响，实际提交仍需要连到 GitHub API。

从旧版升级时先读取现有 SKILL.md 的 metadata.version；没有版本字段的属于旧版。不要直接覆盖：Qoder/Codex/Claude 项目可先把原 Skill 备份到项目的 `.aibt-local/skill-backups/`，再使用项目安装器安装新版；WorkBuddy 按技能界面的更新或重新导入流程操作。保留完整 scripts（包括 course.mjs）和 references，重新打开对话，并让 Agent 报告已读取版本 2.0.0。

正式提交示例：「使用 aibt-workshop，提交练习一第三组，作品在当前选中的文件夹。」老师需先在 course.json 登记该组代表；连接测试无需登记。完整规则见 [统一提交规则](SUBMISSION-RULES.md)。
