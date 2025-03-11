erDiagram
    User ||--o{ TimeEntry : creates
    User ||--o{ TimeTrackingSettings : has
    User ||--o{ BillableRate : has
    Project ||--o{ TimeEntry : contains
    Project ||--o{ BillableRate : has
    Task ||--o{ TimeEntry : has
    TaskType ||--o{ Task : categorizes
    TaskType ||--o{ BillableRate : has
    Invoice ||--o{ TimeEntry : includes
    
    User {
        string id PK
        string email
        string name
        string role
        datetime createdAt
        datetime updatedAt
    }
    
    Project {
        string id PK
        string name
        string description
        string clientId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Task {
        string id PK
        string name
        string description
        string projectId FK
        string taskTypeId FK
        string assigneeId FK
        string status
        datetime createdAt
        datetime updatedAt
    }
    
    TaskType {
        string id PK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }
    
    TimeEntry {
        string id PK
        string taskId FK
        string projectId FK
        string userId FK
        string description
        datetime startTime
        datetime endTime
        int duration
        boolean billable
        string invoiceId FK
        float billableRate
        string[] tags
        string source
        datetime createdAt
        datetime updatedAt
    }
    
    TimeTrackingSettings {
        string userId PK
        float defaultBillableRate
        int roundingInterval
        int autoStopTimerAfterInactivity
        int reminderInterval
        json workingHours
        datetime createdAt
        datetime updatedAt
    }
    
    BillableRate {
        string id PK
        string projectId FK
        string userId FK
        string taskTypeId FK
        float hourlyRate
        string currency
        datetime effectiveFrom
        datetime effectiveTo
        datetime createdAt
        datetime updatedAt
    }
    
    Invoice {
        string id PK
        string clientId FK
        string number
        datetime date
        datetime dueDate
        float amount
        string status
        datetime createdAt
        datetime updatedAt
    } 