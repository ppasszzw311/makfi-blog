---
title: "CancellationToken 的作用"
slug: CancellationToken_usetage
index: 0
description: "紀錄自己在開發 .NET 時遇到的問題與疑問，瞭解CancellationToken應用的情境與具體的實踐"
category: ".NET"
tags: [.NET, NETCore, API]
published: 2026-09-17
draft: false
---

最近在請AI開發API的程式碼的時候，常常看到 **CancellationToken** 這個設定，總感覺每一段呼叫都要加上這段好像有點雞肋，實際一查發現其實也是可以作為參考使用的。

## 定義
在 .NET 的開發中，特別是使用非同步程式(async/await)的時候，經常會遇到一些狀況是，當使用者呼叫的時候，如果遇到客戶端斷開、超時或關閉應用，但通常服務可能還是會跑完，只是回應的時候發現其實沒有人會去接收，會造成資源的浪費

那透過CancellationToken這個設定，目的就是可以節省核心的資源，並提升系統的吞吐量，以及避免記憶體洩漏與卡死的問題

## 有用跟沒用的差別

|情境|沒有使用 `CancellationToken`| 有使用 `CancellationToken`|
|---|---|---|
|使用者連線中斷|伺服器默默地跑完10秒的報表產出，結果只能將這結果丟進垃圾桶|伺服器在第一秒得知中斷後，馬上就停止計算，並釋放資源|
|打API遇到逾時(Timeout)|程式只能等100秒直到遠端有回應，導致執行緒被卡死|透過 `CancelAfter(5000)`設定，在五秒後就立刻中斷並且回應錯誤|
|微服務串聯|上游已經取消了，但下游的五個服務還在跑|取消訊號一路向下傳遞，相關的服務同步停止|

雖然說用途蠻好的，但經常會遇到的狀況 - 
1. 有寫，但是沒有向下傳遞 ~= 完全沒用
```C#
public async Task DoWorkAsync(CancellationToken ct)
{
  // 錯誤: ct 傳進來了，但沒有用
  // await Task.Delay(5000);

  // 改善方法
  await Task.Delay(5000, ct);
}
```
2. 


## 參考資料
* https://dotblogs.com.tw/donmadotblog/2026/01/12/csharp-cancellationtoken-common-mistakes-async-refactor
