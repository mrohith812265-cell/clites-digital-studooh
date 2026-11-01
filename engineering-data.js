/*
 * Engineering knowledge library.
 *
 * Add or edit concepts here. The page reads this file at runtime, so no build
 * step or database is needed. Keep category IDs in sync with the category list.
 */
window.ENGINEERING_CATEGORIES = [
  { id: "traffic", label: "Traffic & Reliability" },
  { id: "delivery", label: "Delivery & Operations" },
  { id: "messaging", label: "Messaging & Events" },
  { id: "realtime", label: "Real-Time Communication" },
  { id: "data", label: "Data & Storage" },
  { id: "distributed", label: "Distributed Systems" },
  { id: "runtime", label: "Runtime & Performance" }
];

/* Common short forms so a search for "cache" or "queue" still finds the concept. */
window.ENGINEERING_SEARCH_ALIASES = {
  "rate-limiting": ["rate limit"],
  "caching": ["cache"],
  "load-balancing": ["load balancer"],
  "reverse-proxies": ["reverse proxy"],
  "api-gateways": ["api gateway"],
  "service-discovery": ["service registry"],
  "circuit-breakers": ["circuit breaker"],
  "timeouts": ["timeout"],
  "retries": ["retry"],
  "exponential-backoff": ["backoff", "back off"],
  "message-queues": ["message queue", "queue"],
  "pub-sub": ["pubsub", "publish subscribe"],
  "dead-letter-queues": ["dead letter queue", "dlq"],
  "cron-jobs": ["cron", "scheduled job"],
  "websockets": ["websocket", "ws"],
  "long-polling": ["long poll"],
  "server-sent-events": ["sse", "server sent events"],
  "database-indexing": ["index", "database index"],
  "n-plus-one-queries": ["n+1", "n plus one"],
  "read-replicas": ["read replica"],
  "sharding": ["shard"],
  "partitioning": ["partition"],
  "eventual-consistency": ["eventually consistent"],
  "optimistic-locking": ["optimistic lock"],
  "pessimistic-locking": ["pessimistic lock"],
  "distributed-locks": ["distributed lock"],
  "race-conditions": ["race condition"],
  "deadlocks": ["deadlock"],
  "memory-leaks": ["memory leak"]
};

