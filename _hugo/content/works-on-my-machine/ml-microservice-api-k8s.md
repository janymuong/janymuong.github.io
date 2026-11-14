---
title: "ml-microservice-api-k8s"
description: "a scikit-learn model behind a Flask API, packed in Docker and run on Kubernetes (minikube), migrated from 2019 pins to Python 3.14."
weight: 1
featured: true
highlights:
  - "moved a 2019 Python 3.7 project onto Python 3.14 and current libraries"
  - "found a scaler bug that made every prediction the same, and fixed it by training a proper pipeline"
  - "containerised with gunicorn and deployed on Kubernetes (minikube)"
stack: ["python", "flask", "scikit-learn", "gunicorn", "docker", "kubernetes"]
repo: "https://github.com/janymuong/ml-microservice-api-k8s"
image: "https://hub.docker.com/r/janymuong/mlapiscikit"
---

## name

ml-microservice-api-k8s: serve a scikit-learn housing-price model over HTTP, in a container, on a cluster.

## synopsis

A small Flask API with one real endpoint, `POST /predict`. It takes six Boston-housing features (`CHAS`, `RM`, `TAX`, `PTRATIO`, `B`, `LSTAT`) as JSON and returns the predicted median home value.

It started as a Python 3.7 course project pinned to 2019 libraries. This page is about dragging it onto Python 3.14 and making it behave properly in Docker and on Kubernetes.

## architecture

```text
client ──POST /predict──▶ gunicorn (2 workers)
                              │
                              ▼
                     Flask app (app.py)
                     checks the six features,
                     fixes column order and types
                              │
                              ▼
         Pipeline( StandardScaler ▶ GradientBoostingRegressor )
                              │
                              ▼
                   { "prediction": [ ... ] }
```

## build and run

```bash
python train.py        # train on housing.csv, write the .joblib model
./run_docker.sh        # docker build, serve on localhost:8000
./run_kubernetes.sh    # build, load into minikube, run pod, port-forward
```

Then, from another terminal:

```bash
curl -s -X POST localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"CHAS":{"0":0},"RM":{"0":6.575},"TAX":{"0":296.0},"PTRATIO":{"0":15.3},"B":{"0":396.9},"LSTAT":{"0":4.98}}'
```

## what broke, and the fixes

- **Dependencies from 2019.** `numpy==1.17.2` has no wheels for Python 3.14, so pip tried to build it from source and the build crashed. Everything moved to current releases: Flask 3, numpy 2, pandas 3, scikit-learn 1.9.
- **`sklearn.externals.joblib` is gone.** It is a plain `import joblib` now.
- **The pickled model would not load.** It pointed at a scikit-learn module that was renamed years ago (`sklearn.ensemble.gradient_boosting`). A pickle is tied to the library version that wrote it, so I retrained from the dataset bundled in the repo and saved a fresh model.
- **A scaler bug hiding in plain sight.** The original fitted a new `StandardScaler` on every request. For a single row that scales every feature to zero, so the model returned the same prediction whatever you sent. The scaler now lives inside the trained pipeline and uses statistics learned from the training data.
- **A dev server in a container.** Flask's built-in server gave way to gunicorn. The image is `python:3.14-slim`, and a `.dockerignore` keeps the virtualenv out of the build.
- **Kubernetes pulling the wrong image.** A `:latest` tag defaults to always pulling from Docker Hub, which would fetch the old Python 3.7 image. The script builds locally, loads the image into minikube and sets `--image-pull-policy=Never`.
- **Windows line endings.** CRLF broke the shebang (`env: 'bash\r': No such file or directory`). Fixed with `sed -i 's/\r$//'` and a `.gitattributes` that pins `eol=lf`.
