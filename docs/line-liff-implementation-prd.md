# 實作 PRD：LINE LIFF 商品清單 SPA（TanStack + Cloudflare）

> 版本：v0.1（Implementation Plan）
> 對應產品需求：`docs/line-liff-prd.md`（v1.1）
> 文件目的：把產品需求拆成可執行的工程計畫、交付項與驗收流程

---

## 1. 文件定位與範圍

### 1.1 為什麼要另寫一份
- `line-liff-prd.md` 是「產品需求」文件，應保持穩定，重點是使用者需求與功能範圍。
- 本文件是「實作計畫 PRD」，重點是技術選型、任務拆解、時程與交付。
- 建議分開維護，避免需求變更與工程細節混在同一份文件，降低維護成本。

### 1.2 本文件涵蓋
- 前端技術棧與部署策略（TanStack SPA / Cloudflare Pages）
- 開發里程碑與任務拆解（M0-M3）
- 測試與驗收標準（可操作清單）
- 上線與回滾策略（無後端版本）

### 1.3 不涵蓋
- 會員、支付、訂單 webhook 等非 MVP 項目
- 私有資料保護方案（本案資料來源為可公開商品資料）

---

## 2. 技術決策（Architecture Decisions）

### 2.1 前端框架
- 使用 **React + Vite + TanStack Router** 建置 SPA。
- 路由結構採 file-based route（便於維護列表/詳情頁）。

### 2.2 資料層
- 首選：OpenSheet JSON endpoint。
- 備援：Google gviz CSV endpoint + 前端 parse（papaparse）。
- 本地快取：記憶體 + localStorage（含 timestamp），TTL 5 分鐘。

### 2.3 LIFF 整合
- App 啟動時 `liff.init()`。
- CTA 導出使用 `liff.openWindow({ url, external: true })`。
- 提供「純連結 + 複製」備援行為。

### 2.4 部署
- **MVP 預設部署：Cloudflare Pages（靜態 SPA）**。
- 設定 SPA fallback：`public/_redirects` 內 `/* /index.html 200`。
- 後續若需 server-side 能力（API、SSR）再升級到 Workers / TanStack Start。

### 2.5 追蹤分析
- 事件：`list_view`、`product_view`、`outbound_click`。
- MVP 優先使用第三方分析（GA4 或 Plausible）。

---

## 3. 專案結構（建議）

```txt
docs/
  line-liff-prd.md
  line-liff-implementation-prd.md
src/
  app/
    routes/
      __root.tsx
      index.tsx
      p.$id.tsx
  features/
    product/
      api/
      model/
      ui/
  lib/
    liff/
    analytics/
    sheet/
  styles/
public/
  _redirects
```

---

## 4. 資料模型與欄位規格

### 4.1 Sheet 欄位映射
- 必填：`id`, `name`, `price`, `image1`, `myshipUrl`, `status`, `sort`
- 選填：`currency`, `image2`, `shortDesc`, `description`, `tags`

### 4.2 前端型別（TypeScript）
- `RawSheetProduct`: 對應字串原始欄位
- `Product`: 正規化後型別（price number、tags string[]、status enum）

### 4.3 驗證與容錯
- 缺少必填欄位：該筆資料略過並記錄 warning
- `price` 非數字：標記為 `null` 並在 UI 顯示「請私訊詢價」或隱藏價格
- `status !== ACTIVE`：不進列表

---

## 5. 路由與頁面需求

### 5.1 `/` 商品列表頁
- 顯示：主圖、名稱、價格、短描述、tags
- 功能：搜尋（名稱/描述/tags）、排序（新品/熱賣/價格）
- 狀態：loading、error、empty
- 事件：首次成功載入送 `list_view`

### 5.2 `/p/$id` 商品詳情頁
- 顯示：圖片（MVP 至少 1 張）、完整描述、注意事項
- CTA：`前往 7-11 賣貨便下單`
- 事件：進頁送 `product_view`，點 CTA 送 `outbound_click`

### 5.3 錯誤與備援 UX
- endpoint 失敗：先嘗試 fallback endpoint
- 若仍失敗：嘗試讀 localStorage 最後成功快取
- 顯示「改用外部瀏覽器」提示與可複製連結

---

## 6. 里程碑與交付（Milestones）

### M0：骨架與部署打通（1-2 天）
- 建立 React + Vite + TanStack Router 專案
- 建立 Cloudflare Pages 專案與自動部署
- 設定 `_redirects` 確保 SPA 路由可運作
- 交付：可在手機透過 Pages 網址開啟空白首頁

### M1：資料串接與列表/詳情（2-3 天）
- 完成 OpenSheet 讀取與資料正規化
- 完成列表頁、詳情頁、路由跳轉
- 完成 LIFF `openWindow(external: true)`
- 交付：可從列表進入詳情並導出賣貨便

### M2：搜尋/排序/標籤與追蹤（1-2 天）
- 搜尋與排序邏輯
- tags UI（新品/熱賣/預購）
- 接入 GA4/Plausible 事件追蹤
- 交付：可查詢商品且可在分析工具看到核心事件

### M3：穩定性與上線（1-2 天）
- fallback endpoint + localStorage cache
- 錯誤訊息與備援行為完善
- 跨裝置實測（iOS Safari / Android Chrome / LINE in-app）
- 交付：上線版本與驗收紀錄

---

## 7. 驗收清單（UAT Checklist）

### 功能驗收
- 可從 LIFF URL 開啟列表頁
- 點商品可進入正確詳情頁
- 點 CTA 可外開至正確 `myshipUrl`
- Google Sheet 更新後 5 分鐘內可反映

### 相容性驗收
- iOS（LINE 內建 + Safari）可完成導出
- Android（LINE 內建 + Chrome）可完成導出
- 網路較慢時能看到 loading/error UI，不會白屏

### 數據驗收
- `list_view`、`product_view`、`outbound_click` 皆可被記錄

---

## 8. 風險與因應

- OpenSheet 不穩：自動切到 gviz CSV + 本地快取
- LINE 內建瀏覽器限制：預設 external 開啟 + 純連結備援
- Sheet 欄位填錯：前端 schema 驗證 + 友善錯誤提示

---

## 9. 上線與回滾

### 9.1 上線流程
- 合併 `main` 觸發 Cloudflare Pages build
- 驗證 production URL
- 更新 LIFF Endpoint URL
- 發佈群組置頂 LIFF 連結

### 9.2 回滾策略
- Cloudflare Pages 回退到前一個部署版本
- 保留舊版 LIFF endpoint（必要時切回）

---

## 10. 後續擴充（非 MVP）

- TanStack Query 導入（改善快取與重試策略）
- Workers API（保護資料來源、加入簽名驗證）
- 半自動對單流程（Google Form / Airtable / webhook）

---

## 11. 決策結論

- **建議：另寫一份實作 PRD（就是本檔）**，原始 `line-liff-prd.md` 保持不動。
- 原始文件管理「做什麼」，本文件管理「怎麼做、何時交付、怎麼驗收」。
