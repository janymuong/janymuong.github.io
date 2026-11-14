---
title: "argus"
description: "AI-assisted diabetic retinopathy (dr) screening workspace: argus explores dr screening. dr is damage to the retina's blood vessels caused by diabetes, and is a leading cause of preventable blindness worldwide."

weight: 3
# wip: true
stack: ["ml", "transfer-learning", "typescript", "django", "computer-vision"]
repo: "https://github.com/janymuong/argus"
---

## name

argus: a retinopathy screening workspace.

## synopsis

A workspace for retinopathy screening that uses computer vision.  
Ddiabetic retinopathy (dr) screening workspace: argus explores dr screening. diabetic retinopathy is damage to the retina's blood vessels caused by diabetes, and is a leading cause of preventable blindness worldwide. ai screening tools (cnns trained on retinal fundus photos) have shown they can match or exceed specialist-level accuracy at detecting it, which is why they're being deployed in regions with few ophthalmologists.

packaged in strawberry django, with rbac, and jwt authentication; the `predict` mutation accepts an image upload and is restricted server-side to clinicians.

what it does:

given a retinal fundus photo, argus predicts a dr severity grade:

| class | meaning |
|-------|---------|
| 0 | no dr |
| 1 | mild |
| 2 | moderate |
| 3 | severe |
| 4 | proliferative dr |

