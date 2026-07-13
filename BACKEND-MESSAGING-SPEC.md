## Driver Messaging Backend Spec (Grubsy Driver App)

This document describes the backend changes needed to support the new **Messages** feature in the Grubsy Driver App.

The mobile app already has:
- A **conversation list** (per-order + a global **Support** conversation)
- An in-app **chat UI** (message bubbles, quick replies, timestamps)
- **AsyncStorage**-based local persistence
- WebSocket hooks that **emit** and **listen for** `chat_message` events

We now need backend support to make this a real, multi-device messaging system.

---

## 1. WebSocket: `chat_message` Support

### 1.1. Current client behavior

The driver app uses Socket.io (same connection as existing driver events):

- **Subscribes** to:
  - `chat_message` – incoming messages for the driver
- **Emits**:
  - `chat_message` – when the driver sends a message to the customer or support

The WebSocket URL is:
- `EXPO_PUBLIC_WS_URL` (defaults to `wss://www.uk-gds.com`)

### 1.2. Driver → Server payload (already implemented client-side)

When the driver sends a message, the app emits:

```json
{
  "conversationId": "order_GDS-004XV",   // or "support"
  "orderId": "GDS-004XV",                // optional, for order chats
  "to": "customer",                      // or "support"
  "from": "driver",
  "driverId": "<driver-id-from-auth>",
  "text": "I’m on my way 🚗",
  "timestamp": "2026-01-20T12:34:56.000Z",
  "metadata": { /* optional extra context */ }
}
```

> Note: On the client, `driverId` comes from existing auth/AsyncStorage. If you prefer, you can ignore this and derive the driver from the authenticated socket/session.

### 1.3. Server → Driver payload (what the app expects)

When the driver receives a new message (from customer or support), the app expects to receive a `chat_message` event with:

```json
{
  "id": "msg-123",                       // message id from DB
  "conversationId": "order_GDS-004XV",   // or "support"
  "orderId": "GDS-004XV",                // optional for support threads
  "from": "customer",                    // or "support"
  "to": "driver",
  "text": "I’m outside your building",
  "timestamp": "2026-01-20T12:35:10.000Z"
}
```

The client:
- Stores this in AsyncStorage under `chat_conversation_<conversationId>`
- Updates unread counters per conversation
- Shows an in-app/local notification if the conversation is not currently open

### 1.4. Backend behavior for `chat_message`

**When the driver sends a message (`from: 'driver'`):**

1. **Validate**:
   - `driverId` is authenticated and matches the connected socket
   - If `orderId` is present, that the driver is actually assigned to that order
2. **Persist** the message to DB (e.g. `messages` table with at least):
   - `id`, `conversationId`, `orderId` (nullable), `driverId`, `customerId` (nullable), `supportUserId` (nullable), `from`, `to`, `text`, `timestamp`
3. **Route/Broadcast**:
   - For **order chats**:
     - Deliver to the **customer** and any relevant internal tools (e.g. via a customer WS room keyed by `orderId` or `customerId`)
   - For **support chats**:
     - Deliver to your internal **support** tooling or support WebSocket room
   - Also **echo back** to the driver’s room if needed (for consistency) using the server-shaped payload above (with `id` from DB).

**When a customer/support message is created on the server:**

1. Construct the payload in the **Server → Driver** format shown above.
2. Emit `chat_message` to the driver’s room (whatever you already use for driver-specific events).
3. (Optional but recommended) Trigger an FCM **push notification** for the driver (see Section 3).

---

## 2. REST Endpoints for Message History (Recommended)

The app currently persists messages locally using AsyncStorage. To support:
- App re-installs
- Device changes
- Cross-device consistency

we recommend **server-side history** and a way for the app to re-hydrate conversations.

### 2.1. GET `/api/driver/messages`

**Purpose:** Fetch historical messages for a driver.

**Query params:**
- `orderId` *(optional)* – fetch messages for that specific order conversation
- `conversationId` *(optional)* – e.g. `support` or `order_<orderId>`
- Pagination params can be added as needed: `limit`, `before`, `after`, etc.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-1",
      "conversationId": "order_GDS-004XV",
      "orderId": "GDS-004XV",
      "from": "driver",
      "to": "customer",
      "text": "I’m on my way 🚗",
      "timestamp": "2026-01-20T12:30:00.000Z"
    },
    {
      "id": "msg-2",
      "conversationId": "order_GDS-004XV",
      "orderId": "GDS-004XV",
      "from": "customer",
      "to": "driver",
      "text": "Great, thanks!",
      "timestamp": "2026-01-20T12:31:00.000Z"
    }
  ]
}
```

> The shape should match the WebSocket `chat_message` payload so the mobile client can treat WS and REST messages identically.

### 2.2. POST `/api/driver/messages` (Optional)

**Purpose:** HTTP-based alternative to the WS `chat_message` emit (useful for logging, retries, or if WS is unavailable).

**Request body:** Same as the **Driver → Server** WS payload:

```json
{
  "conversationId": "order_GDS-004XV",
  "orderId": "GDS-004XV",
  "to": "customer",
  "text": "I’m on my way 🚗"
}
```

Server behavior:
- Authenticate the driver from the HTTP request
- Apply the **same logic** as for the WS handler:
  - validate, persist, broadcast `chat_message` over WS

---

## 3. Push Notifications for New Chat Messages

The driver app already registers an FCM token via `notificationService.registerPushToken(driverId)`. We recommend:

Whenever a new message is stored where **`to === 'driver'`**:

1. Look up the driver’s current **push token(s)**.
2. Send an FCM notification with:
   - `title`: e.g. `"New customer message"` or `"New support message"`
   - `body`: first 50–80 chars of `text`
   - `data` payload including:

```json
{
  "type": "order_update",
  "orderId": "GDS-004XV",
  "conversationId": "order_GDS-004XV"
}
```

3. Optionally log this notification (status, timestamp, etc.) – the app already assumes some logging in its notification service.

---

## 4. Conversation ID & Routing Conventions

The mobile app currently uses these conventions:

- **Order conversations**:
  - `conversationId = "order_" + order.id`
  - `orderId = order.id`
- **Support conversation**:
  - `conversationId = "support"`
  - `orderId = null` (or omitted)

Feel free to change these patterns on the backend if you prefer a different format, but if you do, we should align the mobile app accordingly.

---

## 5. Summary of Required Work

1. **WebSocket**
   - Implement `chat_message` event handler for driver messages (validate, persist, broadcast).
   - Emit `chat_message` events to drivers for customer/support-originated messages.

2. **Persistence**
   - Add a `messages` (or equivalent) table/collection to store chat history.

3. **REST**
   - `GET /api/driver/messages` to fetch driver chat history.
   - (Optional) `POST /api/driver/messages` as HTTP alternative to WS.

4. **Push notifications**
   - Fire FCM notifications when new messages are addressed to the driver.

Once these pieces are in place, the existing mobile Messages UI will work as a full real-time chat between **driver ↔ customer ↔ support**, with history and notifications. 

