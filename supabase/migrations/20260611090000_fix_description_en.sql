-- Migration: populate description_en with proper English translations
-- Purpose: Fix description_en which was incorrectly set to the Polish description
-- Affected tables: system_templates
-- Notes: Roleplay templates (400-449) already have English — not touched here

-- ── Coding templates (order_index 100–149) ─────────────────────────────────

update system_templates set description_en = case order_index
  when 100 then 'Designs TypeScript interfaces, types, and Zod schemas from plain-English data descriptions.'
  when 101 then 'Creates reusable React hooks encapsulating state logic, side effects, and async operations.'
  when 102 then 'Analyzes and rewrites slow SQL queries with indexes, query plans, and performance explanations.'
  when 103 then 'Writes Python scripts to automate repetitive tasks — file processing, APIs, data pipelines.'
  when 104 then 'Designs Docker Compose configurations for multi-service applications with networking and volumes.'
  when 105 then 'Creates complete GitHub Actions CI/CD pipelines with tests, builds, and deployment stages.'
  when 106 then 'Generates comprehensive unit test suites with edge cases, mocks, and coverage for any function.'
  when 107 then 'Designs GraphQL schemas with queries, mutations, subscriptions, and resolver patterns.'
  when 108 then 'Designs REST API endpoints following best practices for naming, status codes, and payloads.'
  when 109 then 'Creates database schemas with relationships, indexes, constraints, and RLS policies.'
  when 110 then 'Audits code for OWASP top-10 vulnerabilities, injection flaws, and security misconfigurations.'
  when 111 then 'Generates and explains regex patterns for any validation or extraction use case.'
  when 112 then 'Documents architectural decisions in structured ADR format with context, options, and rationale.'
  when 113 then 'Refactors code to improve readability, performance, and maintainability without breaking behavior.'
  when 114 then 'Creates step-by-step guides for integrating third-party APIs with code examples and error handling.'
  when 115 then 'Implements WebSocket servers with rooms, authentication, reconnection, and event handling.'
  when 116 then 'Designs microservices architecture with service boundaries, communication patterns, and deployment.'
  when 117 then 'Writes complete OpenAPI/Swagger specifications for REST APIs with all schemas and examples.'
  when 118 then 'Guides performance profiling — identifies bottlenecks and provides optimization strategies.'
  when 119 then 'Creates reusable Terraform modules with variables, outputs, and cloud-provider best practices.'
  when 120 then 'Designs error handling strategies with typed errors, retry logic, and user-friendly messages.'
  when 121 then 'Implements JWT authentication with token generation, validation, refresh flow, and security.'
  when 122 then 'Builds command-line tools with argument parsing, help text, and shell-friendly output.'
  when 123 then 'Designs Redis caching strategies with key naming, TTLs, invalidation, and cache warming.'
  when 124 then 'Sets up React component libraries with Storybook, design tokens, and accessibility standards.'
  when 125 then 'Writes safe database migration scripts with rollback strategies and data transformation logic.'
  when 126 then 'Audits web applications for WCAG 2.1 AA accessibility issues with specific remediation steps.'
  when 127 then 'Creates load testing scripts with virtual users, ramp-up patterns, and performance thresholds.'
  when 128 then 'Generates Nginx configurations for reverse proxies, SSL termination, and performance tuning.'
  when 129 then 'Designs state machines with states, transitions, guards, and actions for complex business flows.'
  when 130 then 'Builds Python FastAPI services with Pydantic models, dependency injection, and async routes.'
  when 131 then 'Creates Go REST services with idiomatic error handling, middleware, and structured logging.'
  when 132 then 'Designs React Server Components with streaming, caching, and client/server data boundaries.'
  when 133 then 'Creates Vue 3 composables encapsulating reactive state, lifecycle hooks, and async logic.'
  when 134 then 'Designs Kubernetes deployments with pods, services, ingress, health checks, and scaling.'
  when 135 then 'Designs event-driven architectures with event buses, consumers, idempotency, and dead letters.'
  when 136 then 'Develops Swift iOS features with SwiftUI, Combine, async/await, and iOS design patterns.'
  when 137 then 'Builds Kotlin Android features with Jetpack Compose, ViewModel, and Coroutines.'
  when 138 then 'Builds Chrome extensions with Manifest V3, background service workers, and content scripts.'
  when 139 then 'Creates Next.js App Router pages with layouts, server actions, loading states, and caching.'
  when 140 then 'Integrates OAuth 2.0 / OpenID Connect providers with PKCE, token storage, and refresh logic.'
  when 141 then 'Creates Svelte components with reactive stores, transitions, and TypeScript integration.'
  when 142 then 'Builds Rust CLI applications with clap, error handling, and cross-platform compatibility.'
  when 143 then 'Creates Angular services with Dependency Injection, RxJS, and reactive state management.'
  when 144 then 'Designs Prisma ORM schemas with relations, migrations, seed data, and query optimization.'
  when 145 then 'Designs type-safe tRPC APIs with routers, procedures, middleware, and React Query integration.'
  when 146 then 'Builds web scrapers with anti-detection, pagination, data extraction, and storage pipelines.'
  when 147 then 'Sets up monorepos with workspaces, shared packages, build caching, and CI/CD integration.'
  when 148 then 'Implements webhook handlers with signature verification, retries, and idempotent processing.'
  when 149 then 'Implements background job processors with queues, retry policies, concurrency, and monitoring.'
  else description_en
