---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education
======
* B.S. in Intelligence Science and Technology, Peking University, 2025 – present (expected 2029)

Research interests
======
* Agent harnesses, recursive self-improvement (RSI), agent RL

Projects
======
* **recuris-lite** (2026.10) — reproduction of agent skill-memory self-evolution ([arXiv:2608.24876](https://arxiv.org/abs/2608.24876)); [code](https://github.com/VioletVenti/recuris-lite)
* **cure-lite** (2026.10) — reproduction of coder / unit-tester co-evolution RL ([arXiv:2506.03136](https://arxiv.org/abs/2506.03136)); [code](https://github.com/VioletVenti/cure-lite)
* **Klaude Code** (2026.07 – 2026.10) — Claude Code-style coding agent built from scratch; [code](https://github.com/VioletVenti/Klaude-Code)

Skills
======
* **ML foundations:** probability and information theory, optimization, reinforcement learning; Transformers and LLM inference (KV cache, PagedAttention)
* **Post-training:** SFT, PPO, DPO, GRPO and variants, RLVR, reward models and verifiers
* **Agents:** harness engineering (tools, MCP, context, memory, skills)
* **Engineering:** Python, C++; PyTorch, transformers, vLLM; Linux, Docker

Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
