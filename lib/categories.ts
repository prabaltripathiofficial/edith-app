import {
  Blocks,
  Cable,
  CircuitBoard,
  FlaskConical,
  Gauge,
  Lock,
  Network,
  Rocket,
  ShieldAlert,
  Workflow,
} from "lucide-react";

export type CategorySlug =
  | "architecture"
  | "api-design"
  | "data-modeling"
  | "auth"
  | "cicd"
  | "testing"
  | "observability"
  | "security"
  | "performance"
  | "resilience";

export type Category = {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  icon: typeof Blocks;
};

export const CATEGORIES: readonly Category[] = [
  {
    slug: "architecture",
    name: "Architecture & System Design",
    shortName: "Architecture",
    description:
      "High-level system decomposition, service boundaries, scalability patterns, and infrastructure topology.",
    icon: Network,
  },
  {
    slug: "api-design",
    name: "API Design",
    shortName: "API Design",
    description:
      "Contract-first design, versioning, error handling, pagination, and rate limiting — protocol-agnostic.",
    icon: Cable,
  },
  {
    slug: "data-modeling",
    name: "Data Modeling",
    shortName: "Data Modeling",
    description:
      "Schema design, normalization, migrations, and indexing strategies — database-engine agnostic.",
    icon: Blocks,
  },
  {
    slug: "auth",
    name: "Authentication & Authorization",
    shortName: "Auth & Authz",
    description:
      "Auth flows, RBAC/ABAC, session management, token strategies — framework-agnostic.",
    icon: Lock,
  },
  {
    slug: "cicd",
    name: "CI/CD & Deployment",
    shortName: "CI/CD",
    description:
      "Pipeline design, zero-downtime deploys, rollback strategies, and artifact management — tool-agnostic.",
    icon: Rocket,
  },
  {
    slug: "testing",
    name: "Testing Strategy",
    shortName: "Testing",
    description:
      "Test pyramids, integration testing, E2E strategies, mocking, and coverage — framework-agnostic.",
    icon: FlaskConical,
  },
  {
    slug: "observability",
    name: "Observability & Monitoring",
    shortName: "Observability",
    description:
      "Structured logging, metrics collection, distributed tracing, and alerting — vendor-agnostic.",
    icon: Gauge,
  },
  {
    slug: "security",
    name: "Security & Compliance",
    shortName: "Security",
    description:
      "Threat modeling, input validation, secrets management, and audit trails — universal principles.",
    icon: ShieldAlert,
  },
  {
    slug: "performance",
    name: "Performance Optimization",
    shortName: "Performance",
    description:
      "Caching strategies, query optimization, load handling, and resource management — tech-agnostic.",
    icon: CircuitBoard,
  },
  {
    slug: "resilience",
    name: "Error Handling & Resilience",
    shortName: "Resilience",
    description:
      "Circuit breakers, retry policies, graceful degradation, and failure recovery — universal patterns.",
    icon: Workflow,
  },
] as const;

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORY_MAP.get(slug as CategorySlug);
}

export function isValidCategory(slug: string): slug is CategorySlug {
  return CATEGORY_MAP.has(slug as CategorySlug);
}
