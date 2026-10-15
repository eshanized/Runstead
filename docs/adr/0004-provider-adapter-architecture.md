# ADR-0004: Driver-Based Provider Adapter Architecture

> **Status**: Accepted  
> **Date**: October 2026  
> **Deciders**: Tonmoy Infrastructure Engineering Core  
> **Technical Scope**: External APIs, cPanel/WHM, Plesk, Registrars, Payment Gateways

---

## Context

A primary failure mode of legacy hosting billing platforms (like WHMCS) is tight coupling between core billing workflows and upstream hosting provider modules. When a provider updates its API, changes authentication schemes, or returns idiosyncratic error codes, the core application frequently crashes or corrupts invoice/order states.

Runstead must support multiple hosting control panels (cPanel/WHM, Plesk, DirectAdmin), multiple domain registrars (ResellerClub, Enom, Namecheap), and multiple payment gateways without coupling business rules to provider idiosyncrasies.

---

## Decision

We decide to adopt a **Strict Driver Adapter Pattern with Normalized Payloads**:

1. **Normalized Domain Types**: Core business logic interacts exclusively with normalized domain types (`ProvisionedService`, `RegisteredDomain`, `PaymentTransaction`, `DNSZone`).
2. **Provider Driver Interfaces**: Every external integration implements a standardized TypeScript interface (`HostingProviderDriver`, `DomainRegistrarDriver`, `PaymentGatewayDriver`).
3. **Encapsulated Error Normalization**: Drivers must intercept proprietary HTTP/XML errors and map them to standard enum errors (`AUTHENTICATION_FAILED`, `QUOTA_EXCEEDED`, `SERVICE_NOT_FOUND`, `NETWORK_TIMEOUT`, `RATE_LIMITED`).
4. **Idempotent Dispatch**: All driver mutating methods mandate an `idempotencyKey` parameter.

---

## Alternatives Considered

- **Direct In-Line API Calls in Route Handlers**:
  - *Pros*: Faster initial prototyping.
  - *Cons*: Nightmare maintainability; tight coupling; untestable without live provider sandbox credentials.
- **Microservices for Each Provider**:
  - *Pros*: Independent deployment.
  - *Cons*: Excessive operational complexity, network latency, and infrastructure overhead for the current phase.

---

## Consequences

- **Positive**:
  - New providers can be added simply by implementing the driver interface.
  - Unit tests can mock drivers cleanly with 100% deterministic test coverage.
  - Failures in upstream APIs are captured predictably and presented gracefully to users.