end
where order_index between 100 and 149;

-- ── Writing templates (order_index 200–249) ─────────────────────────────────

update system_templates set description_en = case order_index
  when 200 then 'Writes SEO-optimized blog posts with H-tags, keyword strategy, meta descriptions, and CTAs.'
  when 201 then 'Creates engaging email newsletters with high click-through rates and audience segmentation.'
  when 202 then 'Writes LinkedIn articles that build authority, drive engagement, and grow your professional network.'
  when 203 then 'Writes product descriptions that sell through emotional triggers, benefits, and social proof.'
  when 204 then 'Writes professional press releases following AP Style with a strong news hook and quotes.'
  when 205 then 'Creates authoritative technical white papers for B2B decision-makers with data and frameworks.'
  when 206 then 'Creates compelling case studies that showcase measurable results and customer ROI.'
  when 207 then 'Writes high-converting landing page copy with headlines, benefits, objection handling, and CTAs.'
  when 208 then 'Writes YouTube scripts optimized for watch time, retention, and monetization.'
  when 209 then 'Creates cold B2B email sequences with high reply rates using personalization and value laddering.'
  when 210 then 'Writes personalized cover letters tailored to the job description and company culture.'
  when 211 then 'Writes concise executive summaries distilling key insights for time-pressed decision-makers.'
  when 212 then 'Creates compelling job descriptions that attract top candidates and reflect company culture.'
  when 213 then 'Writes sales email sequences that move prospects through the funnel from awareness to decision.'
  when 214 then 'Crafts investor pitch narratives covering the hook, market, solution, traction, and ask.'
  when 215 then 'Writes an authentic brand story using the StoryBrand framework with 3 platform variations.'
  when 216 then 'Writes viral Twitter/X threads with a strong hook, numbered insights, and a memorable close.'
  when 217 then 'Creates clear technical documentation — READMEs, API docs, and user guides — for developers.'
  when 218 then 'Creates balanced performance review templates for self-assessment and manager evaluation.'
  when 219 then 'Writes compelling grant proposals aligned with funder priorities and measurable outcomes.'
  when 220 then 'Creates onboarding email sequences that activate new users and reduce early churn.'
  when 221 then 'Generates comprehensive FAQ sections that address objections and reduce support load.'
  when 222 then 'Writes App Store and Google Play descriptions optimized for ASO and conversion.'
  when 223 then 'Writes podcast episode scripts with a strong intro, tight interview flow, and memorable close.'
  when 224 then 'Creates content calendars with topic clusters, publication schedules, and format variety.'
  when 225 then 'Writes an authentic About page that conveys your story, values, and personality.'
  when 226 then 'Writes webinar descriptions and promotional copy that drive registrations and attendance.'
  when 227 then 'Writes thought leadership articles that establish expertise and generate industry discussion.'
  when 228 then 'Writes product launch announcements for email, press, and social with maximum impact.'
  when 229 then 'Writes customer success stories that showcase transformation and build trust with prospects.'
  when 230 then 'Writes compelling partnership proposals that articulate mutual value and clear next steps.'
  when 231 then 'Writes clear, structured user manuals that guide non-technical users through your product.'
  when 232 then 'Writes release notes for any update size — from hotfixes to major features — in developer-friendly format.'
  when 233 then 'Guides students through scholarship essay writing with structure, hook, and differentiation strategy.'
  when 234 then 'Creates accessible annual report summaries that translate financials into strategic narrative.'
  when 235 then 'Creates structured meeting agendas with time blocks, owners, and pre-read materials.'
  when 236 then 'Writes project proposals with objectives, scope, timeline, budget, and success metrics.'
  when 237 then 'Creates welcome email sequences that engage new subscribers and convert them into customers.'
  when 238 then 'Writes testimonial and review request emails that maximize response rates authentically.'
  when 239 then 'Writes pricing page copy that frames value, handles objections, and guides the buying decision.'
  when 240 then 'Defines authentic company mission, vision, and values that resonate with team and customers.'
  when 241 then 'Writes social media bios that are memorable, keyword-rich, and call visitors to action.'
  when 242 then 'Writes employee handbook sections that are clear, inclusive, and legally sound.'
  when 243 then 'Writes book proposals for literary agents and publishers with market analysis and sample chapter.'
  when 244 then 'Writes clear, fair refund and return policies that reduce disputes and build customer trust.'
  when 245 then 'Writes thought leadership newsletters that grow a loyal audience of engaged professionals.'
  when 246 then 'Creates technical interview prep guides with coding patterns, system design, and behavioral answers.'
  when 247 then 'Writes freelance proposals that win clients by addressing their pain points and demonstrating fit.'
  when 248 then 'Creates social proof collection systems — review requests, case study workflows, and testimonial templates.'
  when 249 then 'Writes professional resignation letters that preserve relationships and maintain your reputation.'
  else description_en
