# 學生三步開始

## 1. 註冊帳號

到 https://github.com/signup 註冊個人帳號並驗證 Email。記住自己的帳號名稱。密碼、驗證碼、郵件驗證與登入授權請自己完成，不要貼給 Agent 或老師。

## 2. 安裝一次 Skill

下載 [aibt-workshop.zip](../downloads/aibt-workshop.zip?raw=true)，依 [安裝方法](INSTALL.md) 匯入自己的工具。WorkBuddy 可從「技能」上傳 ZIP；Qoder 可請 Agent 幫忙放進專案。

這不是瀏覽器版 ChatGPT 上傳附件；要在能讀取作品資料夾、使用 Skills 與 GitHub 工具的 Agent 環境操作。

## 3. 第一次就測到能交件

在 Agent 複製：

```text
使用 aibt-workshop，幫我初始化 AIBT-WORKSHOP-261107 課程並完成首次連線測試。
優先使用已連接的 GitHub；能力不足時引導我完成最少的必要設定。
請確認實際登入帳號，建立或確認我的 Fork，實際上傳測試文字與圖片，
建立草稿測試 PR，讀回驗證後給我 PR 連結及每一步的通過狀態。
```

首次可能出現兩種本人操作：

- 連接器／GitHub CLI 開啟 GitHub 授權頁，請自己完成。
- 連接器沒有 Fork 工具時，點 [建立自己的 Fork](https://github.com/f3484134/AIBT-WORKSHOP-261107/fork)，按 Create fork 後回來告訴 Agent「Fork 已完成，繼續測試」。

收到 **草稿測試 PR 連結**，而且文字、圖片、PR 都驗證通過，才算完整成功。只顯示「可連 GitHub」仍未完成測試。測試檔是 Agent 生成的小檔案，不會掃描或上傳你的作品。

## 正式交作業

把這次要公開的作品放在一個獨立資料夾，然後說：

```text
提交第 2 課作業，作品在這個資料夾：〈選取或貼上作品資料夾路徑〉。
```

不用自己建學生目錄、不用每次 Fork、不用記 Git 指令。想改進後重交，就說「更新第 2 課作業，作品在……」。

提交完成後留存 PR 連結。老師還沒合併時，在 [Pull requests](https://github.com/f3484134/AIBT-WORKSHOP-261107/pulls) 看作品；合併後在 [submissions](../submissions/) 看。

一次最多 200 檔、單檔 20 MiB、合計 50 MiB。大型影音可改放自己的公開分享連結，並寫入作品 README。檔案重新命名後舊檔會保留；需要移除時要另行指定。

更多情境見 [完整 Prompt 清單](PROMPTS.md)。
