# Business Workflows & Domain Model
**Ditel Network Solutions Inventory System**

## 1. Laptop Lifecycle State Machine

Because laptops are the core physical asset and are subject to strict accounting rules, they undergo a rigorous lifecycle rather than simply being deleted from the database.

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Added to System

    AVAILABLE --> RENTED : Create Rental
    AVAILABLE --> SOLD : Create Sale
    AVAILABLE --> DEMO : Assign Demo
    AVAILABLE --> UNDER_MAINTENANCE : Send for Maintenance
    AVAILABLE --> RETURNED_TO_SUPPLIER : Return to Vendor
    AVAILABLE --> WRITTEN_OFF : Mark as Scrapped

    RENTED --> AVAILABLE : Process Return
    SOLD --> AVAILABLE : Process Return
    DEMO --> AVAILABLE : Process Return
    DEMO --> RENTED : Convert to Rental
    DEMO --> SOLD : Convert to Sale
    
    UNDER_MAINTENANCE --> AVAILABLE : Maintenance Done
    
    RETURNED_TO_SUPPLIER --> [*] : Terminal State
    WRITTEN_OFF --> [*] : Terminal State
```

## 2. Business Workflows

### 2.1 The Rental & Return Workflow

```mermaid
flowchart TD
    Start([Customer Requests Rental]) --> Check[Check Available Inventory]
    Check --> CreateRental[Create Rental Record]
    CreateRental --> Snapshot[Snapshot Laptop Specs into RentalItem]
    Snapshot --> UpdateStatus[Update Laptop Status: AVAILABLE -> RENTED]
    UpdateStatus --> StockMove[Log StockMovement: OUT]
    StockMove --> EndOut([Laptops with Customer])
    
    EndOut --> ReturnReq([Customer Returns Laptops])
    ReturnReq --> NewChildRental[Create Child Rental Record (Status: RETURNED)]
    NewChildRental --> RestoreStatus[Update Laptop Status: RENTED -> AVAILABLE]
    RestoreStatus --> StockMoveIn[Log StockMovement: RETURN]
    StockMoveIn --> End([Laptops back in Stock])
```

### 2.2 The Demo Conversion Workflow

```mermaid
flowchart TD
    Start([Assign Demo]) --> DemoStatus[Laptop -> DEMO Status]
    DemoStatus --> Eval([Customer Evaluation Period])
    
    Eval --> Feedback{Customer Decision}
    Feedback -- "Reject" --> ReturnDemo[Process Return]
    ReturnDemo --> ReturnAvail[Laptop -> AVAILABLE]
    
    Feedback -- "Keep (Rent)" --> ConvertRent[Convert Demo to Rental]
    ConvertRent --> RentStatus[Laptop -> RENTED]
    ConvertRent --> GenRent[Generate Rental Contract]
    
    Feedback -- "Keep (Buy)" --> ConvertSale[Convert Demo to Sale]
    ConvertSale --> SaleStatus[Laptop -> SOLD]
    ConvertSale --> GenSale[Generate Sale Invoice]
```

### 2.3 CRM Lead Pipeline Workflow

```mermaid
flowchart LR
    L_NEW([NEW]) --> |Staff contacts lead| L_CONTACTED([CONTACTED])
    L_CONTACTED --> |Pricing discussed| L_NEGOTIATION([NEGOTIATION])
    
    L_NEGOTIATION --> |Deal Won| L_CONVERTED([CONVERTED])
    L_NEGOTIATION --> |Deal Lost| L_LOST([LOST])
    
    L_CONVERTED --> GenCustomer[Atomic Creation: New Customer Profile]
```

## 3. Domain Model

The Domain Model abstracts the relational tables into core business concepts.

```mermaid
classDiagram
    class Customer {
        +String name
        +String customerType (Individual/Company)
        +Decimal creditLimit
        +boolean isActive
    }

    class Asset {
        <<Laptop>>
        +String serialNumber
        +String assetTag
        +String status
        +Decimal salePrice
        +Decimal rentPrice
    }

    class Transaction {
        <<Abstract>>
        +Date eventDate
        +String status
        +Decimal totalAmount
    }

    class SnapshotLineItem {
        <<Abstract>>
        +String snapshotSerialNumber
        +Decimal historicalPrice
        +String historicalSpecs
    }

    class Invoice {
        +String invoiceNumber
        +String status (Paid/Unpaid)
        +Decimal gstAmount
        +generatePDF()
        +emailCustomer()
    }
    
    class AuditLedger {
        +String action
        +JSON diff
        +DateTime timestamp
        +User performedBy
    }

    Customer "1" -- "*" Transaction : Initiates
    Customer "1" -- "*" Asset : Currently Holds
    Customer "1" -- "*" Invoice : Billed Via
    
    Transaction <|-- Rental
    Transaction <|-- Sale
    Transaction <|-- Demo
    
    Transaction "1" *-- "*" SnapshotLineItem : Contains
    SnapshotLineItem "*" --> "1" Asset : References (FK)
    
    System --> AuditLedger : Records all changes
```

## 4. Core Business Rules

1. **Denormalized Historical Accuracy**: A `RentalItem`, `SaleItem`, or `DemoItem` must copy the laptop's brand, model, serial, specs, and price fields directly into its own table row upon creation. If a laptop is later upgraded (e.g., RAM added) and the base model is updated, the historical rental contract MUST reflect the original specs and price.
2. **Immutable Ledgers**: Rows in `StockMovement`, `LaptopHistory`, `CustomerHistory`, and `AuditLog` can only be INSERTED. They cannot be UPDATED or DELETED by the application logic.
3. **Terminal States**: `WRITTEN_OFF` and `RETURNED_TO_SUPPLIER` are absolute terminal states. Laptops in these states cannot be rented, sold, or modified.
4. **Child-Chain Replacements**: When a laptop is swapped out (replaced) during a rental, a new `Rental` record is created with a foreign key (`parent_rental`) pointing to the original contract, rather than mutating the original contract. This preserves the billing dates and timeline of physical possession.