window.ENGINEERING_CONCEPTS = [
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    category: "traffic",
    difficulty: "Beginner",
    summary: "Rate limiting caps how many requests a client can make in a period of time, so one user or script cannot overwhelm a service.",
    why: "It protects availability, keeps costs predictable, and gives every client a fair share of capacity.",
    example: "A login endpoint allows five attempts per minute per IP address, then returns HTTP 429 with a retry time."
  },
  {
    id: "caching",
    name: "Caching",
    category: "traffic",
    difficulty: "Beginner",
    summary: "Caching stores a copy of frequently used data closer to the request so it can be returned faster and with less work.",
    why: "It reduces latency and database load, and can make a site feel instant during traffic spikes.",
    example: "A product page stores its product record in Redis for 60 seconds instead of querying the database on every visit."
  },
  {
    id: "load-balancing",
    name: "Load Balancing",
    category: "traffic",
    difficulty: "Beginner",
    summary: "A load balancer distributes incoming traffic across multiple servers so no single machine has to handle everything.",
    why: "It improves availability and lets a system scale horizontally when traffic grows.",
    example: "A load balancer sends requests to three identical web servers and stops sending traffic to one that fails a health check."
  },
  {
    id: "reverse-proxies",
    name: "Reverse Proxies",
    category: "traffic",
    difficulty: "Beginner",
    summary: "A reverse proxy sits in front of application servers and forwards client requests to them, often adding TLS, compression, caching, or routing.",
    why: "It hides internal services and centralizes cross-cutting concerns such as HTTPS and request limits.",
    example: "Nginx terminates HTTPS, adds security headers, and forwards requests to a Node.js app running on a private port."
  },
  {
    id: "api-gateways",
    name: "API Gateways",
    category: "traffic",
    difficulty: "Intermediate",
    summary: "An API gateway is a single entry point for many backend APIs. It routes requests, authenticates clients, applies quotas, and can transform requests or responses.",
    why: "It keeps client-facing concerns in one place and lets internal services evolve independently.",
    example: "A mobile app calls /orders and /users on one gateway; the gateway routes each path to the correct service and checks the API key."
  },
  {
    id: "ci-cd",
    name: "CI/CD",
    category: "delivery",
    difficulty: "Beginner",
    summary: "CI/CD automates building, testing, and releasing code so changes can move from a commit to production consistently.",
    why: "It catches problems earlier, reduces manual release mistakes, and makes small deployments routine.",
    example: "Every pull request runs tests and a build; merging to main deploys the app after the checks pass."
  },
  {
    id: "docker",
    name: "Docker",
    category: "delivery",
    difficulty: "Beginner",
    summary: "Docker packages an application and its runtime dependencies into a container image that runs consistently across environments.",
    why: "It removes environment differences and gives teams a repeatable unit to build and deploy.",
    example: "A web app, its Node.js version, and its system libraries are baked into one image and run the same way locally and in staging."
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "delivery",
    difficulty: "Intermediate",
    summary: "Kubernetes orchestrates containers across a cluster. It schedules workloads, restarts failed pods, and manages scaling and networking.",
    why: "It gives teams a declarative way to run many services reliably, though it adds operational complexity.",
    example: "A deployment declares three replicas of an API; Kubernetes keeps three running and replaces a pod if it crashes."
  },
  {
    id: "service-discovery",
    name: "Service Discovery",
    category: "traffic",
    difficulty: "Intermediate",
    summary: "Service discovery lets services find each other's network locations without hard-coding hostnames and ports.",
    why: "It supports dynamic environments where instances start, stop, and move frequently.",
    example: "A checkout service asks a registry for the current addresses of the inventory service before making a request."
  },
  {
    id: "circuit-breakers",
    name: "Circuit Breakers",
    category: "traffic",
    difficulty: "Intermediate",
    summary: "A circuit breaker stops calling a failing dependency for a while after repeated errors, then tests whether it has recovered.",
    why: "It prevents one slow or failing service from consuming all of the caller's resources and cascading the outage.",
    example: "After five payment-service timeouts, the checkout service returns a friendly fallback for 30 seconds instead of retrying every request."
  },
  {
    id: "timeouts",
    name: "Timeouts",
    category: "traffic",
    difficulty: "Beginner",
    summary: "A timeout sets a maximum time to wait for an operation before giving up.",
    why: "Without timeouts, a slow dependency can tie up connections and threads indefinitely.",
    example: "An HTTP client waits at most two seconds for a recommendation service, then serves the page without recommendations."
  },
  {
    id: "retries",
    name: "Retries",
    category: "traffic",
    difficulty: "Beginner",
    summary: "A retry repeats a failed operation, usually only when the failure is temporary and the operation is safe to repeat.",
    why: "Brief network blips and transient errors are common; a careful retry can recover without user action.",
    example: "A background job retries a failed email-provider call twice with a short delay, but does not retry a validation error."
  },
  {
    id: "exponential-backoff",
    name: "Exponential Backoff",
    category: "traffic",
    difficulty: "Intermediate",
    summary: "Exponential backoff increases the wait between retries, often with random jitter, so clients do not hammer a recovering service.",
    why: "It reduces retry storms and gives a struggling dependency room to recover.",
    example: "A client waits 1 second, then 2, then 4, with random jitter, before giving up after a few attempts."
  },
  {
    id: "idempotency",
    name: "Idempotency",
    category: "traffic",
    difficulty: "Intermediate",
    summary: "An operation is idempotent when repeating it produces the same result as performing it once.",
    why: "It makes retries and duplicate deliveries safe, especially for payments and other side effects.",
    example: "A payment request includes an idempotency key; a repeated request with the same key returns the original result instead of charging twice."
  },
  {
    id: "message-queues",
    name: "Message Queues",
    category: "messaging",
    difficulty: "Intermediate",
    summary: "A message queue holds work until a consumer is ready to process it, decoupling producers from consumers.",
    why: "It absorbs traffic spikes, enables background processing, and lets components fail or scale independently.",
    example: "A signup API places a send-welcome-email job on a queue; a worker sends it later without slowing the signup response."
  },
  {
    id: "pub-sub",
    name: "Pub/Sub",
    category: "messaging",
    difficulty: "Intermediate",
    summary: "Publish/subscribe delivers an event to multiple interested subscribers through a broker, without the publisher knowing who consumes it.",
    why: "It supports fan-out and loose coupling between services that react to the same event.",
    example: "An order.placed event is published once; the email, analytics, and inventory services each receive their own copy."
  },
  {
    id: "event-driven-architecture",
    name: "Event-Driven Architecture",
    category: "messaging",
    difficulty: "Advanced",
    summary: "Event-driven architecture models a system around events that record what happened, with services reacting asynchronously.",
    why: "It can make systems more decoupled and responsive, but requires careful handling of ordering, duplicates, and observability.",
    example: "When an order is placed, separate consumers update inventory, send a receipt, and notify the warehouse without one central request coordinating every step."
  },
  {
    id: "distributed-transactions",
    name: "Distributed Transactions",
    category: "distributed",
    difficulty: "Advanced",
    summary: "A distributed transaction coordinates a change across multiple services or databases so the whole operation succeeds or fails together.",
    why: "Without coordination, a partial failure can leave data inconsistent across systems.",
    example: "A transfer debits one account and credits another in different databases; both steps must be committed or compensated."
  },
  {
    id: "saga-pattern",
    name: "Saga Pattern",
    category: "distributed",
    difficulty: "Advanced",
    summary: "A saga splits a long business transaction into local steps, each with a compensating action if a later step fails.",
    why: "It avoids holding a single database transaction across services and makes failure recovery explicit.",
    example: "An order saga reserves stock, charges payment, and creates a shipment; if shipment creation fails, it refunds payment and releases stock."
  },
  {
    id: "dead-letter-queues",
    name: "Dead Letter Queues",
    category: "messaging",
    difficulty: "Intermediate",
    summary: "A dead letter queue stores messages that could not be processed after the normal retry policy.",
    why: "It prevents poison messages from blocking a queue and gives operators a place to inspect and replay failures.",
    example: "A malformed order message fails five times and is moved to a DLQ for review instead of being retried forever."
  },
  {
    id: "cron-jobs",
    name: "Cron Jobs",
    category: "delivery",
    difficulty: "Beginner",
    summary: "A cron job runs a task on a fixed schedule, such as every night or every five minutes.",
    why: "It is a simple way to handle recurring maintenance, reports, and cleanup.",
    example: "A nightly job archives old sessions and sends a daily summary email."
  },
  {
    id: "websockets",
    name: "WebSockets",
    category: "realtime",
    difficulty: "Intermediate",
    summary: "A WebSocket keeps a two-way connection open between browser and server so either side can send messages immediately.",
    why: "It is useful for chat, collaborative editing, and live dashboards where polling would be wasteful.",
    example: "A chat app uses a WebSocket to push new messages to open tabs without the browser repeatedly asking for updates."
  },
  {
    id: "long-polling",
    name: "Long Polling",
    category: "realtime",
    difficulty: "Beginner",
    summary: "Long polling holds an HTTP request open until new data is available or a timeout occurs, then the client immediately reconnects.",
    why: "It provides near-real-time updates with ordinary HTTP when WebSockets are unavailable or unnecessary.",
    example: "A notifications client sends a request that waits up to 30 seconds; when a notification arrives, the server responds and the client polls again."
  },
  {
    id: "server-sent-events",
    name: "Server-Sent Events",
    category: "realtime",
    difficulty: "Beginner",
    summary: "Server-Sent Events keep a one-way HTTP connection open so the server can stream text updates to the browser.",
    why: "It is a simple fit for live feeds, progress updates, and notifications that do not need client-to-server messages.",
    example: "A dashboard subscribes to an SSE stream and appends new job-status events as they happen."
  },
  {
    id: "database-indexing",
    name: "Database Indexing",
    category: "data",
    difficulty: "Beginner",
    summary: "An index is a data structure that helps the database find rows without scanning the whole table.",
    why: "The right index can turn a slow query into a fast lookup, while unused indexes add write overhead.",
    example: "An index on orders(customer_id) makes a customer's order history fast as the table grows."
  },
  {
    id: "query-optimization",
    name: "Query Optimization",
    category: "data",
    difficulty: "Intermediate",
    summary: "Query optimization is the work of making a database query do less work: better indexes, fewer rows, and a sensible execution plan.",
    why: "It improves response times and reduces database CPU and I/O.",
    example: "A report that scans every order is rewritten to filter by date and use an index on created_at."
  },
  {
    id: "n-plus-one-queries",
    name: "N+1 Queries",
    category: "data",
    difficulty: "Intermediate",
    summary: "The N+1 problem happens when code loads a list of N records and then runs one extra query for each record.",
    why: "It multiplies database round trips and gets worse as the list grows.",
    example: "Loading 50 posts and then querying the author for each post becomes 51 queries; a join or batched lookup can load the authors in one query."
  },
  {
    id: "connection-pooling",
    name: "Connection Pooling",
    category: "data",
    difficulty: "Intermediate",
    summary: "Connection pooling reuses a limited set of open database connections instead of opening a new connection for every request.",
    why: "Opening connections is expensive, and too many can exhaust the database's connection limit.",
    example: "An app server keeps a pool of 20 connections and queues requests briefly when all are busy."
  },
  {
    id: "read-replicas",
    name: "Read Replicas",
    category: "data",
    difficulty: "Intermediate",
    summary: "A read replica is a copy of a primary database that serves read queries, while the primary handles writes.",
    why: "It can spread read load and keep reads available during some maintenance, but replica data may lag slightly.",
    example: "Product browsing queries go to two read replicas, while checkout writes go to the primary database."
  },
  {
    id: "sharding",
    name: "Sharding",
    category: "data",
    difficulty: "Advanced",
    summary: "Sharding splits data across multiple databases or nodes, usually by a key such as customer ID or region.",
    why: "It allows a dataset or write load to grow beyond one machine's limits, at the cost of routing and cross-shard complexity.",
    example: "Customers are split across four shards by a hash of their tenant ID; each request is routed to the shard that holds that tenant."
  },
  {
    id: "partitioning",
    name: "Partitioning",
    category: "data",
    difficulty: "Intermediate",
    summary: "Partitioning divides one large table into smaller pieces, often by date or range, while the database still presents one logical table.",
    why: "It can make maintenance and queries on recent data faster and let old partitions be archived or dropped efficiently.",
    example: "An events table is partitioned by month; a query for the current month reads only that partition."
  },
  {
    id: "replication",
    name: "Replication",
    category: "data",
    difficulty: "Intermediate",
    summary: "Replication copies data from one database node to another so the system has additional copies for availability or read scaling.",
    why: "It supports failover and read capacity, but introduces lag and consistency questions.",
    example: "A primary database streams changes to a standby that can take over if the primary fails."
  },
  {
    id: "leader-election",
    name: "Leader Election",
    category: "distributed",
    difficulty: "Advanced",
    summary: "Leader election chooses one node to perform a task that must have a single owner, such as coordinating writes or scheduling jobs.",
    why: "It prevents split-brain behavior when multiple instances are running.",
    example: "Three scheduler instances elect one leader; only the leader creates cron runs, and another takes over if it stops."
  },
  {
    id: "cap-theorem",
    name: "CAP Theorem",
    category: "distributed",
    difficulty: "Intermediate",
    summary: "CAP theorem says a distributed system facing a network partition cannot guarantee both perfect consistency and full availability at the same time.",
    why: "It helps teams make explicit trade-offs about what should happen when the network splits.",
    example: "A shopping cart might accept writes during a partition and reconcile later, while a bank balance might reject writes until consistency is restored."
  },
  {
    id: "eventual-consistency",
    name: "Eventual Consistency",
    category: "distributed",
    difficulty: "Intermediate",
    summary: "Eventual consistency means replicas may briefly disagree, but they converge once updates propagate.",
    why: "It enables availability and scale in distributed systems, provided the product can tolerate temporary staleness.",
    example: "A likes count may show 99 on one server and 100 on another for a moment, then settle to the same value."
  },
  {
    id: "optimistic-locking",
    name: "Optimistic Locking",
    category: "distributed",
    difficulty: "Intermediate",
    summary: "Optimistic locking lets concurrent updates proceed, but checks a version number before saving so a stale write is rejected.",
    why: "It avoids holding locks during user think-time and prevents one update from silently overwriting another.",
    example: "An edit form includes version 7; if another user already saved version 8, the update is rejected and the user is asked to reload."
  },
  {
    id: "pessimistic-locking",
    name: "Pessimistic Locking",
    category: "distributed",
    difficulty: "Intermediate",
    summary: "Pessimistic locking reserves a row or resource before changing it, so other transactions must wait.",
    why: "It is useful when conflicts are likely and correctness requires exclusive access.",
    example: "A stock adjustment locks the inventory row until the quantity update commits, preventing two workers from overselling the same item."
  },
  {
    id: "distributed-locks",
    name: "Distributed Locks",
    category: "distributed",
    difficulty: "Advanced",
    summary: "A distributed lock coordinates access to a shared resource across multiple machines, often using a system such as Redis or a database.",
    why: "It helps prevent duplicate work when several instances could run the same task.",
    example: "Before generating a nightly invoice, each worker tries to acquire a lock named invoice-2026-10; only one succeeds."
  },
  {
    id: "race-conditions",
    name: "Race Conditions",
    category: "distributed",
    difficulty: "Intermediate",
    summary: "A race condition occurs when the result depends on the unpredictable timing of concurrent operations.",
    why: "They can cause duplicate records, lost updates, and intermittent bugs that are hard to reproduce.",
    example: "Two requests both read a balance of 100 and each withdraw 100; without coordination, both may succeed and overdraw the account."
  },
  {
    id: "deadlocks",
    name: "Deadlocks",
    category: "distributed",
    difficulty: "Advanced",
    summary: "A deadlock happens when two or more transactions wait forever for locks held by each other.",
    why: "It can stall parts of an application and require detection, retries, or a consistent lock order.",
    example: "Transaction A locks row 1 then waits for row 2, while transaction B locks row 2 then waits for row 1; the database detects the cycle and aborts one."
  },
  {
    id: "memory-leaks",
    name: "Memory Leaks",
    category: "runtime",
    difficulty: "Intermediate",
    summary: "A memory leak happens when a program keeps references to memory it no longer needs, so usage grows over time.",
    why: "It can eventually slow down or crash a long-running service, even if each request looks harmless.",
    example: "A server adds every request to a global array for debugging and never removes old entries; memory grows until the process restarts."
  }
];
