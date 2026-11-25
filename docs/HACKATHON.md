# Sarmate — Three-person project brief

## Current scope
Source excerpts, evidence retrieval, recall practice and Markdown export work without credentials. AI explanation generation is implemented behind a server route but needs an OpenAI API key and a model accessible to that account. No live-model accuracy or user-impact results are claimed.

## Three-person ownership (provisional until skills are known)
- User: product decisions, integration review, organizer clarification and final submission. Backup: teammate 2.
- Teammate 1: QA and evaluation. Prepare 20 answerable and 10 unsupported cases; verify source support and Burmese quality. If technically experienced, own AI integration instead.
- Teammate 2: user research, usability feedback, screenshots, demo script and submission copy. If frontend-experienced, also own interface polish.
- Agent: implementation, automated checks, build and private deployment preparation. The agent is a development tool, not a competition team member.

First 24 hours: user checks rules and model access; teammate 1 reviews sample guides and records failures; teammate 2 interviews three target learners. Everyone reports actual available hours. Do not expand MVP scope merely because the team grew.

## Team milestones (Myanmar time)
- Nov 25: activate AI with a budget cap; interview three target learners; test Burmese output.
- Nov 26: verify model integration and source support on representative lessons.
- Nov 27–28: improve comprehension questions; run evaluation and fix failures.
- Nov 29: pilot with five students, with consent and anonymized feedback.
- Nov 30: feature freeze; screenshots and demo video.
- Dec 1, 20:00 MMT: internal submission target.

Official sources: https://ml-build-challenge-4.devpost.com/rules and https://ml-build-challenge-4.devpost.com/details/dates. Their deadline times conflict (Dec 1 at 21:00 vs 23:45 Pacific). Use the earlier cutoff pending organizer clarification. AI-code and existing-project policies are not yet confirmed. The team has three participants (the user plus two teammates); AI-assisted development must be disclosed as applicable. No competition submission has been made.

## Suggested Devpost draft
Sarmate helps students study short English or Myanmar lessons through source-linked notes and retrieval practice. Every note points back to the original passage. A credential-free source mode is available, while optional AI explanations are validated for reference IDs and verbatim source quotes. These mechanical checks do not establish semantic correctness.

Built with TypeScript, React, Vinext and Cloudflare Workers. Development is AI-assisted. Starter framework and open-source dependencies are reused. The sample introductory-CS text was authored for this project.

## Evaluation protocol
Create 20 answerable questions and 10 unsupported questions with human-written reference answers. Hold out final evaluation examples from prompt tuning. Track correctness, source support, abstention, latency and task completion. Record actual counts, model/version, date, failures and sample size. Do not claim learning gains from a small uncontrolled pilot.

## Demo (2–3 minutes, suggested)
1. Explain the learner's problem.
2. Paste a lesson and create a guide; identify the mode honestly.
3. Open the source, complete one practice prompt, and search for evidence.
4. Show an unsupported search, a failure state, and export.
5. Show actual evaluation results when available and state limitations.

## Before submission
Confirm Myanmar residency/age eligibility, AI-code reuse policy and deadline with organizer. Ensure judge access: the current Site is private and cannot be assumed accessible to judges. Arrange appropriate sharing only when authorized. Confirm repository/license requirements, video requirements, and all three team members and their roles. Keep a local build and labeled recorded demo. Submit and verify final status rather than leaving a draft.
