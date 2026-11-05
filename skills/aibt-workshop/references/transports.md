# 選擇 GitHub 連線方式

## 連接器優先，但要查實際工具

需要以下能力，不可僅憑「已連接 GitHub」判斷：

| 操作 | 常見工具名或等效能力 |
|---|---|
| 確認本人身分、讀課程 | get_me / get_user_login、get_repository / fetch |
| 建立或確認 Fork | fork_repository，或學生在 GitHub 網頁完成一次 Fork |
| 讀分支、建立分支 | get_branch / list_branches、create_branch |
| 上傳與更新檔案 | push_files / create_or_update_file（確認格式）；或 Git blob/tree/commit/ref API |
| PR 與重試 | list_pull_requests、create_pull_request、get_pull_request |
| 驗證內容 | get_file_contents 或 Git tree/blob SHA |

工具名稱、參數與授權以當前宿主 schema 為準，不猜測不存在的工具。GitHub 官方 MCP 的文字工具 content 為原始文字；不要把圖片的 base64 當文字檔提交。若有 create_blob(encoding=base64) 搭配 tree/commit/ref，可無損上傳二進位。若只有文字工具，文字作品可走 connector，圖片、PDF、簡報等改走 CLI；不宣稱二進位測試通過。

缺 Fork 工具但其餘能力齊全時，讓學生先在 https://github.com/f3484134/AIBT-WORKSHOP-261107/fork 按 Create fork。這只做一次；然後繼續同一個 Skill。不要為缺一個工具強迫安裝全部工具。

## 連接器執行流程

1. 讀實際登入帳號和課程資料。若已有 `<login>/AIBT-WORKSHOP-261107`，確認它的 parent 是課程倉庫；同名不相關 repo 不覆寫。
2. 初始化／試交／正式提交時才建立 Fork。GET 404 與權限不足要區分；Fork 建立後最多檢查 6 次，每次約 2 秒，逾時留待稍後重試。
3. 選擇分支規則與 helper 相同。先查對應 PR。開啟的 PR 重用；關閉／已合併用下一個 `-rN`。未開 PR 的既有分支先檢查差異只在本人課次內，不冒然覆寫。
4. 新分支從老師 main 建立。若 fork API 不能使用最新 upstream SHA，不 reset Fork；提示在 GitHub Sync fork 更新，遇衝突停止處理。
5. 用來源檔案掃描結果上傳，只改固定目錄。Git tree 的 base_tree 必須是目標分支目前 tree，commit parent 必須是目前 head。更新 ref 前再讀 head，拒絕併發覆寫，不 force。
6. 測試內容：`connection-tests/<login>/connection.md`（不含本機絕對路徑、Email、電腦資訊）與 `pixel.png`。分支 `aibt/<login>/connection-test`，PR 標題 `[連線測試] <login> / connection-test`，draft=true。沒能力建立草稿就使用 CLI，不能把普通 PR 說成草稿。
7. 正式提交 PR 標題 `[作業] <login> / lesson-NN`，base=main，head=`<login>:<branch>`，draft=false。內容簡述作品與課次，不貼本機路徑或環境資料。已存在的 PR 不重複開。
8. 驗證檔案內容／SHA 及 PR metadata。回報驗證涵蓋文字、圖片、Fork、PR 哪些階段。測試 PR 保留為草稿，不自動合併或刪除。

## CLI 備援

連接器能力不足或無法讀取本地檔案時，用 `scripts/workshop.mjs`；只需 Node.js 20+、GitHub CLI，不需 Git。先檢查是否已安裝，只有缺少時才提供官方安裝入口：

- GitHub CLI：https://cli.github.com/
- Node.js LTS：https://nodejs.org/
- Windows 可使用官方 winget 套件 `GitHub.cli` 和 `OpenJS.NodeJS.LTS`，由 IDE 協助安裝；若宿主不允許執行安裝，給學生一個明確點選步驟。

登入由學生完成：`gh auth login --hostname github.com --web --git-protocol https`。在瀏覽器完成 device flow。不要請學生貼 Token、密碼、device code 到公開 repo。`gh auth status` 只看是否登入，不印 Token。Connector 的登入與 gh 的登入彼此獨立。

Helper 透過 `gh api` 呼叫 GitHub API，因此能保留文字與二進位檔。正式提交不讀用戶的 Git 暫存區、不切換工作目錄分支、不改 remote。故既有專案是否用 Git 管理不影響上傳。

## 有限重試

網路中斷可能已成功寫入；先讀 Fork、分支、檔案與 PR 再重試相同操作。不要無限迴圈。401 登入、403 檢查權限／頻率、新 Fork 不在 connector 授權範圍、404 確認名稱與授權、422 檢查已有 Fork／分支／PR 或上游 commit。中國境內可讀 github.com 不保證 api.github.com 可連，首次測試需在實際上課的網路執行。不要繞過憑證錯誤或關閉安全檢查。
