@startuml
actor Customer
actor Cashier
actor "Kitchen Staff" as Kitchen
actor Admin

usecase "View Menu" as UC_ViewMenu
usecase "Place Order" as UC_PlaceOrder
usecase "Make Payment" as UC_MakePayment
usecase "Prepare Order" as UC_PrepareOrder
usecase "Deliver Order" as UC_DeliverOrder
usecase "Manage Inventory" as UC_ManageInventory
usecase "Update Menu" as UC_UpdateMenu

Customer --> UC_ViewMenu
Customer --> UC_PlaceOrder
Customer --> UC_MakePayment

Cashier --> UC_MakePayment

Kitchen --> UC_PrepareOrder
Kitchen --> UC_DeliverOrder

Admin --> UC_ManageInventory
Admin --> UC_UpdateMenu
@enduml
