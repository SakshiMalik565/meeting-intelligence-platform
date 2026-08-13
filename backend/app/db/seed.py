"""Seed script — populates the database with realistic demo data.

This script is **idempotent**: it checks whether any User already exists and
exits early if so.  Tables are created via ``Base.metadata.create_all`` when
they do not yet exist.

Run from the ``backend/`` directory:

    python -m app.db.seed
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from app.db.base import Base, SessionLocal, engine
from app.models import (
    ActionItem,
    KeyTopic,
    Meeting,
    Participant,
    Summary,
    TranscriptSegment,
    User,
)

# ────────────────────────────────────────────────────────────────────
# Constants
# ────────────────────────────────────────────────────────────────────

DEFAULT_USER_ID: str = "550e8400-e29b-41d4-a716-446655440000"
MEDIA_URL: str = (
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
)
AVATAR_URL: str = "https://api.dicebear.com/7.x/avataaars/svg?seed=sakshi"

# Reference date: "today" minus a small offset so the newest meeting is
# still within the last 30 days.
_NOW: datetime = datetime.utcnow()

# ────────────────────────────────────────────────────────────────────
# Participant pool (12 realistic names + emails)
# ────────────────────────────────────────────────────────────────────

PARTICIPANT_POOL: list[dict[str, str]] = [
    {"name": "Alex Chen", "email": "alex.chen@meetingintel.com"},
    {"name": "Jordan Rivera", "email": "jordan.rivera@meetingintel.com"},
    {"name": "Priya Patel", "email": "priya.patel@meetingintel.com"},
    {"name": "Marcus Williams", "email": "marcus.williams@meetingintel.com"},
    {"name": "Sarah Kim", "email": "sarah.kim@meetingintel.com"},
    {"name": "David Thompson", "email": "david.thompson@meetingintel.com"},
    {"name": "Emma Rodriguez", "email": "emma.rodriguez@meetingintel.com"},
    {"name": "James Wilson", "email": "james.wilson@meetingintel.com"},
    {"name": "Lisa Park", "email": "lisa.park@meetingintel.com"},
    {"name": "Michael Brown", "email": "michael.brown@meetingintel.com"},
    {"name": "Rachel Green", "email": "rachel.green@meetingintel.com"},
    {"name": "Tom Anderson", "email": "tom.anderson@meetingintel.com"},
]

# ────────────────────────────────────────────────────────────────────
# Meeting definitions (8 meetings)
# ────────────────────────────────────────────────────────────────────
# Each entry describes one meeting and all of its child data.
# `participant_indices` references PARTICIPANT_POOL by index.
# `days_ago` controls the meeting date (relative to _NOW).
# ────────────────────────────────────────────────────────────────────

MEETINGS_DATA: list[dict] = [
    # ── Meeting 0: Q3 Product Roadmap Review ──────────────────────
    {
        "title": "Q3 Product Roadmap Review",
        "days_ago": 2,
        "duration_seconds": 3000,
        "participant_indices": [0, 2, 4, 6, 8],
        "summary": (
            "The team reviewed the Q3 product roadmap and prioritized features "
            "based on customer feedback and engineering capacity. Key decisions "
            "were made around the AI summarization engine, the new dashboard "
            "redesign, and API v2 rollout timeline."
        ),
        "key_topics": [
            "AI summarization engine improvements",
            "Dashboard redesign progress",
            "API v2 release timeline",
            "Customer feedback triage",
            "Resource allocation for Q3",
        ],
        "action_items": [
            {"text": "Draft updated roadmap slide deck for board review", "assignee": "Alex Chen", "done": True},
            {"text": "Schedule user-testing sessions for the new dashboard", "assignee": "Sarah Kim", "done": False},
            {"text": "Write API v2 migration guide for enterprise clients", "assignee": "Priya Patel", "done": False},
            {"text": "Set up weekly roadmap sync with design team", "assignee": None, "done": False},
        ],
        "transcript": [
            ("Sakshi Malik", "Alright everyone, thanks for joining. Let's kick off the Q3 roadmap review. Alex, do you want to start with the current status?"),
            ("Alex Chen", "Sure. So we shipped the real-time transcription pipeline last sprint, which was the biggest deliverable for Q2. We're now at about 94% accuracy on English transcripts."),
            ("Priya Patel", "That's great. Are we still planning to add multi-language support in Q3?"),
            ("Alex Chen", "It's on the backlog, but honestly I think we should deprioritize it. The AI summarization engine needs a lot more work and that's what customers are asking for."),
            ("Sarah Kim", "I agree. I've been looking at the customer feedback data and summarization quality is the number one complaint. People love the transcription but the summaries feel generic."),
            ("Sakshi Malik", "Okay, so let's tentatively move multi-language to Q4 and focus Q3 on summarization improvements. Emma, how's the dashboard redesign going?"),
            ("Emma Rodriguez", "We've finished the wireframes and the component library is about 70% done. I think we can start user-testing by mid-July."),
            ("Lisa Park", "I can help coordinate the user-testing sessions. How many participants are we targeting?"),
            ("Emma Rodriguez", "Ideally 8 to 12 users across different company sizes. We want to make sure the new layout works for both small teams and enterprise accounts."),
            ("Sarah Kim", "I have a list of about 20 customers who volunteered for beta testing. I'll share it after the meeting."),
            ("Sakshi Malik", "Perfect. Now let's talk about the API v2 rollout. Priya, where are we on that?"),
            ("Priya Patel", "The core endpoints are done. We're working on rate limiting and the webhook system. I'd say we're about three weeks from a beta release."),
            ("Alex Chen", "Are we keeping backward compatibility with v1?"),
            ("Priya Patel", "Yes, v1 will stay active for at least six months. But we need to write a migration guide for enterprise clients so they can start planning."),
            ("Sakshi Malik", "Good. Priya, can you own the migration guide? And Alex, let's sync on the summarization engine improvements separately this week."),
            ("Alex Chen", "Sounds good. I'll set up a deep-dive session for Thursday."),
            ("Emma Rodriguez", "One more thing — should we allocate any engineering time for the mobile app in Q3?"),
            ("Sakshi Malik", "Not this quarter. Let's keep the focus tight. We can revisit mobile in the Q4 planning cycle."),
            ("Lisa Park", "Makes sense. I'll update the roadmap document with today's decisions."),
            ("Sakshi Malik", "Great. Thanks everyone. Let's reconvene next Tuesday for the sprint planning. Meeting adjourned."),
        ],
    },
    # ── Meeting 1: Engineering Sprint Planning ────────────────────
    {
        "title": "Engineering Sprint Planning",
        "days_ago": 5,
        "duration_seconds": 2400,
        "participant_indices": [0, 1, 3, 5, 7],
        "summary": (
            "The engineering team planned Sprint 14, estimating story points and "
            "assigning ownership for the upcoming two-week cycle. Focus areas "
            "include the search indexing pipeline, WebSocket stability fixes, "
            "and the CI/CD migration to GitHub Actions."
        ),
        "key_topics": [
            "Sprint 14 story point estimation",
            "Search indexing pipeline",
            "WebSocket connection stability",
            "CI/CD migration to GitHub Actions",
        ],
        "action_items": [
            {"text": "Break down search indexing epic into sub-tasks", "assignee": "Jordan Rivera", "done": True},
            {"text": "Investigate WebSocket reconnection failures on Safari", "assignee": "Marcus Williams", "done": False},
            {"text": "Set up GitHub Actions workflows for staging and production", "assignee": "David Thompson", "done": True},
            {"text": "Write unit tests for the new pagination module", "assignee": "James Wilson", "done": False},
            {"text": "Update sprint board with refined estimates", "assignee": "Alex Chen", "done": True},
        ],
        "transcript": [
            ("Sakshi Malik", "Let's get started with sprint planning. Jordan, can you pull up the backlog?"),
            ("Jordan Rivera", "Already up. We have 47 points worth of tickets in the refined column. Based on last sprint's velocity of 38, we should aim for around 40 points."),
            ("Alex Chen", "Agreed. Let's start with the search indexing epic. I think that's the highest priority."),
            ("Jordan Rivera", "The search indexing pipeline has three main stories: schema migration, the indexing worker, and the search API endpoint. I estimated them at 5, 8, and 5 points respectively."),
            ("Marcus Williams", "The indexing worker feels like more than 8 points to me. We need to handle incremental updates, batch processing, and error recovery."),
            ("Jordan Rivera", "Fair point. Let's bump it to 13. That makes the epic 23 points total."),
            ("Sakshi Malik", "That's more than half our capacity on one feature. Can we split it across two sprints?"),
            ("David Thompson", "I think we should do the schema migration and the indexing worker this sprint, and push the search API to Sprint 15. That way we can thoroughly test the worker before building the API on top."),
            ("Alex Chen", "That makes sense. So that's 18 points for search this sprint."),
            ("James Wilson", "I wanted to raise the WebSocket issue. We're getting reports of dropped connections, especially on Safari. I think we need to allocate time for debugging."),
            ("Marcus Williams", "I can look into it. I suspect it's related to the keep-alive interval. Safari's implementation is a bit different from Chrome and Firefox."),
            ("Sakshi Malik", "How many points for the WebSocket fix?"),
            ("Marcus Williams", "Hard to say without investigation. Let's call it 5 points as a spike, and if it turns into a bigger effort we'll carry it over."),
            ("David Thompson", "On my end, I'd like to move our CI/CD from Jenkins to GitHub Actions. The Jenkins server has been flaky and the config is a nightmare to maintain."),
            ("Sakshi Malik", "How much effort is that?"),
            ("David Thompson", "I already have a proof of concept working. I'd estimate 8 points to get staging and production pipelines fully migrated with all the test suites."),
            ("Jordan Rivera", "So we're at 18 plus 5 plus 8, that's 31. We have room for about 9 more points."),
            ("James Wilson", "I can take on the pagination module tests. That's probably 5 points."),
            ("Alex Chen", "And there's a small bug fix for the transcript export — off-by-one error in the timestamps. That's a 3-pointer."),
            ("Sakshi Malik", "Perfect, that puts us at 39 points. Right in our velocity range. Let's lock it in. Jordan, can you update the sprint board?"),
            ("Jordan Rivera", "Will do. I'll have it updated by end of day."),
            ("Sakshi Malik", "Great. Stand-ups at 9:30 AM as usual. Let's have a strong sprint, team."),
        ],
    },
    # ── Meeting 2: Customer Success Weekly Sync ───────────────────
    {
        "title": "Customer Success Weekly Sync",
        "days_ago": 8,
        "duration_seconds": 1800,
        "participant_indices": [4, 6, 9, 10],
        "summary": (
            "The customer success team reviewed open support tickets, discussed "
            "churn risk for two enterprise accounts, and planned outreach for "
            "the upcoming product update. NPS scores improved from 42 to 51 "
            "over the past month."
        ),
        "key_topics": [
            "Enterprise churn risk assessment",
            "NPS score improvement analysis",
            "Product update customer outreach",
            "Support ticket backlog review",
        ],
        "action_items": [
            {"text": "Schedule executive check-in with Acme Corp to address concerns", "assignee": "Rachel Green", "done": False},
            {"text": "Prepare product update newsletter for enterprise tier", "assignee": "Emma Rodriguez", "done": True},
            {"text": "Analyze NPS improvement drivers and create report", "assignee": "Michael Brown", "done": False},
            {"text": "Follow up with GlobalTech on their integration issues", "assignee": "Sarah Kim", "done": True},
        ],
        "transcript": [
            ("Sarah Kim", "Good morning everyone. Let's start with the ticket review. Michael, what's the current backlog looking like?"),
            ("Michael Brown", "We're at 23 open tickets, down from 31 last week. Most of the resolved ones were related to the transcript export bug that engineering fixed on Friday."),
            ("Rachel Green", "Nice. Are there any critical tickets we need to escalate?"),
            ("Michael Brown", "Two. Acme Corp is still having issues with their SSO integration, and GlobalTech's webhook payloads are occasionally arriving out of order."),
            ("Sarah Kim", "I actually spoke with GlobalTech's CTO yesterday. They're understanding but they need a fix within two weeks or they'll start evaluating alternatives."),
            ("Emma Rodriguez", "That's concerning. Should we flag this with engineering?"),
            ("Sarah Kim", "I already did. David is looking into it. But we should follow up early next week to make sure it's on track."),
            ("Rachel Green", "What about Acme Corp? They're one of our largest accounts."),
            ("Michael Brown", "They've been frustrated for about three weeks now. Their IT team says the SAML assertions aren't being validated correctly on our end."),
            ("Rachel Green", "I think we need an executive check-in with them. I'll reach out to their VP of Engineering directly."),
            ("Sarah Kim", "Good idea. Now let's talk about NPS. We saw a nice jump from 42 to 51 this month."),
            ("Emma Rodriguez", "That's fantastic! Do we know what's driving it?"),
            ("Michael Brown", "I think it's the improved onboarding flow we rolled out three weeks ago. We also started sending personalized tips based on usage patterns."),
            ("Sarah Kim", "Let's not get complacent though. 51 is good but we're targeting 60 by end of quarter. Michael, can you dig into the data and identify what's working so we can double down?"),
            ("Michael Brown", "Absolutely. I'll have a report ready by Thursday."),
            ("Emma Rodriguez", "On the product update front, we have a big release coming next week. Should I start drafting the customer newsletter?"),
            ("Rachel Green", "Yes, focus on the enterprise tier first. They need the most hand-holding with new features."),
            ("Sarah Kim", "Agreed. Let's also set up a webinar for mid-tier customers. Alright, anything else? Great. See you all next week."),
        ],
    },
    # ── Meeting 3: Design System Architecture Discussion ──────────
    {
        "title": "Design System Architecture Discussion",
        "days_ago": 12,
        "duration_seconds": 2700,
        "participant_indices": [1, 4, 6, 8, 10],
        "summary": (
            "The team evaluated the architecture for the shared design system, "
            "debating between a monorepo and a multi-package approach. They "
            "agreed on using Storybook for component documentation and decided "
            "to adopt design tokens for consistent theming across products."
        ),
        "key_topics": [
            "Monorepo vs. multi-package architecture",
            "Storybook for component documentation",
            "Design token standardization",
            "Component versioning strategy",
            "Accessibility compliance requirements",
        ],
        "action_items": [
            {"text": "Create proof-of-concept monorepo with Turborepo", "assignee": "Jordan Rivera", "done": True},
            {"text": "Define the initial set of design tokens (colors, spacing, typography)", "assignee": "Emma Rodriguez", "done": False},
            {"text": "Set up Storybook with automated visual regression testing", "assignee": "Lisa Park", "done": False},
            {"text": "Audit existing components for WCAG 2.1 AA compliance", "assignee": "Rachel Green", "done": False},
            {"text": "Write RFC for component versioning and deprecation policy", "assignee": "Sarah Kim", "done": True},
        ],
        "transcript": [
            ("Emma Rodriguez", "So the big question today is how we structure the design system. Right now our components are scattered across three different repos and it's becoming a maintenance nightmare."),
            ("Jordan Rivera", "I've been looking into monorepo tooling. Turborepo and Nx are the two main options. Both handle caching and parallel builds well."),
            ("Lisa Park", "What's the advantage of a monorepo over just publishing packages to a private registry?"),
            ("Jordan Rivera", "The biggest win is atomic changes. If you update a base component, you can immediately see how it affects all downstream components in the same PR. With separate packages, you'd need to publish, bump versions, and test each consumer separately."),
            ("Sarah Kim", "But doesn't a monorepo make the CI slower?"),
            ("Jordan Rivera", "Not with Turborepo. It caches build outputs and only rebuilds what changed. I ran some benchmarks and it's actually faster than our current setup."),
            ("Rachel Green", "I'm sold on the monorepo. But we need to talk about documentation. Our current docs are just a README in each package and nobody reads them."),
            ("Emma Rodriguez", "That's why I want to adopt Storybook. Every component gets a live playground with usage examples, prop documentation, and visual variants."),
            ("Lisa Park", "I love Storybook. We used it at my previous company and it completely changed how designers and developers collaborated."),
            ("Sarah Kim", "Can we also add visual regression testing? I don't want component changes to break the UI without someone noticing."),
            ("Lisa Park", "Absolutely. Chromatic integrates directly with Storybook and catches visual diffs automatically."),
            ("Emma Rodriguez", "Perfect. Now let's talk about design tokens. I want to standardize our colors, spacing, and typography across all products."),
            ("Rachel Green", "What format are you thinking? CSS custom properties? JSON?"),
            ("Emma Rodriguez", "I'm leaning toward Style Dictionary by Amazon. You define tokens in JSON and it generates CSS, SCSS, iOS, and Android outputs automatically."),
            ("Jordan Rivera", "That would work well with the monorepo setup. The tokens package would be a dependency for all component packages."),
            ("Sarah Kim", "One thing I want to make sure we don't forget — accessibility. Our current components have several WCAG violations. We need to fix those as part of this migration."),
            ("Rachel Green", "I can lead the accessibility audit. We should target WCAG 2.1 AA at minimum."),
            ("Emma Rodriguez", "Agreed. Let's also add automated accessibility checks to the CI pipeline so we catch regressions early."),
            ("Lisa Park", "Should we talk about versioning? How do we handle breaking changes to components?"),
            ("Sarah Kim", "I'll write an RFC for that. My initial thinking is semantic versioning with a six-month deprecation window for breaking changes."),
            ("Jordan Rivera", "That sounds reasonable. Let me set up the Turborepo proof of concept this week and we can reconvene on Friday."),
            ("Emma Rodriguez", "Great plan. Let's move fast on this — the inconsistency is starting to confuse users."),
        ],
    },
    # ── Meeting 4: Series B Fundraising Strategy ──────────────────
    {
        "title": "Series B Fundraising Strategy",
        "days_ago": 15,
        "duration_seconds": 3600,
        "participant_indices": [2, 5, 9, 11],
        "summary": (
            "The leadership team discussed the Series B fundraising strategy, "
            "targeting a $25M round at a $150M valuation. They reviewed the "
            "investor pipeline, refined the pitch narrative, and agreed on "
            "timeline milestones for closing by end of Q4."
        ),
        "key_topics": [
            "Target valuation and round size",
            "Investor pipeline review",
            "Pitch deck narrative refinement",
            "Financial projections and metrics",
            "Due diligence preparation",
        ],
        "action_items": [
            {"text": "Update financial model with latest MRR and churn projections", "assignee": "David Thompson", "done": True},
            {"text": "Schedule intro meetings with Sequoia and Andreessen Horowitz", "assignee": "Priya Patel", "done": False},
            {"text": "Finalize pitch deck with updated product demo video", "assignee": None, "done": False},
            {"text": "Prepare data room with legal documents and cap table", "assignee": "Tom Anderson", "done": False},
            {"text": "Rehearse pitch presentation with full team by end of month", "assignee": "Michael Brown", "done": False},
            {"text": "Research comparable SaaS valuations in the meeting intelligence space", "assignee": "David Thompson", "done": True},
        ],
        "transcript": [
            ("Sakshi Malik", "Let's talk fundraising. We've been growing steadily and I think it's time to start the Series B process. David, where do we stand financially?"),
            ("David Thompson", "Our MRR is at $320K, up from $180K at the start of the year. Net revenue retention is 128% and gross margins are at 82%. These are strong SaaS metrics."),
            ("Priya Patel", "What's our current burn rate?"),
            ("David Thompson", "About $400K per month. We have 14 months of runway left from the Series A."),
            ("Tom Anderson", "So we're not desperate, which is good. That gives us leverage in negotiations."),
            ("Sakshi Malik", "Exactly. I want to raise from a position of strength. I'm thinking $25 million at a $150 million pre-money valuation."),
            ("Michael Brown", "Is that realistic given our current revenue?"),
            ("David Thompson", "The multiple would be about 39x ARR. For a high-growth AI company in our space, that's within range. Fireflies.ai raised their Series B at a similar multiple."),
            ("Priya Patel", "Who are the target investors? I've been compiling a list."),
            ("Sakshi Malik", "Tier one, I want Sequoia, a16z, and Lightspeed. Tier two, Accel, Bessemer, and Index Ventures. We should also include Insight Partners since they focus on AI infrastructure."),
            ("Tom Anderson", "I have a warm intro to the partner at Sequoia who led the Fireflies deal. Want me to reach out?"),
            ("Sakshi Malik", "Absolutely. But let's get the pitch deck and data room ready first. I don't want to go in unprepared."),
            ("Michael Brown", "What's the narrative for the pitch? How do we differentiate from Otter, Fireflies, and the other players?"),
            ("Sakshi Malik", "Three things: our AI accuracy is best-in-class at 94%, our enterprise security features are more mature, and our action item extraction actually drives workflow automation, not just note-taking."),
            ("David Thompson", "We should also emphasize the platform play. We're not just a meeting recorder — we're building the meeting intelligence layer that integrates into CRM, project management, and HR systems."),
            ("Priya Patel", "I love that framing. Let me update the pitch deck to lead with the platform vision."),
            ("Tom Anderson", "On the due diligence side, I'll start preparing the data room. We need the cap table, all legal agreements, financial statements, and customer contracts."),
            ("Michael Brown", "How long do we think the process will take?"),
            ("Sakshi Malik", "If we start outreach in September, I'd like to have a term sheet by mid-November and close by end of December."),
            ("David Thompson", "That's aggressive but doable if the metrics keep trending up."),
            ("Priya Patel", "I'll start scheduling intro meetings for early September. Should we do a rehearsal pitch with the team before then?"),
            ("Sakshi Malik", "Yes, let's do a full dress rehearsal by end of August. Everyone should be able to speak to their area of the business."),
            ("Tom Anderson", "One more thing — should we consider secondary sales for early employees? That could be a nice incentive."),
            ("Sakshi Malik", "Good point. Let's include a small secondary component in the round. We can discuss the details once we have a term sheet."),
            ("David Thompson", "Alright, I'll update the financial model with the latest numbers and share it by Friday."),
            ("Sakshi Malik", "Perfect. Let's execute this flawlessly. This round will define our trajectory for the next three years."),
        ],
    },
    # ── Meeting 5: Marketing Campaign Retrospective ───────────────
    {
        "title": "Marketing Campaign Retrospective",
        "days_ago": 19,
        "duration_seconds": 1500,
        "participant_indices": [3, 6, 9, 10, 11],
        "summary": (
            "The marketing team conducted a retrospective on the Q2 product "
            "launch campaign. The campaign generated 1,200 qualified leads and "
            "a 3.2% conversion rate. Key learnings included the effectiveness "
            "of video content and the underperformance of paid social channels."
        ),
        "key_topics": [
            "Campaign performance metrics",
            "Video content ROI analysis",
            "Paid social channel underperformance",
            "Q3 campaign planning",
        ],
        "action_items": [
            {"text": "Compile final campaign performance report with ROI breakdown", "assignee": "Emma Rodriguez", "done": True},
            {"text": "Double video content budget for Q3 campaigns", "assignee": "Marcus Williams", "done": False},
            {"text": "Reallocate paid social budget to content marketing and SEO", "assignee": "Tom Anderson", "done": False},
            {"text": "Interview 5 converted leads to build case studies", "assignee": "Rachel Green", "done": True},
        ],
        "transcript": [
            ("Marcus Williams", "Alright, let's do the retro on the Q2 launch campaign. Emma, do you want to walk us through the numbers?"),
            ("Emma Rodriguez", "Sure. Overall, the campaign ran for six weeks and generated 1,247 marketing qualified leads. Our conversion rate from MQL to SQL was 3.2%, which is above our 2.5% benchmark."),
            ("Rachel Green", "That's solid. What was the total spend?"),
            ("Emma Rodriguez", "About $85K all-in. That includes content production, paid ads, the webinar series, and the influencer partnerships."),
            ("Tom Anderson", "What was the cost per lead?"),
            ("Emma Rodriguez", "About $68 per MQL. Our target was $75, so we came in under budget."),
            ("Michael Brown", "Nice. What channels performed best?"),
            ("Emma Rodriguez", "The surprise winner was video content. Our product demo videos on YouTube drove 34% of all leads at about $45 per lead. The webinar series was also strong at $52 per lead."),
            ("Marcus Williams", "And what underperformed?"),
            ("Emma Rodriguez", "Paid social, unfortunately. We spent $22K on LinkedIn and Facebook ads and only got 89 leads. That's nearly $250 per lead."),
            ("Rachel Green", "Ouch. Should we cut paid social entirely?"),
            ("Tom Anderson", "I wouldn't cut it entirely, but we should significantly reduce it. LinkedIn works for brand awareness but it's not great for direct lead gen at our price point."),
            ("Marcus Williams", "I agree. Let's reallocate most of that budget to video and content marketing. Maybe put some into SEO since we've been underinvesting there."),
            ("Michael Brown", "What about the influencer partnerships? How did those perform?"),
            ("Emma Rodriguez", "Mixed results. The two tech YouTubers we partnered with drove decent traffic but low conversion. The industry analyst blog post, though, converted at 5.1%."),
            ("Rachel Green", "So targeted industry voices outperform general tech influencers. That's a good insight for Q3."),
            ("Marcus Williams", "Agreed. Let's also build some case studies from the leads we converted. Nothing sells like social proof."),
            ("Rachel Green", "I'll handle that. I already have a few customers in mind who had great onboarding experiences."),
            ("Tom Anderson", "One last thing — should we start planning the Q3 campaign now or wait until the roadmap is finalized?"),
            ("Marcus Williams", "Let's start now. We can adjust messaging once the roadmap is locked. I'd rather have a head start than scramble later."),
            ("Emma Rodriguez", "I'll put together a draft campaign brief by next Monday. Great retro, team."),
        ],
    },
    # ── Meeting 6: Platform Migration Technical Review ────────────
    # This meeting intentionally has 60+ transcript segments for
    # scroll-performance testing.
    {
        "title": "Platform Migration Technical Review",
        "days_ago": 22,
        "duration_seconds": 3600,
        "participant_indices": [0, 1, 3, 5, 7, 8],
        "summary": (
            "The engineering team conducted a deep technical review of the "
            "platform migration from a monolithic Django application to a "
            "microservices architecture on Kubernetes. They mapped out the "
            "migration phases, identified high-risk areas, and established "
            "rollback procedures."
        ),
        "key_topics": [
            "Monolith to microservices migration plan",
            "Kubernetes cluster architecture",
            "Database migration strategy",
            "Service mesh and observability",
            "Rollback and disaster recovery",
        ],
        "action_items": [
            {"text": "Create detailed migration runbook with step-by-step procedures", "assignee": "Alex Chen", "done": False},
            {"text": "Set up Kubernetes staging cluster with Istio service mesh", "assignee": "David Thompson", "done": True},
            {"text": "Design database sharding strategy for the user data service", "assignee": "Jordan Rivera", "done": False},
            {"text": "Implement canary deployment pipeline for critical services", "assignee": "Marcus Williams", "done": False},
            {"text": "Conduct load testing on the new auth service at 10x current traffic", "assignee": "James Wilson", "done": True},
            {"text": "Document rollback procedures for each migration phase", "assignee": "Lisa Park", "done": False},
        ],
        "transcript": [
            ("Sakshi Malik", "This is probably the most important technical meeting we'll have this quarter. We're talking about migrating our entire platform from the Django monolith to microservices. Let's make sure we cover everything."),
            ("Alex Chen", "Let me start with the current state. Our monolith is about 180,000 lines of Python code. It handles authentication, meeting management, transcription, summarization, billing, and notifications all in one codebase."),
            ("Jordan Rivera", "And it's becoming a bottleneck. Deploys take 45 minutes, the test suite runs for over an hour, and a bug in the billing module crashed the entire platform last month."),
            ("David Thompson", "Right. The isolation problem is the main driver for this migration. We need independent deployability and fault isolation."),
            ("Sakshi Malik", "Agreed. So what's the target architecture?"),
            ("Alex Chen", "I'm proposing we break it into seven core services: auth, meetings, transcription, summarization, billing, notifications, and a gateway API."),
            ("Marcus Williams", "That seems like a reasonable decomposition. How are we handling inter-service communication?"),
            ("Alex Chen", "Synchronous REST for request-response patterns and RabbitMQ for async event-driven communication. For example, when a meeting ends, it publishes an event that triggers the transcription pipeline."),
            ("James Wilson", "What about service discovery? Are we going with Kubernetes DNS or something like Consul?"),
            ("David Thompson", "Kubernetes DNS should be sufficient for now. We'll run everything in a single cluster initially, so service discovery is handled natively."),
            ("Lisa Park", "Let's talk about the database. Are we splitting the database too or keeping a shared database?"),
            ("Jordan Rivera", "Each service gets its own database. The auth service gets a PostgreSQL instance, meetings and transcription share a PostgreSQL cluster with separate schemas, and we're using Redis for sessions and caching."),
            ("Marcus Williams", "How do we handle data that spans multiple services? For example, the dashboard needs data from meetings, transcription, and summarization."),
            ("Alex Chen", "The gateway API aggregates data from multiple services. It's the only public-facing endpoint. Internal services communicate directly with each other."),
            ("David Thompson", "I've been setting up the Kubernetes cluster. I'm using EKS with managed node groups. The staging cluster is already running with three nodes."),
            ("Sakshi Malik", "What about observability? If we're running seven services, debugging issues becomes much harder."),
            ("David Thompson", "I'm setting up an Istio service mesh. It gives us distributed tracing, traffic management, and mutual TLS between services out of the box."),
            ("James Wilson", "We should also set up centralized logging. Right now, logs are scattered across different servers."),
            ("David Thompson", "Already planned. We'll use Fluentd to ship logs to Elasticsearch and visualize them with Grafana."),
            ("Lisa Park", "What about metrics? We need to know when a service is degrading before users notice."),
            ("David Thompson", "Prometheus for metrics collection and Grafana for dashboards. Each service will expose a metrics endpoint that Prometheus scrapes."),
            ("Marcus Williams", "Let's talk about the migration itself. Are we doing big bang or incremental?"),
            ("Alex Chen", "Definitely incremental. I'm proposing four phases over three months."),
            ("Sakshi Malik", "Walk us through the phases."),
            ("Alex Chen", "Phase 1 is the auth service. It's the most self-contained and has the least dependencies. We extract it, run it alongside the monolith with a feature flag, and gradually shift traffic."),
            ("Jordan Rivera", "What's the timeline for Phase 1?"),
            ("Alex Chen", "Two weeks for extraction, one week for testing, and one week for gradual rollout. So roughly a month."),
            ("James Wilson", "I've already done some load testing on the auth service prototype. It handles 10x our current authentication traffic without breaking a sweat."),
            ("Alex Chen", "Phase 2 is the notifications service. It's mostly event-driven so it's a natural fit for the async messaging pattern."),
            ("Marcus Williams", "And Phase 3?"),
            ("Alex Chen", "Phase 3 is the transcription and summarization services. These are the most compute-intensive and will benefit the most from independent scaling. We can autoscale the transcription workers based on queue depth."),
            ("Lisa Park", "That's exciting. Right now, a spike in transcription jobs slows down the entire platform."),
            ("Alex Chen", "Exactly. With independent scaling, we can spin up 20 transcription workers during peak hours without affecting the meeting management service at all."),
            ("David Thompson", "Phase 4 would be meetings and billing?"),
            ("Alex Chen", "Yes. Those are the most tightly coupled to the existing database schema, so they'll be the hardest to extract. I'm saving them for last."),
            ("Sakshi Malik", "What about rollback? If something goes wrong during migration, how do we recover?"),
            ("Marcus Williams", "Each phase should have a rollback plan. For the auth service, we keep the monolith's auth module active behind the feature flag. If the new service fails, we flip the flag and route traffic back to the monolith."),
            ("Alex Chen", "The critical thing is that we maintain data consistency during the transition. Both the old and new systems need to read from and write to the same data stores during the rollover period."),
            ("Jordan Rivera", "That means we need to be very careful about schema changes. Any migration that's not backward compatible could break the monolith."),
            ("Lisa Park", "Should we implement a change data capture system to keep the databases in sync during the transition?"),
            ("Jordan Rivera", "Yes, I'm looking at Debezium for CDC. It can stream changes from PostgreSQL to RabbitMQ, which our services are already consuming."),
            ("David Thompson", "What about the CI/CD pipeline? Each service needs its own pipeline."),
            ("Marcus Williams", "I'm proposing we use GitHub Actions with a matrix build. Each service directory triggers its own build, test, and deploy pipeline. We'll use Helm charts for Kubernetes deployments."),
            ("James Wilson", "We should also implement canary deployments. Ship to 5% of traffic first, monitor for errors, then gradually increase."),
            ("Marcus Williams", "Absolutely. Istio makes canary deployments straightforward with traffic splitting rules."),
            ("Sakshi Malik", "This is a lot of work. Do we have enough engineers to pull this off while maintaining the existing product?"),
            ("Alex Chen", "It'll be tight. I'd recommend we dedicate three engineers to the migration full-time and have the rest continue feature work on the monolith. The features they build will eventually need to be ported, but we can't freeze the product for three months."),
            ("Jordan Rivera", "I agree. We should also document everything thoroughly. The migration runbook needs to be detailed enough that any engineer can execute a phase independently."),
            ("Lisa Park", "I'll own the documentation. I want to create a living runbook that we update after each phase."),
            ("David Thompson", "One thing I want to flag — cost. Running seven services on Kubernetes will cost more than our current single-server setup. I estimate about a 40% increase in infrastructure costs."),
            ("Sakshi Malik", "That's expected. The productivity gains and reliability improvements will more than offset it. But let's track the costs carefully."),
            ("Marcus Williams", "We should also think about local development. Running seven services on a developer's laptop is going to be painful."),
            ("David Thompson", "We'll use Docker Compose for local development. Each service has its own Dockerfile and we'll have a docker-compose.yml that spins up the entire stack. Developers can also use Tilt or Skaffold for hot-reloading."),
            ("James Wilson", "What about testing? Integration tests across services are going to be more complex."),
            ("Alex Chen", "We'll have three levels of testing. Unit tests within each service, contract tests between services using Pact, and end-to-end tests against the full stack in the staging environment."),
            ("Jordan Rivera", "Contract testing is crucial. It catches breaking API changes before they hit staging."),
            ("Lisa Park", "Should we also set up chaos engineering? Like randomly killing pods to test resilience?"),
            ("Marcus Williams", "Eventually, yes. But not in Phase 1. Let's get the basics right first and add chaos testing once we have at least three services running in production."),
            ("Sakshi Malik", "Alright, I think we have a solid plan. Let me summarize the next steps."),
            ("Sakshi Malik", "Alex writes the detailed migration runbook. David finishes the Kubernetes staging cluster with Istio. Jordan designs the database sharding strategy. Marcus implements the canary deployment pipeline. James continues load testing. And Lisa documents everything."),
            ("Alex Chen", "I'd also like to schedule a follow-up meeting in two weeks to review Phase 1 progress."),
            ("David Thompson", "Agreed. And we should have daily stand-ups specifically for the migration team."),
            ("Sakshi Malik", "Let's do it. This migration is our top technical priority. Any questions?"),
            ("Jordan Rivera", "Just one — are we committing to this timeline publicly or keeping it internal?"),
            ("Sakshi Malik", "Internal only for now. Once Phase 1 is complete and we have confidence in the process, we can share a broader timeline with the company."),
            ("Marcus Williams", "Makes sense. No point in creating anxiety before we've proven the approach works."),
            ("James Wilson", "One more thing — should we brief the customer success team? They might get questions if there's any downtime during migration."),
            ("Sakshi Malik", "Good thinking. I'll schedule a briefing with Sarah's team next week. We'll keep it high-level but make sure they know what to expect."),
            ("Lisa Park", "I can prepare a customer-facing FAQ document in case we need it."),
            ("Sakshi Malik", "Perfect. Alright everyone, let's make this happen. This migration will define our technical foundation for the next five years."),
        ],
    },
    # ── Meeting 7: New Hire Onboarding Process ────────────────────
    {
        "title": "New Hire Onboarding Process",
        "days_ago": 27,
        "duration_seconds": 1200,
        "participant_indices": [2, 4, 7, 10, 11],
        "summary": (
            "The HR and team leads discussed improvements to the new hire "
            "onboarding process. They identified gaps in the current 30/60/90 "
            "day plan and proposed a buddy system, structured check-ins, and "
            "better documentation to reduce time-to-productivity."
        ),
        "key_topics": [
            "30/60/90 day onboarding plan revision",
            "Buddy system implementation",
            "Onboarding documentation gaps",
        ],
        "action_items": [
            {"text": "Create updated 30/60/90 day onboarding template", "assignee": "Rachel Green", "done": True},
            {"text": "Identify buddy volunteers from each engineering team", "assignee": "James Wilson", "done": False},
            {"text": "Record video walkthroughs of key internal tools", "assignee": "Tom Anderson", "done": False},
            {"text": "Set up automated onboarding checklist in HR system", "assignee": "Priya Patel", "done": True},
            {"text": "Schedule first mentor training session for buddy volunteers", "assignee": "Sarah Kim", "done": False},
        ],
        "transcript": [
            ("Rachel Green", "Thanks for making time for this. We have four new hires starting next month and I want to make sure our onboarding process is solid."),
            ("Priya Patel", "What are the main pain points with the current process?"),
            ("Rachel Green", "Based on feedback from recent hires, the biggest issues are lack of documentation, no clear point of contact for questions, and the 30/60/90 day plan feels too vague."),
            ("James Wilson", "I can confirm that. When I joined six months ago, I spent the first two weeks just figuring out how to set up my development environment. There was no guide."),
            ("Sarah Kim", "That's a problem we can fix quickly. We should have a detailed setup guide for every team."),
            ("Tom Anderson", "I'd suggest we also record video walkthroughs. Some people learn better from videos than documentation."),
            ("Rachel Green", "Great idea. Now, about the buddy system — I want every new hire paired with an experienced team member who's not their manager."),
            ("James Wilson", "I'd volunteer for that. It really helps to have someone you can ask dumb questions without feeling judged."),
            ("Priya Patel", "We should also structure the check-ins. Maybe a daily 15-minute sync for the first week, then twice a week for the first month."),
            ("Sarah Kim", "That sounds right. And the buddy should have a checklist of topics to cover — codebase overview, team norms, communication channels, how to request time off, all the stuff that's obvious to us but confusing for newcomers."),
            ("Rachel Green", "I'll revise the 30/60/90 day template. Day 30 should focus on understanding the product and codebase. Day 60 on making independent contributions. Day 90 on owning a feature end-to-end."),
            ("Tom Anderson", "What about cross-team introductions? New hires often only know their immediate team."),
            ("Rachel Green", "Good point. Let's schedule a lunch-and-learn rotation where new hires spend 30 minutes with each team lead in their first two weeks."),
            ("James Wilson", "We should also give new hires a small starter project that touches multiple parts of the codebase. Nothing critical, but something that forces them to explore."),
            ("Priya Patel", "I can set up automated reminders in the HR system for check-ins and milestones. That way nothing falls through the cracks."),
            ("Sarah Kim", "This is shaping up nicely. When can we have everything ready?"),
            ("Rachel Green", "I'll have the updated template and documentation plan ready by next Friday. Tom, can you start on the video walkthroughs?"),
            ("Tom Anderson", "I'll aim to have the first three videos done by end of next week."),
            ("Sarah Kim", "And I'll schedule a mentor training session for the buddy volunteers. We want them to be effective, not just available."),
            ("Rachel Green", "Perfect. Let's make sure our new hires have an amazing first experience. It sets the tone for everything that follows."),
        ],
    },
]


# ────────────────────────────────────────────────────────────────────
# Helper utilities
# ────────────────────────────────────────────────────────────────────


def _uid() -> str:
    """Generate a new UUID-4 string for use as a primary key."""
    return str(uuid.uuid4())


def _meeting_date(days_ago: int) -> datetime:
    """Return a datetime *days_ago* days before ``_NOW`` at 10:00 AM UTC."""
    return (_NOW - timedelta(days=days_ago)).replace(
        hour=10, minute=0, second=0, microsecond=0
    )


def _build_transcript_segments(
    meeting_id: str,
    duration_seconds: int,
    raw_lines: list[tuple[str, str]],
) -> list[TranscriptSegment]:
    """Convert raw ``(speaker, text)`` tuples into ``TranscriptSegment`` rows.

    Timestamps are distributed evenly across the meeting duration so that
    segments are sequential and non-overlapping.
    """
    count = len(raw_lines)
    segment_length = duration_seconds / count  # seconds per segment
    segments: list[TranscriptSegment] = []

    for idx, (speaker, text) in enumerate(raw_lines):
        start = round(idx * segment_length, 1)
        end = round((idx + 1) * segment_length, 1)
        segments.append(
            TranscriptSegment(
                id=_uid(),
                meeting_id=meeting_id,
                speaker_name=speaker,
                start_time_seconds=start,
                end_time_seconds=end,
                text=text,
                order_index=idx,
            )
        )

    return segments


# ────────────────────────────────────────────────────────────────────
# Main seed function
# ────────────────────────────────────────────────────────────────────


def seed() -> None:
    """Populate the database with demo data.

    The function is **idempotent** — if any ``User`` row already exists the
    function prints a message and returns immediately.
    """

    # 1. Ensure all tables exist.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 2. Idempotency check.
        existing_user = db.query(User).first()
        if existing_user is not None:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database …")

        # ── 3. Create the default user ────────────────────────────
        user = User(
            id=DEFAULT_USER_ID,
            name="Sakshi Malik",
            email="sakshi@meetingintel.com",
            avatar_url=AVATAR_URL,
        )
        db.add(user)
        db.flush()  # ensure user PK is available for FK references
        print(f"  [+] Created user: {user.name}")

        # ── 4. Create participants (de-duplicated across meetings) ─
        # Build Participant rows once; they are re-used via the M2M
        # association table.
        participant_objects: list[Participant] = []
        for info in PARTICIPANT_POOL:
            p = Participant(id=_uid(), name=info["name"], email=info["email"])
            participant_objects.append(p)
        db.add_all(participant_objects)
        db.flush()
        print(f"  [+] Created {len(participant_objects)} participants")

        # ── 5. Create meetings and child data ─────────────────────
        for idx, mdata in enumerate(MEETINGS_DATA):
            meeting_id = _uid()
            meeting_date = _meeting_date(mdata["days_ago"])

            # Meeting row
            meeting = Meeting(
                id=meeting_id,
                title=mdata["title"],
                date=meeting_date,
                duration_seconds=mdata["duration_seconds"],
                host_user_id=DEFAULT_USER_ID,
                media_url=MEDIA_URL,
            )
            db.add(meeting)
            db.flush()

            # Link participants via M2M
            for pi in mdata["participant_indices"]:
                meeting.participants.append(participant_objects[pi])

            # Transcript segments
            segments = _build_transcript_segments(
                meeting_id=meeting_id,
                duration_seconds=mdata["duration_seconds"],
                raw_lines=mdata["transcript"],
            )
            db.add_all(segments)

            # Summary (1:1)
            summary = Summary(
                id=_uid(),
                meeting_id=meeting_id,
                overview_text=mdata["summary"],
                generated_at=meeting_date,
            )
            db.add(summary)

            # Key topics
            for ti, topic_text in enumerate(mdata["key_topics"]):
                db.add(
                    KeyTopic(
                        id=_uid(),
                        meeting_id=meeting_id,
                        topic_text=topic_text,
                        order_index=ti,
                    )
                )

            # Action items
            for ai_data in mdata["action_items"]:
                db.add(
                    ActionItem(
                        id=_uid(),
                        meeting_id=meeting_id,
                        text=ai_data["text"],
                        assignee_name=ai_data["assignee"],
                        is_completed=ai_data["done"],
                        created_at=meeting_date,
                    )
                )

            print(
                f"  [+] Meeting {idx + 1}/{len(MEETINGS_DATA)}: "
                f"\"{mdata['title']}\" - {len(segments)} segments"
            )

        # ── 6. Commit everything in one transaction ───────────────
        db.commit()
        print("\nDatabase seeded successfully!")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────
# Entry point — supports both `python -m app.db.seed` and direct run
# ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    seed()
