# Converso Data Flow & Storage

## 📍 Where Data Lives

### **1. Lead Sources**
```mermaid
graph TD
    A[Lead Sources] --> B[PostgreSQL Database]
    A1[Manual Entry via API] --> A
    A2[CSV Import - TODO] --> A
    A3[Zoho CRM Sync - TODO] --> A
    A4[Web Forms - TODO] --> A
```

### **2. Data Storage Architecture**
```mermaid
erDiagram
    COMPANIES ||--o{ LEADS : has
    LEADS ||--o{ MESSAGES : receives
    LEADS ||--o{ CONVERSATION_THREADS : has
    LEADS ||--o{ CALENDAR_EVENTS : scheduled
    COMPANIES ||--o{ USERS : employs
    
    COMPANIES {
        uuid id PK
        string name
        json ai_config
        string twilio_phone_number
    }
    
    LEADS {
        uuid id PK
        uuid company_id FK
        string name
        string email
        string phone
        enum status
        json sentiment_score
        datetime last_contacted
    }
    
    MESSAGES {
        uuid id PK
        uuid lead_id FK
        uuid thread_id FK
        enum direction
        string channel
        text content
        json ai_metadata
        datetime created_at
    }
```

### **3. SMS Conversation Flow**
```mermaid
sequenceDiagram
    participant SMS as SMS (Twilio)
    participant API as Converso API
    participant DB as PostgreSQL
    participant AI as OpenAI
    
    SMS->>API: Incoming SMS webhook
    API->>DB: Find lead by phone number
    API->>DB: Fetch conversation history
    API->>AI: Analyze sentiment & generate reply
    AI-->>API: Smart reply + sentiment
    API->>DB: Store inbound message
    API->>DB: Store outbound reply
    API->>DB: Update lead status/sentiment
    API->>SMS: Send reply via Twilio
    API->>DB: Log outbound message
```

## 🗄️ Database Tables

### **1. `leads` Table**
- **Purpose**: Store all potential customers
- **Key fields**: phone (for SMS matching), sentiment_score, last_contacted
- **Updated**: Every interaction

### **2. `messages` Table**
- **Purpose**: Complete conversation history
- **Stores**: 
  - SMS content (inbound/outbound)
  - Voice transcripts
  - AI analysis metadata
  - Timestamps

### **3. `conversation_threads` Table**
- **Purpose**: Group related messages
- **Stores**: Context, summary, active status

## 🚀 Quick Start: Add Test Data

### **Option 1: Use the Script**
```bash
# After starting the app with docker-compose
python scripts/populate_test_data.py
```

### **Option 2: Use API**
```bash
# Create a lead
curl -X POST http://localhost:8000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+14165551234",
    "company": "Test Corp",
    "interest": "Product demo"
  }'
```

### **Option 3: Direct SQL**
```sql
-- Connect to PostgreSQL
docker-compose exec postgres psql -U converso

-- Insert test lead
INSERT INTO companies (id, name) VALUES 
  (gen_random_uuid(), 'Default Company');

INSERT INTO leads (id, company_id, name, email, phone, status) VALUES 
  (gen_random_uuid(), 
   (SELECT id FROM companies LIMIT 1),
   'John Doe',
   'john@example.com',
   '4165551234',
   'new'
  );
```

## 📱 Testing SMS Flow

1. **Add a lead** (phone must match your test phone)
2. **Send SMS** to your Twilio number
3. **Check database**:
   ```sql
   -- View messages
   SELECT * FROM messages ORDER BY created_at DESC;
   
   -- View lead updates
   SELECT name, phone, status, sentiment_score 
   FROM leads;
   ```

## 🔍 Where to Find Data

- **Leads**: `http://localhost:8000/api/leads`
- **Messages**: `http://localhost:8000/api/messages/lead/{lead_id}`
- **Database**: `docker-compose exec postgres psql -U converso`
- **Logs**: `docker-compose logs -f app`

## 📊 Future Integrations

The PRD mentions these lead sources (not yet implemented):
1. **Zoho CRM** - Automatic lead sync
2. **Google Sheets** - Import/export
3. **Web Forms** - Direct capture
4. **CSV Upload** - Bulk import