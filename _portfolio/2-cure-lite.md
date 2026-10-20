---
title: "cure-lite: co-evolving coder and unit tester with RL"
excerpt: "A from-scratch implementation of CURE (arXiv:2506.03136). One model acts as both coder and unit tester, rewarded through a code × test execution matrix. [Code](https://github.com/VioletVenti/cure-lite)"
collection: portfolio
order: 2
date: 2026-10-20
---

**Code:** [github.com/VioletVenti/cure-lite](https://github.com/VioletVenti/cure-lite) · **Paper reproduced:** [arXiv:2506.03136](https://arxiv.org/abs/2506.03136)

A from-scratch implementation of co-evolutionary RL. The same model serves as both coder and unit tester, and rewards come from a code × test execution matrix. I trained Qwen2.5-1.5B with full-parameter updates on a single A100-40G, using in-process vLLM weight sync and AdamW on the CPU.

- **Experiments.** Three arms of 80 steps each on 239 CodeContests problems. Unit-test accuracy in the co-evolution arm rose from 57.4% to about 90%. Code accuracy rose from 7.6% to 11.6% in all three arms, so co-evolution gave no extra coder gain. With the official code-version tester reward, BoN went from 14.6% to 18.4% (single seed, weak evidence).
- **Debugging.** Found and fixed an evaluation bias in the execution sandbox; before the fix, every model scored ≈ 0. Analyzed why the tester signal dries up at 1.5B scale.
