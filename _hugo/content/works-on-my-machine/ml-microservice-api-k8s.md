---
title: "ml-microservice-k8s"
description: "a pytorch sleep-staging model wrapped within an api, containerized with docker and run on kubernetes (minikube). started life as a scikit-learn house-price service."
weight: 1
featured: true
highlights:
  - "swapped a scikit-learn price model for a PyTorch CNN+GRU that stages sleep from one EEG channel"
  - "trained on real Sleep-EDF recordings, split by subject: Cohen's kappa 0.78 on 4 held-out subjects"
  - "served with gunicorn, containerised with Docker, deployed on Kubernetes (minikube) with health probes"
stack: ["python", "pytorch", "kubernetes", "docker", "neural-nets","flask", "gunicorn", ]
repo: "https://github.com/janymuong/ml-microservice-api-k8s"
image: "https://hub.docker.com/r/janymuong/eeg-sleep-staging"
---

## name

ml-microservice-api-k8s: serve an EEG sleep-staging model over HTTP, in a container, on a cluster.

## synopsis

A Flask API with one real endpoint, `POST /predict`. It takes one night of single-channel EEG (`.npy`, `.edf` or JSON) and labels every 30-second epoch as Wake, N1, N2, N3 or REM. It returns the hypnogram plus sleep efficiency, sleep latency and REM latency.

It began as a scikit-learn Boston-housing service. That version lives on in `legacy/boston-sklearn`; the Docker, Makefile, CI and Kubernetes plumbing was kept and adapted.

Not a medical device.

## architecture

```text
client ──POST /predict──▶ gunicorn
                              │
                              ▼
                     Flask app (app.py)
                     reads .npy / .edf / JSON
                              │
                              ▼
                  preprocessing (shared with training)
                  100 Hz, 0.3-35 Hz band-pass, 30 s epochs
                              │
                              ▼
        SleepNet( 1-D CNN ▶ bidirectional GRU, 20-epoch windows )
                              │
                              ▼
          { "stages": [...], "summary": {...}, "trained_on": ... }
```

## build and run

```bash
./fetch_data.sh        # Sleep-EDF subjects 0-19
python train.py        # write the checkpoint and its metrics
./run_docker.sh        # docker build, serve on localhost:8000
./run_kubernetes.sh    # build, load into minikube, run pods, port-forward
```

Then, from another terminal:

```bash
curl -F "file=@samples/synthetic_night.npy" -F sampling_rate=100 localhost:8000/predict
```

## results

Split by subject (60/20/20), best epoch picked on validation, test subjects scored once.

| accuracy | macro-F1 | Cohen's kappa |
|---|---|---|
| 0.838 | 0.789 | 0.778 |

N2 and N3 are strong (F1 0.90). N1 is the weak stage (F1 0.47).

## what changed, and the limits

- **A different model.** scikit-learn on six housing features gave way to PyTorch on raw EEG. Preprocessing is one shared module, so training and serving cannot drift apart.
- **Splitting by subject.** Both nights of a person land in the same split. Splitting by night leaks a person's EEG signature into the test set and inflates the scores.
- **Same code scores and serves.** The windowed prediction function that scores the test set also answers `/predict`, so the reported metrics describe what the API does.
- **Safe uploads.** `.npy` files are loaded with `allow_pickle=False`, so a malicious upload cannot run code.
- **Kubernetes.** 2 replicas, readiness and liveness probes on `/healthz`, one gunicorn worker per pod, scaling by replicas.
- **One channel.** Human scorers also use eye and muscle signals, which helps most with REM. Only 4 test subjects, so the score has wide error bars.
