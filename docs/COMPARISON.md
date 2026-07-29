# Toolchain comparison

Reviewed 2026-07-28 against the linked first-party sources. This is a representative category map, not an exhaustive vendor list or product ranking. Deployment options and retention terms vary; buyers should verify current vendor terms.

## Evaluation and testing

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [OpenAI Evals](https://github.com/openai/evals) | Define and run model evaluations | Test samples, model outputs, graders | Operator-selected evaluation environment and artifacts | Evaluation results | Produces evidence; does not define customer authorization | Evaluation-run lifecycle | Results can be exported; authorization verification is outside the project |
| [Promptfoo](https://www.promptfoo.dev/docs/intro/) | Evaluate and red-team prompts, models, RAG systems, and agents | Test cases, target outputs, assertions, and red-team configuration | Local open-source execution or selected enterprise service | Evaluation matrices, scores, and vulnerability reports | Produces evidence and runtime guardrail signals; customer change authority remains external | Evaluation, scan, and monitoring lifecycle | CLI, library, and CI integrations produce portable evidence; no Decision Envelope contract claimed |
| [LangSmith evaluation](https://docs.langchain.com/langsmith/evaluation) | Evaluate application behavior through datasets, runs, and evaluators | Examples, application outputs, evaluator inputs | LangSmith project/dataset records under the selected deployment | Scores, feedback, experiment comparisons | Produces evidence; authorization remains external | Dataset and experiment lifecycle | Export and API interfaces; no Decision Envelope contract claimed |
| [Giskard](https://www.giskard.ai/) | Continuously test and red-team AI agents for security and quality failures | Agent access plus selected tests and evaluation context | Giskard service or open-source testing components, depending on product | Findings, severity-ranked reports, and go/no-go evaluation reports | Produces a security-evaluation verdict; customer authority and portable authorization lifecycle remain separate | Test, finding, and report lifecycle | Test artifacts can serve as evidence; signed subject-bound authorization is complementary |

## Observability

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [Langfuse observability](https://langfuse.com/docs/observability/overview) | Capture and inspect traces, spans, generations, and metrics | Runtime telemetry | Managed or self-hosted project telemetry | Trace and metric records | Observes behavior; authorization remains external | Trace/project retention lifecycle | APIs and exports; external policy decides change authority |
| [Braintrust](https://www.braintrust.dev/docs) | Instrument, observe, evaluate, and improve agents | Traces, datasets, outputs, scorers, and feedback selected by the customer | Braintrust projects and configured data management | Traces, scores, experiments, alerts, and review records | Produces operational and evaluation evidence; customer change authorization remains external | Project, trace, experiment, and retention lifecycle | SDKs, exports, and integrations provide evidence that a Decision Envelope can reference |

## Runtime security

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [Lakera Guard](https://docs.lakera.ai/guard) | Detect and classify runtime prompt and content risks | Runtime request content selected by the caller | Vendor-service handling governed by current service settings and terms | Detection result and category | Runtime allow/block signal; customer change authority remains external | Request and policy lifecycle | API result; portable authorization object is not the documented primary job |
| [Guardrails AI](https://guardrailsai.com/guardrails/docs) | Validate or mitigate LLM inputs and outputs and produce structured output | Application inputs, outputs, validators, and guard configuration | Application-controlled Python or Guardrails Server deployment | Validator outcomes, mitigations, and structured data | Runtime input/output control; release or change authority remains external | Request and guard-configuration lifecycle | Open framework and validator ecosystem; outputs can be referenced as evidence |

## Runtime authorization

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [Cerbos](https://www.cerbos.dev/) | Evaluate application authorization policy | Principal, resource, action, context, and policy | Self-hosted policy decision point or Cerbos Hub | Allow/deny policy decision | Runtime access authorization | Policy, principal, and resource lifecycle | Portable open-source decision point; evidence-bound AI change authorization remains complementary |
| [OpenFGA](https://openfga.dev/docs/fga) | Evaluate relationship-based application authorization | Authorization model, relationship tuples, principal, resource, and context | OpenFGA store or operator-selected deployment | Access check and decision log | Runtime resource authorization, including agent and MCP patterns | Store, model, and relationship lifecycle | Open-source decision service and model tooling; evidence-bound change authorization remains complementary |

## Change enforcement

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) | Enforce branch, tag, push, review, and status-check rules | Repository events, identities, refs, reviews, and check results | GitHub repository or organization configuration | Merge or push enforcement | Repository change authorization | Branch, tag, rule, and bypass lifecycle | Strong native enforcement; the underlying decision record is GitHub-scoped rather than a portable signed envelope |
| [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) | Gate deployment jobs with reviewers, timers, branch restrictions, or custom protection rules | Workflow job, environment, ref, reviewer, and protection-rule state | GitHub environment and deployment records | Deployment proceeds or waits/fails | Environment deployment authorization | Deployment, reviewer, environment, and protection-rule lifecycle | Direct enforcement within GitHub; third-party protection rules can consume Verahelm verification |

## MCP authorization

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) | Define OAuth-based authorization for HTTP MCP transports | Client, resource-server, authorization-server, token, and scope context | Implementer-selected OAuth and MCP state | Access tokens and protocol authorization outcomes | Resource access on behalf of a resource owner | Token, client, and authorization-server lifecycle | Interoperable transport authorization; evidence-bound tool-change admission remains a separate job |
| [Cloudflare Agents MCP authorization](https://developers.cloudflare.com/agents/model-context-protocol/protocol/authorization/) | Add OAuth authorization to remote MCP servers | User identity, OAuth client, scopes, tokens, and MCP requests | Cloudflare application and authorization state | Authorized MCP access | Runtime access to MCP resources and tools | OAuth token and server lifecycle | Standards-based MCP access; a signed change-decision record is complementary |

## Governance and GRC

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [IBM watsonx.governance](https://www.ibm.com/products/watsonx-governance) | Govern AI risk, facts, controls, and workflows | Model, use-case, risk, and governance records | Governance inventory under the chosen IBM deployment | Factsheets, assessments, workflows, reports | Workflow and governance controls inside the platform | Governed asset/use-case lifecycle | Platform reports and integrations; Decision Envelope verification is complementary |

## Policy and provenance

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/) | Evaluate policy over structured input | JSON input, policy, and data | Embedded/server memory plus operator-managed bundles and data | Policy decision | Expresses policy decisions; authority and evidence binding are caller-defined | Policy/bundle lifecycle | Portable policy engine and decision API; signature/lifecycle envelope is complementary |
| [Sigstore](https://docs.sigstore.dev/) | Sign and verify software artifacts and record signing events | Artifact digest and signing identity | Signed artifacts plus transparency-log records | Signature, certificate, inclusion evidence | Establishes artifact provenance; does not decide customer change scope | Certificate/log/artifact lifecycle | Strong portable verification primitives that can serve as referenced evidence |
| [in-toto Attestation](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md) | Bind an immutable subject digest to a typed predicate | Subject digest, predicate type, and producer-defined predicate | Attestation file and selected signing/distribution system | Portable subject-bound statement | Predicate semantics are defined by its producer and consumer | Subject, predicate, and attestation lifecycle | Close structural substitute for the signed-object layer; it does not standardize Verahelm's customer-authority, expiry, revocation, or supersession semantics |
| [SLSA](https://slsa.dev/spec/v1.2/) | Define supply-chain assurance levels and recommended provenance formats | Source, build, artifact, builder, and provenance data | Provenance attestations and verifier-selected policy | Verifiable build provenance and assurance evidence | Build-policy authorization remains consumer-defined | Source, build, artifact, and provenance lifecycle | Standard provenance that a Decision Envelope can reference; not an AI change-decision lifecycle |
| [GitHub artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations) | Generate and verify signed artifact provenance and related claims | Artifact digest and GitHub workflow identity | Sigstore bundle and GitHub attestation records | Signed provenance or software-bill-of-materials claim | Establishes build identity and provenance, not customer change authority | Workflow, artifact, certificate, and attestation lifecycle | GitHub CLI supports verification, including offline bundles; Decision Envelope lifecycle remains complementary |

## Repository scanners

| System | Primary job | Required data | Storage model | Output | Authorization semantics | Lifecycle | Portability and verification |
|---|---|---|---|---|---|---|---|
| [GitHub code scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning) | Find repository vulnerabilities and coding errors | Repository code and analysis configuration | Repository alerts and uploaded analysis results in GitHub | Alerts and SARIF-backed findings | Produces findings; merge/deployment authority is configured separately | Commit, branch, and alert lifecycle | SARIF is portable evidence; signed bounded authorization remains external |
| [Snyk Agent Scan](https://github.com/snyk/agent-scan) | Discover and scan agent, MCP-server, and skill components | Local agent configuration and selected components; some scans can execute configured MCP commands with consent | Local scan plus Snyk service handling documented by the project | Experimental CLI findings and enterprise risk views | Produces security evidence; pull-request change authority remains external | Component and finding lifecycle | Findings can be hashed as evidence; Decision Envelope lifecycle is complementary |

## Public pricing references

Checked against official pages on 2026-07-28. Prices and packaging can change; procurement should recheck the linked source.

| System | Public pricing evidence |
|---|---|
| OpenAI Evals | Open-source project; no hosted authorization product price is defined by the repository. |
| [Promptfoo](https://www.promptfoo.dev/pricing/) | Community tooling is free; the public page lists enterprise and on-premise packaging with custom pricing. |
| [LangSmith](https://www.langchain.com/pricing) | Developer currently starts at $0 per seat per month, then usage-based charges; paid team and enterprise packaging varies. |
| [Langfuse](https://langfuse.com/pricing) | Public self-service tiers currently include Free, $29/month, and $199/month before usage or enterprise terms. |
| [Braintrust](https://www.braintrust.dev/pricing) | Public pricing currently lists a $0 plan and Pro at $249/month before applicable usage charges. |
| [Lakera](https://platform.lakera.ai/pricing) | Public pricing page; applicable plan and usage price must be confirmed there. |
| [Giskard](https://www.giskard.ai/pricing) | Public pricing currently lists Free and Enterprise tiers; enterprise price is not stated publicly. |
| Guardrails AI | Open framework; hosted or enterprise pricing was not stated on the reviewed documentation page. |
| [IBM watsonx.governance](https://www.ibm.com/products/watsonx-governance/pricing) | Configuration-dependent IBM pricing; no single comparable flat authorization-envelope price. |
| Open Policy Agent | Open-source policy engine; hosting and operations are buyer-managed or vendor-specific. |
| [Cerbos](https://www.cerbos.dev/pricing) | Open-source tier is free; Cerbos Hub currently lists $0/month and paid service from $25/month. |
| OpenFGA | Open-source authorization system; hosted-service pricing is provider-specific. |
| Sigstore | Open-source signing and transparency infrastructure; managed-service costs are provider-specific. |
| in-toto Attestation and SLSA | Open specifications and tooling; implementation and hosting costs are operator- or provider-specific. |
| GitHub rulesets, environments, and artifact attestations | Availability and limits depend on repository visibility and the applicable GitHub plan. |
| [GitHub code security](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security) | Public-repository and paid private-repository packaging depends on the GitHub plan and metered products. |
| Snyk Agent Scan | Apache-2.0 CLI; enterprise service pricing is account-specific. |
| MCP authorization specification | Protocol specification; no product price. |
| Cloudflare Agents MCP authorization | Included within Cloudflare's applicable platform and usage pricing rather than sold as a Decision Envelope service. |
| Verahelm | Developer $49/month for 300 units; Professional $149/month for 1,500 units. Hard daily and monthly caps; no automatic overage. |

## Verahelm boundary

Verahelm does not replace these systems or assert that their evidence is correct. It accepts bounded references to customer-selected evidence and binds:

- an exact subject and immutable version;
- customer authority and scope;
- declared conditions;
- issuance and expiry;
- revocation or supersession state;
- a verifiable signature.

The structural distinction is the output contract: a portable Decision Envelope for a bounded authorization decision, rather than another raw-content warehouse. The public verifier demonstrates contract and lifecycle handling only; it reveals no private analysis or scoring implementation.

Verahelm is narrower than the systems above. It does not generate evaluations,
capture traces, inspect runtime content, enforce general application policy, or
replace OAuth. Its public advantage is useful only when a customer needs a
portable signed record binding selected evidence to an exact subject, customer
authority, scope, conditions, and lifecycle.
