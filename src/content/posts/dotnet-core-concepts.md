---
title: ".NET 核心概念筆記：物件導向與 SOLID 原則"
slug: dotnet-core-concepts
index: 0
description: "整理 .NET 基礎架構、物件導向三大特性與 SOLID 原則的重點筆記，並附上資料庫連線與支付系統的實作案例"
category: ".NET"
tags: [.NET, OOP, SOLID]
published: 2025-04-27 22:15:18
draft: true
---

## .NET 基礎架構

### CLR (Common Language Runtime)
- .NET 的執行環境，負責：
  - 記憶體管理（垃圾回收）
  - 安全性檢查
  - 例外處理
  - 執行緒管理
  - 類型檢查

### CLI (Common Language Infrastructure)
- .NET 的標準規範，包含：
  - CTS (Common Type System)：定義 .NET 中的資料類型
  - CLS (Common Language Specification)：定義語言互操作性的規則
  - 元數據（Metadata）
  - 中間語言（IL）

### 編譯過程
1. 原始碼（C#/VB.NET）→ 編譯器 → IL 代碼
2. IL 代碼 → JIT 編譯器 → 機器碼
3. 機器碼 → CPU 執行

## 物件導向的三大特性

### 封裝(Encapsulation)
- 概念：將資料和方法包裝在一起，隱藏內部實作細節
- 實現方式：存取控制修飾子
  * public：公開存取
  * private：僅類別內部存取
  * protected：類別內部及繼承類別存取
  * internal：同一組件內存取
  * protected internal：同一組件內或繼承類別存取
  * private protected：同一組件內的繼承類別存取

### 繼承
- 概念：子類別繼承父類別的特性，並可以擴展或修改
- 類型：
  * 單一繼承：一個類別只能繼承一個父類別
  * 多重繼承：通過介面實現
  * 多層繼承：類別可以繼承自另一個繼承類別

### 多型
- 概念：不同類別對同一方法有不同的實作
- 實現方式：
  * 抽象類別（Abstract Class）
  * 介面（Interface）
  * 虛擬方法（Virtual Method）
- 相關概念：
  * 多載(Overload)：同一個類別中，方法名稱相同但參數不同
  * 覆寫(Override)：子類別重新定義父類別的方法

## SOLID 原則

### 單一職責原則 (Single Responsibility Principle)
- 一個類別應該只有一個改變的理由
- 將不同的職責分離到不同的類別中

### 開放封閉原則 (Open/Closed Principle)
- 對擴展開放，對修改封閉
- 通過繼承和介面實現擴展

### 里氏替換原則 (Liskov Substitution Principle)
- 子類別必須能夠替換其父類別
- 保持繼承關係的正確性

### 介面隔離原則 (Interface Segregation Principle)
- 客戶端不應該依賴它不需要的介面
- 將大介面拆分為小介面

### 依賴反轉原則 (Dependency Inversion Principle)
- 高層模組不應該依賴低層模組
- 兩者都應該依賴抽象
- 抽象不應該依賴細節
- 細節應該依賴抽象

## 實際應用案例

### 資料庫連線
```csharp
public abstract class DbConnection
{
    public abstract void Connect();
    public abstract void Disconnect();
}

public class SqlConnection : DbConnection
{
    public override void Connect()
    {
        // SQL Server 連線邏輯
    }

    public override void Disconnect()
    {
        // SQL Server 斷線邏輯
    }
}
```

### 支付系統
```csharp
public interface IPaymentProcessor
{
    void ProcessPayment(decimal amount);
}

public class CreditCardPayment : IPaymentProcessor
{
    public void ProcessPayment(decimal amount)
    {
        // 信用卡支付邏輯
    }
}

public class PayPalPayment : IPaymentProcessor
{
    public void ProcessPayment(decimal amount)
    {
        // PayPal 支付邏輯
    }
}
```

## 學習資源

- [Microsoft .NET 官方文檔](https://docs.microsoft.com/zh-tw/dotnet/)
- [C# 指南](https://docs.microsoft.com/zh-tw/dotnet/csharp/)
- [物件導向設計原則](https://refactoring.guru/design-patterns/csharp)
- [SOLID 原則詳解](https://www.dofactory.com/net/design-patterns)
