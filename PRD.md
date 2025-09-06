# Converso

## Terminology
- **DataStore** – Google Sheet / MongoDB  
- Google Sheet for Testing MongoDB

## Flow

### Bring in the leads
- Connect via CRM / Spreadsheet  
- Use Zoho as our CRM (acts as the database)  
- Leads should have a **company ID** to identify that they belong to different companies under Converso  

### Nurture Leads
- **Agentic Node** (used in both SMS / Call Flow)  
  - Read the lead information and understand the service requested  
  - Create an initial intro message or Smart Reply if history exists  
  - Replies should aim to qualify the clients by setting up a meeting with a sales agent  
- **Analyze Sentiment**  
  - Understand intent  
  - Sense urgency (of the current state)  
  - Timeline of the customer  
  - Based on Lead Status (NEW, OLD, CONTACTED, etc.)  

The node should use a dynamic file (like a spreadsheet) so Converso can fine-tune the prompt, temperature, and tone based on a company ID.  
Based on the conversation, tone, and sentiment, tailor the reply and actions accordingly so the customer is fully satisfied.  

---

## SMS
- **Trigger**: Scheduled  
- Send a welcome SMS (Outbound flow)  
- Based on the incoming message:  
  - Look for conversation history and create Smart Reply using OpenAI APIs  
  - Send the reply and store conversations in the datastore  

---

## Voice / Call
- **Target**: New Lead (immediate to 1 month old max)  
- **Trigger**: Whenever a lead is created  
  - Make an outbound call, play the welcome message, and ask for details (within client’s working hours)  
- Retry rules:  
  - If no answer after 3 attempts → move lead to SMS bucket/flow  
  - Attempts spread over 2 different days/times (configurable)  
- Update **last contacted timestamp** and **contact method** in the datastore  

---

## Calendar Scheduling / Booking  
*(used in both SMS / Call Flow)*  

- **Trigger**: When the user responds to SMS/voice with an intent to book a meeting with a sales agent  
- Use **VAPI** as a platform for call/voice  
- Use **SSO authentication** to sync with the Sales Agent’s calendar to see availability  
- Once authenticated, store the API key/token in the datastore so the workflow can read/write into the calendar  
- Send **email + SMS notification** with the meeting link once booked  
- Update all this information in the datastore, and update the lead status to **CONVERTED**

## Flow
```mermaid
flowchart TD
    A[Bring in leads] --> B[Assign company ID]
    B --> C[Nurture leads Agentic node]
    C --> C1[Read lead info]
    C --> C2[Smart intro or reply]
    C --> C3[Qualify to meeting]
    C --> C4[Analyze sentiment and intent]
    C4 --> C5[Assess urgency and timeline]
    C4 --> C6[Check lead status NEW OLD CONTACTED]

    C --> D{Channel}
    D --> E[SMS flow]
    D --> F[Voice call flow]

    %% SMS Flow
    E --> E1[Trigger scheduled]
    E --> E2[Send welcome SMS]
    E --> E3[Get conversation history]
    E --> E4[Generate smart reply via OpenAI]
    E --> E5[Store conversation to datastore]

    %% Voice Flow
    F --> F1[Trigger new lead 0 to 30 days]
    F --> F2[Outbound call welcome]
    F --> F3{Answered}
    F3 -->|Yes| F4[Ask for details]
    F3 -->|No 3 attempts| E
    F4 --> F5[Update last contacted and method]

    %% Calendar Flow
    E --> G[Calendar scheduling]
    F --> G
    G --> G1[Trigger intent to book]
    G1 --> G2[Use VAPI for voice]
    G2 --> G3[SSO sync calendar]
    G3 --> G4[Store token in datastore]
    G4 --> G5[Send meeting link SMS or email]
    G5 --> G6[Update datastore set status converted]

```

## Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant Customer
    participant Converso as Converso (Agentic Node)
    participant Zoho as Zoho CRM
    participant DataStore as Datastore (Sheet/MongoDB)
    participant OpenAI as OpenAI APIs
    participant SMS as SMS Gateway
    participant VAPI as VAPI (Voice)
    participant Calendar as Calendar (SSO)

    %% Lead ingestion
    Zoho->>Converso: New/Updated Lead (with companyId)
    Converso->>DataStore: Upsert lead + last_contacted=null

    %% Nurture: context + reply planning
    Converso->>Zoho: Fetch lead details + status
    Zoho-->>Converso: Lead profile, history
    Converso->>DataStore: Fetch dynamic params (prompt, temperature, tone by companyId)
    Converso->>OpenAI: Compose intro/Smart Reply (context: profile, history, params)
    OpenAI-->>Converso: Suggested message + intent/sentiment

    %% Channel decision
    Converso->>Converso: Decide channel (SMS vs Voice) based on status, recency, urgency

    alt SMS flow (scheduled or reply)
        Converso->>SMS: Send outbound SMS (welcome / smart reply)
        Customer-->>SMS: Replies
        SMS-->>Converso: Inbound message webhook
        Converso->>OpenAI: Generate Smart Reply (uses history)
        OpenAI-->>Converso: Reply + next action
        Converso->>SMS: Send reply
        Converso->>DataStore: Append conversation, update last_contacted + method
    else Voice/Call flow (new leads 0–30 days)
        Converso->>VAPI: Initiate outbound call (within working hours)
        VAPI->>Customer: Place call + play welcome
        alt answered
            VAPI-->>Converso: Transcript/DTMF details
            Converso->>OpenAI: Summarize intent, sentiment, urgency
            OpenAI-->>Converso: Parsed intent + suggested next step
            Converso->>DataStore: Update last_contacted + method
        else no answer (3 attempts, spread across 2 days/times)
            VAPI-->>Converso: No-answer after retries
            Converso->>Converso: Move lead to SMS bucket
        end
    end

    %% Booking (common to SMS/Voice)
    opt customer shows intent to book
        Converso->>Calendar: SSO auth flow (first time only)
        Calendar-->>Converso: Access token
        Converso->>DataStore: Store token (securely)
        Converso->>Calendar: Query availability (Sales Agent)
        Calendar-->>Converso: Free slots
        Converso->>Customer: Offer slots (SMS or voice via VAPI)
        Customer-->>Converso: Slot selection/confirmation
        Converso->>Calendar: Create event
        Calendar-->>Converso: Meeting link + details
        Converso->>Customer: Send confirmation (SMS + optional email)
        Converso->>DataStore: Write booking details, set status=CONVERTED
    end

```