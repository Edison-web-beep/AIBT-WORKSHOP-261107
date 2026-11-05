# 安裝提交 Skill

Skill 名稱固定為 `aibt-workshop`。同一份 Skill 包含初始化 Fork、首次連線測試與日後交件，不用分別裝多個 Skill。

## WorkBuddy：下載並匯入

1. [下載 aibt-workshop.zip](../downloads/aibt-workshop.zip?raw=true)。如果 GitHub 先顯示檔案頁，按 Download raw file。
2. 開啟 WorkBuddy →「專家·技能·連接器」→「技能」→「添加技能」→「上傳技能」，選這個 ZIP。介面名稱可能因版本略有差異。
3. 在連接器中連接自己的 GitHub；完成 GitHub 授權。
4. 新開對話，貼 [首次初始化 Prompt](STUDENT-START.md)。

若 ZIP 匯入器要求 SKILL.md 位於根目錄，先解壓，選擇其中的 `aibt-workshop` 資料夾，或將該資料夾內檔案重壓為 ZIP。標準下載包包含一層 `aibt-workshop/`。

## Qoder / Codex / Claude Code：給 Agent 這段話

先開一個課程專案資料夾，再複製下文。它會將 Skill 裝在該專案，不修改其他課程或個人全域設定。

```text
請幫我安裝 AIBT 課堂提交 Skill。
來源：https://github.com/f3484134/AIBT-WORKSHOP-261107
只安裝 skills/aibt-workshop 這個資料夾，保留 scripts 和 references。
請辨識目前工具：Qoder 放 .qoder/skills/aibt-workshop，
Codex 放 .agents/skills/aibt-workshop，Claude Code 放 .claude/skills/aibt-workshop。
請安裝在目前課程專案；若已安裝，先確認版本，不直接覆蓋。
可以下載課程 ZIP 解壓後，使用 tools/install-skill.mjs 安裝。
完成後讀取 SKILL.md，告訴我是否需要重開 IDE／對話。
接著使用 aibt-workshop 初始化並執行完整連線測試；需要我登入時提示我。
```

如果 Agent 無法下載，從 Repo 右上「Code → Download ZIP」，解壓後把專案資料夾交給 Agent，說「請從這個資料夾依 docs/INSTALL.md 安裝」。Skill 未出現時重新開啟 IDE／對話。

Qoder 可用 `/aibt-workshop` 明確呼叫；Codex 可用 `$aibt-workshop`；Claude Code 可用 `/aibt-workshop`。跨工具的自然語言寫法是「使用 aibt-workshop，……」。

## QoderWork / Claude Cowork

- QoderWork 與 Qoder IDE 的路徑不同；依產品介面匯入，或將 `aibt-workshop/` 放到 `~/.qoderwork/skills/`，再重開對話。不要套用 Qoder IDE 專案路徑。
- Claude Cowork：Customize → Skills → 匯入 [ZIP](../downloads/aibt-workshop.zip?raw=true)，並讓任務能讀作品資料夾。可用的 GitHub 寫入能力依當前工具而定；「Add from GitHub」作為參考資料不等於能上傳。

## 需要 GitHub CLI 嗎？

**不一定。** Skill 先檢查原生 Connector。能 Fork、建立分支、上傳這次的檔案格式、建立並讀回 PR，就可以完成。

若只缺 Fork，可由學生在 GitHub 網頁完成一次；若缺寫入或圖片／簡報上傳能力，使用備援 helper，需要 [GitHub CLI](https://cli.github.com/) 和 [Node.js LTS](https://nodejs.org/)（20+），不用 npm 套件，也不用本地 Git。

可給 Agent：

```text
目前 Connector 無法完成這次上傳，請依 aibt-workshop 的 CLI 備援設定。
先檢查 Node.js 和 GitHub CLI，只安裝缺少的官方工具，
引導我在瀏覽器登入自己的 GitHub，再重新執行完整連線測試。
```

登入命令為 `gh auth login --hostname github.com --web --git-protocol https`。學生在瀏覽器完成登入，Agent 不需要知道密碼或 Token。Connector 登入不會自動讓 gh 登入。

## 安裝範圍與更新

專案內安裝只對該專案有效；請在同一個課程專案中完成練習。WorkBuddy／Cowork 的介面匯入範圍依產品為準。

上課前可統一下載一次 ZIP，由老師透過課程群組或隨身碟分發；檔案不含任何帳號密碼。這能減少 GitHub 下載不穩對安裝的影響，實際交件仍需要連到 GitHub API。
