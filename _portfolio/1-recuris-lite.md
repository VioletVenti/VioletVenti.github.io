---
title: "recuris-lite: self-evolving skill memory for agents"
excerpt: "A scaled-down reproduction of Recuris (arXiv:2608.24876): the model weights stay frozen and only the agent's skill memory evolves. [Code](https://github.com/VioletVenti/recuris-lite)"
collection: portfolio
---

**Code:** [github.com/VioletVenti/recuris-lite](https://github.com/VioletVenti/recuris-lite) · **Paper reproduced:** [arXiv:2608.24876](https://arxiv.org/abs/2608.24876)

A scaled-down reproduction of agent self-improvement by evolving skill memory while keeping the weights frozen. Qwen3-8B stays frozen on τ²-bench retail, and [Klaude Code](https://github.com/VioletVenti/Klaude-Code) acts as the meta-agent that patches the skill memory. Each patch must pass code validation, a repair screen, a paired-bootstrap gate, and a mechanism-trigger check.

- **Evaluation reliability.** Found a grading defect in τ²-bench where 40 of 114 tasks always scored 0, and corrected the baseline pass^1 from 14.9% to 21.1%. Two A/A controls put the gate's noise floor at about ±5–7 pt, so I grew the dev split from 16 to 40 tasks, which shrank the CI width from 36 pt to 14 pt.
- **Result.** No patch passed the gate in 4 evolution rounds. The mechanism-trigger check caught a false positive: a patch scored +4.4 pt on dev but never actually fired. I then tightened the patch-validation rules.
