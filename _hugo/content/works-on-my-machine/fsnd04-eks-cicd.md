---
title: "fsnd04-eks-cicd"
description: "a flask jwt api in a container, deployed to kubernetes on aws eks by a codepipeline that tests, builds and rolls out every push."
weight: 5
stack: ["docker", "kubernetes", "aws-eks", "codepipeline/codebuild", "cloudformation", "python", "flask",]
repo: "https://github.com/janymuong/FSND04-server-deployment-and-containerization"
---

## name

fsnd04-eks-cicd: a small flask api that ships itself to a kubernetes cluster on aws.

## synopsis

A Flask API with three endpoints: `GET /` is a health check, `POST /auth` takes an email and password and returns a JWT, and `GET /contents` needs a valid token and returns what is in it. It runs in a container behind gunicorn on Amazon EKS, and a CodePipeline redeploys it on every push to GitHub.

Server deployment, containerization and testing project. The Flask app came with the course; the Dockerfile, tests, build spec, pipeline template and IAM files are the parts I filled in.

## how a push ships

1. A push starts CodePipeline: a GitHub source stage, then a CodeBuild stage.
2. CodeBuild starts Docker, installs a pinned, checksum-verified `kubectl`, and reads `JWT_SECRET` from Parameter Store.
3. It runs `pytest`. A failing test stops the build.
4. It builds the image, tags it with the repo, branch, environment, timestamp and commit, and pushes it to ECR.
5. It assumes a kubectl role, points `kubectl` at the EKS cluster and applies `simple_jwt_api.yml`: 3 replicas, a rolling update, and a `LoadBalancer` service on port 80 that forwards to the container's 8080.

## build and run

Locally:

```bash
docker build -t simple-jwt-api .
docker run --rm -p 8080:8080 -e JWT_SECRET=changeme simple-jwt-api

curl localhost:8080/
curl -X POST localhost:8080/auth -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"pw"}'
curl localhost:8080/contents -H "Authorization: Bearer <token>"
```

Tests:

```bash
SECRET=changeme EMAIL=me@example.com PASSWORD=pw python -m pytest test_main.py
```

On AWS, once per account:

```bash
eksctl create cluster --name simple-jwt-api --region us-east-2
aws ssm put-parameter --name JWT_SECRET --type SecureString --value "<secret>"
aws iam create-role --role-name UdacityFlaskDeployCBKubectlRole \
  --assume-role-policy-document file://trust.json
aws iam put-role-policy --role-name UdacityFlaskDeployCBKubectlRole \
  --policy-name eks-describe --policy-document file://iam-role-policy.json
kubectl patch configmap/aws-auth -n kube-system --patch "$(cat aws-auth-patch.yml)"
```

Then create a stack from `ci-cd-codepipeline.cfn.yml`. It takes the cluster name, the GitHub repo, branch, user and token, the CodeBuild image and the kubectl role name, and creates the ECR repository, the artifact bucket, the roles, the CodeBuild project and the pipeline.

## notes

- **Secret.** `JWT_SECRET` comes from Parameter Store at build time. `main.py` falls back to a default secret when the variable is missing, which is fine on a laptop and wrong anywhere else.
- **Two roles.** CodeBuild assumes a separate kubectl role, mapped to `system:masters` in the cluster's `aws-auth` ConfigMap. A small Lambda custom resource in the pipeline template adds the CodeBuild role to that role's trust policy.
- **Rollouts.** With 3 replicas and `maxUnavailable: 2`, a rollout is quick but can leave a single pod serving for a moment.
- **Tests.** They cover `/` and `/auth`. `/contents` is untested. A commented-out `assert False` is kept to show that a bad test fails the build.
- **Cleanup.** `eksctl delete cluster` removes the cluster. The ECR repository and the artifact bucket are set to be retained when the stack is deleted.
- **Old stack.** Python 3.7, Flask 1.1, PyJWT 1.7 and kubectl 1.23, on a `python:stretch` image. Not migrated.
