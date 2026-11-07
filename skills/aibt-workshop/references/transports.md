# 选择 GitHub 连接方式

## 先查实际工具

优先已有 Connector；实际工具和参数以宿主 schema 为准，不猜测工具名称。

| 能力 | 示例工具或等效 API |
|---|---|
| 本人身份、课程读取 | get_me / get_user_login、get_repository / fetch |
| 老师登记 | 读取老师仓库 main 的 course.json，不能读取学生 Fork 代替 |
| Fork | fork_repository，或学生网页完成一次 Fork |
| 分支与写入 | branch/ref、blob（base64）、tree、commit |
| PR | 分页读取 PR、创建、读取状态，测试须能创建 draft |
| 验证 | 文件内容、Git tree/blob SHA、PR base/head/状态 |

只有文字上传工具时，不把图片 base64 当文字文件提交。支持 create_blob(encoding=base64) 与 tree/commit/ref 的 Connector 才能无损提交二进制；否则改走 CLI。若只缺 Fork，可让学生在 https://github.com/f3484134/AIBT-WORKSHOP-261107/fork 创建一次，不必因此安装全部 CLI 工具。

## Connector 执行契约

1. 确认实际账号和公开课程。已有 `<login>/AIBT-WORKSHOP-261107` 时核对 fork.parent 是课程；同名不相关仓库不覆盖。首次 Fork 后最多检查 6 次，每次约 2 秒。
2. 正式提交先读取老师 main 的 course.json（version=2）：练习和组别均已登记，组别 representative 非 null 且等于实际登录账号。缺组号先询问，账号不符或未登记则停止，不自行改名单。连接测试跳过此登记步骤。
3. 练习/组号归一为 lesson-NN、group-NN。远端固定 `submissions/lesson-NN/group-NN/`，分支 `aibt/<login>/lesson-NN/group-NN`。读取并分页查找 PR；同组同练习一个打开的 PR，关闭/合并后递增 -r2。不要复用旧版个人目录分支。
4. 扫描源目录，保留相对路径和二进制；根部必须有 README.md。每组本练习最多 200 文件、单个 20 MiB、总计 50 MiB；排除隐藏设置、依赖包、凭证、密钥和符号链接。先报告文件数、略过项目及公开目的地。
5. 新分支以老师最新 main 为基础。若 Fork 无法使用该 commit，提示在 GitHub Sync fork 更新，遇冲突停止；不 reset Fork。新 tree 基于当前 tree，commit parent 为当前 head。更新 ref 前再次读取 head，拒绝并发覆盖，force=false。
6. 只新增/更新本次文件，保留远端旧文件。读取完整树检查范围、文件数/大小、README 与符号链接；被截断时停止。PR 差异只能在本组本练习目录，重命名来源也须同范围，不删除文件。
7. 正式 PR：标题 `[练习NN][第NN组] <login>`，base=main，head=`<login>:<branch>`，draft=false。说明包含练习、组号、代表和作品介绍，不包含本机路径或环境资料。不要重复开 PR。
8. 连接测试：生成 `connection-tests/<login>/connection.md` 与 pixel.png，分支 `aibt/<login>/connection-test`，关闭后用 -r2，标题 `[连接测试] <login> / connection-test`，draft=true。老师账号用自己仓库的测试分支，并报告学生 Fork 未验证。
9. 读取远端文件 SHA 与 PR base/head/状态。测试保留草稿，不自动合并。仅只读诊断不建立 Fork、上传或发评论。

## CLI 备用

Qoder 与 WorkBuddy 有本地执行能力时均可使用同一份 scripts/workshop.mjs。仅需 Node.js 20+、GitHub CLI，无 npm 依赖、无本地 Git 仓库要求。先检查已安装工具，只有缺少时才提供官方入口：

- GitHub CLI：https://cli.github.com/
- Node.js LTS：https://nodejs.org/

Windows 可使用官方 winget 包 GitHub.cli 和 OpenJS.NodeJS.LTS；不能执行安装时给用户明确操作步骤。登录命令：

```text
gh auth login --hostname github.com --web --git-protocol https
```

由用户本人完成浏览器授权，不索取密码或 Token。Connector 与 CLI 登录独立，账号不同且尚未选定时先选择；用户已明确选定后继续使用该通道并读取确认实际账号，无需重复询问。不要把 device code、凭证写入公开仓库。

## 有限重试

网络中断可能已写入，先查 Fork、分支、文件与 PR 再重试。401 检查登录；403 检查权限/频率或新 Fork 是否在授权范围；404 核对名称和权限；422 检查已有 Fork/分支/PR 或上游 commit。不要无限重试、绕过凭证错误或关闭安全检查。实际课堂网络需确认 api.github.com 可用。
