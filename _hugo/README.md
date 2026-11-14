# yaml-engineer (Hugo)

The portfolio. It is served at `/yaml-engineer/` next to the Jekyll landing page, and both are built by `.github/workflows/pages.yml`.

The folder starts with an underscore on purpose: Jekyll skips it, so the two sites never touch each other.

## Preview locally

```bash
sudo pacman -S hugo        # any recent Hugo works, CI uses 0.169.0
cd _hugo
hugo server                # http://localhost:1313/yaml-engineer/
```

## Add a project

Create `content/works-on-my-machine/<repo-name>.md`:

```markdown
---
title: "<repo-name>"
description: "one line shown in the ls listing"
weight: 6                  # order in the listing
stack: ["python", "docker"]
repo: "https://github.com/janymuong/<repo-name>"
# wip: true                # shows the [wip] badge while the write-up is unfinished
---

## name
## synopsis
## build and run
## what broke, and the fixes
```

Headings render as upper-case man-page sections. Set `wip: true` to list a project before its write-up is done, and remove it when the page is complete.

## Theme

`assets/css/main.css` is a plain-CSS port of `_sass/no-style-please.scss` and `_sass/colors.scss`. The colours are variables at the top of the file, so no Sass toolchain is needed.