end
where order_index between 200 and 249;

-- ── Analysis templates (order_index 300–349) ────────────────────────────────

update system_templates set description_en = case order_index
  when 300 then 'Analyzes business data and surfaces actionable insights with visualizations and recommendations.'
  when 301 then 'Creates structured market research reports with segments, sizing, trends, and opportunities.'
  when 302 then 'Builds a competitive analysis matrix with positioning, pricing strategy, and gap identification.'
  when 303 then 'Generates a comprehensive SWOT analysis with prioritized strategic implications and action items.'
  when 304 then 'Analyzes financial statements — P&L, balance sheet, cash flow — with ratio analysis and insights.'
  when 305 then 'Analyzes customer churn patterns, identifies root causes, and recommends retention strategies.'
  when 306 then 'Interprets A/B test results with statistical significance, effect size, and clear recommendations.'
  when 307 then 'Synthesizes user survey data into insights, persona refinements, and product recommendations.'
  when 308 then 'Creates SEO performance reports with traffic analysis, keyword opportunities, and technical fixes.'
  when 309 then 'Audits sales funnels stage-by-stage, identifying drop-off points and conversion improvements.'
  when 310 then 'Builds a risk assessment matrix with likelihood, impact scoring, and mitigation strategies.'
  when 311 then 'Designs KPI frameworks aligned with company strategy, with targets and tracking cadence.'
  when 312 then 'Analyzes customer sentiment from reviews and feedback to surface themes and action items.'
  when 313 then 'Assesses product-market fit using quantitative signals and qualitative customer evidence.'
  when 314 then 'Analyzes social media performance with engagement benchmarks and content strategy insights.'
  when 315 then 'Analyzes pricing strategy against market, willingness to pay, and competitive positioning.'
  when 316 then 'Segments customers by behavior, value, and needs to inform targeting and product decisions.'
  when 317 then 'Calculates and analyzes ROI for initiatives with sensitivity analysis and break-even timelines.'
  when 318 then 'Assesses technical debt with impact scoring, refactoring priority, and effort estimation.'
  when 319 then 'Analyzes NPS data by segment, identifies drivers, and creates a structured improvement roadmap.'
  when 320 then 'Creates a startup metrics dashboard covering acquisition, activation, retention, revenue, and referral.'
  when 321 then 'Audits business processes for inefficiency, waste, and automation opportunities.'
  when 322 then 'Analyzes content performance across channels with distribution insights and optimization tactics.'
  when 323 then 'Analyzes e-commerce funnels from traffic to checkout with cart abandonment fixes and CRO tactics.'
  when 324 then 'Analyzes employee engagement survey data and builds a prioritized action plan.'
  when 325 then 'Audits ad campaigns across channels and optimizes budget allocation by ROAS and CPA.'
  when 326 then 'Deep-dives into SaaS metrics — MRR, churn, LTV, CAC payback — with growth levers.'
  when 327 then 'Analyzes user journeys from acquisition to retention, mapping friction points and drop-offs.'
  when 328 then 'Performs break-even analysis for new products or initiatives with scenario modeling.'
  when 329 then 'Analyzes cohort retention curves, identifies inflection points, and recommends retention tactics.'
  when 330 then 'Creates a vendor evaluation matrix with weighted criteria, scoring, and recommendation.'
  when 331 then 'Identifies gaps between current state and desired state with a prioritized improvement roadmap.'
  when 332 then 'Measures brand health across media and social — sentiment, share of voice, and perception trends.'
  when 333 then 'Analyzes subscription business metrics — MRR, expansion revenue, churn rate, and payback period.'
  when 334 then 'Estimates market size using top-down, bottom-up, and value-theory approaches.'
  when 335 then 'Builds a customer lifetime value model with segmentation, predictive CLV, and strategic implications.'
  when 336 then 'Analyzes recruiting funnels by source and stage, identifying drop-off and improving conversion.'
  when 337 then 'Creates a due diligence checklist for M&A, investment, or vendor evaluation with risk flags.'
  when 338 then 'Prioritizes product features using RICE, ICE, or Kano frameworks with stakeholder alignment.'
  when 339 then 'Performs cost-benefit analysis with NPV, payback period, and risk-adjusted scenarios.'
  when 340 then 'Analyzes API performance with latency percentiles, error rates, and optimization recommendations.'
  when 341 then 'Analyzes supply chain efficiency, risks, cost drivers, and resilience improvement opportunities.'
  when 342 then 'Analyzes web traffic data with acquisition channels, user behavior, and conversion insights.'
  when 343 then 'Maps stakeholders by influence and interest, with engagement strategies for each quadrant.'
  when 344 then 'Identifies emerging trends from data signals and builds a forward-looking strategic forecast.'
  when 345 then 'Analyzes budget variances, identifies root causes, and recommends corrective actions.'
  when 346 then 'Audits security posture with threat modeling, vulnerability scoring, and remediation roadmap.'
  when 347 then 'Analyzes HR metrics — headcount, turnover, performance, and diversity — with strategic insights.'
  when 348 then 'Analyzes growth experiments with statistical rigor, learnings synthesis, and next-step recommendations.'
  when 349 then 'Analyzes conversion rates across funnel stages with hypothesis-driven optimization recommendations.'
  else description_en
end
where order_index between 300 and 349;

-- ── Original templates (order_index < 100) ──────────────────────────────────
-- These share non-unique order_index values so we match by title + description prefix

update system_templates set description_en = 'Writes engaging, SEO-optimized blog posts with a concrete structure and strong CTAs.'
where title = 'Blog Post Writer' and description like 'Angażujące posty%';

update system_templates set description_en = 'Creates engaging blog posts tailored to your target audience and brand tone.'
where title = 'Blog Post Writer' and description like 'Tworzy angażujące%';

update system_templates set description_en = 'Deep data analysis with interpretation, pattern detection, anomalies, and actionable recommendations.'
where title = 'Data Analyst' and description like 'Głęboka analiza%';

update system_templates set description_en = 'Analyzes data, detects patterns, and delivers actionable insights.'
where title = 'Data Analyst' and description like 'Analizuje dane%';

update system_templates set description_en = 'Teaches through Socratic questioning — leads to self-discovery without giving direct answers.'
where title = 'Socratic Teacher';

update system_templates set description_en = 'Comprehensive code review with quality, security, and performance feedback. Generates a checklist.'
where title = 'Code Reviewer Pro';

update system_templates set description_en = 'Full code review with actionable suggestions on quality, security, and performance.'
where title = 'Code Review Assistant';

update system_templates set description_en = 'Simulates a job interview and provides detailed, structured feedback on every answer.'
where title = 'Interview Coach';

update system_templates set description_en = 'Teaches through Socratic questioning without giving direct answers.'
where title = 'Socratic Tutor';

update system_templates set description_en = 'Clear explanation of complex code — what it does, how it works, and why it was written that way.'
where title = 'Code Explainer';

update system_templates set description_en = 'Writes high-open-rate marketing email sequences with segmentation and conversion optimization.'
where title = 'Email Campaign Composer';

update system_templates set description_en = 'Detects bugs, explains their root causes, and proposes targeted fixes.'
where title = 'Bug Hunter & Fix';

update system_templates set description_en = 'Generates comprehensive unit tests with edge cases and clear test descriptions.'
where title = 'Test Generator';

update system_templates set description_en = 'Professional business emails with the right tone — from follow-ups to difficult conversations.'
where title = 'Email Composer';

update system_templates set description_en = 'Conducts detailed competitive analysis for a product or company.'
where title = 'Competitive Analysis Framework' and description like 'Przeprowadza szczegółową%';

update system_templates set description_en = 'Builds a comprehensive competitor analysis with positioning matrix and strategic implications.'
where title = 'Competitive Analysis Framework' and description like 'Tworzy kompleksową%';

update system_templates set description_en = 'Ruthless critique of your idea — identifies weak points before the market does.'
where title = 'Devil''s Advocate' and order_index < 100;

update system_templates set description_en = 'Generates professional technical documentation for code, APIs, and libraries.'
where title = 'Technical Documentation Generator';

update system_templates set description_en = 'Simulates an expert interview in any field — deep Q&A that uncovers the insights behind the insights.'
where title = 'Expert Interviewer';

update system_templates set description_en = 'Evaluates system architecture with trade-off analysis, scalability assessment, and recommendations.'
where title = 'Architecture Reviewer';

update system_templates set description_en = 'Smart code refactoring that preserves behavior while improving readability and adhering to standards.'
where title = 'Refactoring Assistant';

update system_templates set description_en = 'Simulates an investor panel firing tough questions at your startup pitch.'
where title = 'Startup Pitch Simulator';

update system_templates set description_en = 'Designs RESTful or GraphQL APIs following industry best practices.'
where title = 'API Design Consultant' and description like 'Projektuje RESTful%';

update system_templates set description_en = 'Designs RESTful/GraphQL APIs with versioning, documentation, and security best practices.'
where title = 'API Design Consultant' and description like 'Projektowanie%';

update system_templates set description_en = 'Synthesizes multiple research sources into a coherent report with clear conclusions.'
where title = 'Research Synthesis Engine';

update system_templates set description_en = 'Clear technical documentation — READMEs, API docs, user guides — built from diagrams and specs.'
where title = 'Technical Documentation Writer' and order_index < 100;

update system_templates set description_en = 'Structured market analysis with segments, competition, and opportunities for startups and SMBs.'
where title = 'Market Research Analyst';

update system_templates set description_en = 'Simulates a job interview with feedback on technical, behavioral, and system design questions.'
where title = 'Job Interview Coach';

update system_templates set description_en = 'Professional pull request description with context, changes, and a review checklist.'
where title = 'PR Description Writer';

update system_templates set description_en = 'Engaging LinkedIn posts with a hook, value delivery, and CTA to spark discussion and grow reach.'
where title = 'LinkedIn Post Crafter';

update system_templates set description_en = 'Simulates a pitch to a demanding VC investor with sharp feedback and pointed follow-up questions.'
where title = 'Startup Pitch Coach';

update system_templates set description_en = 'Systematic debugging with root cause analysis, hypotheses, and a step-by-step fix plan.'
where title = 'Debug Detective';

update system_templates set description_en = 'Personalized cold outreach messages with high open and reply rates for sales and partnerships.'
where title = 'Cold Outreach Specialist';

update system_templates set description_en = 'Structured decision framework with option analysis, risk scoring, and implementation roadmap.'
where title = 'Decision Framework';

update system_templates set description_en = 'Writes professional changelog entries for any release size — from hotfix to major feature.'
where title = 'Product Changelog Writer';

update system_templates set description_en = 'Simulates a negotiation with an AI counterpart — salary, B2B contracts, purchases, partnerships.'
where title = 'Negotiation Simulator';

update system_templates set description_en = 'Analyzes a competitor with positioning, pricing strategy, and market gap identification.'
where title = 'Competitive Intelligence';
