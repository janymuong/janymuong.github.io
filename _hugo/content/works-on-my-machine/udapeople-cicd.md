---
title: "udapeople-cicd"
description: "a circleci pipeline that tests, scans and ships a node app to aws with blue/green releases: cloudformation for the infrastructure, ansible for the server, prometheus and alertmanager to say when it breaks."
weight: 6
stack: ["circleci", "aws", "cloudformation", "ansible", "prometheus", "nodejs"]
repo: "https://github.com/janymuong/Cloud-DevOps-CI-CD-project"
---

## name

udapeople-cicd: auto-deploy for a node app, with a way back when it breaks.

## synopsis

A CircleCI pipeline for UdaPeople, a small employee app with a NestJS back end, a front end and Postgres. Every push to `main` is built, tested and scanned, then released as a fresh pair of CloudFormation stacks: an EC2 instance for the back end and an S3 website for the front end. After a smoke test, CloudFront is pointed at the new front end and the previous release is deleted. A failure along the way tears the new stacks down and reverts the database migrations. Prometheus and Alertmanager watch the server.

A Udacity Cloud DevOps Engineer project. The app came with the course; the pipeline, the CloudFormation templates, the Ansible roles and the monitoring setup are what I built.

## pipeline

1. **Build** the front end and back end in parallel, with cached `node_modules`.
2. **Test and scan** each one: unit tests, and `npm audit` at the critical level.
3. **Deploy infrastructure**, on `main` only. Two stacks named after the first 7 characters of the workflow id: `udapeople-backend-<id>` (a t2.micro Ubuntu instance) and `udapeople-frontend-<id>` (a public S3 website bucket). The instance's IP is looked up by tag and added to the Ansible inventory.
4. **Configure infrastructure.** Ansible installs Node, npm and pm2 on the new server.
5. **Run migrations.** On success, a flag keyed by the workflow id is written to a small key-value store (kvdb.io), so a later failure knows whether the migration needs reverting.
6. **Deploy the front end and back end.** The front end is built against the new instance's URL and copied to the bucket. The back end is built, packed, unpacked by Ansible and started under pm2, and Ansible installs a node exporter beside it.
7. **Smoke test.** The back end's `/api/status` must answer `ok`, and the front end must serve the app from its S3 URL.
8. **Promote.** A CloudFormation stack repoints the CloudFront distribution at the new bucket. The new workflow id is exported, and the old one is read first.
9. **Clean up.** The previous release's bucket and both stacks are deleted.

Any job after the infrastructure exists ends with a `destroy-environment` step that removes the new stacks on failure, and most of them with `revert-migrations` as well.

## monitoring

The node exporter on the back end (port 9100) is scraped by a separate Prometheus server, with Alertmanager sending email. One rule, `InstanceDown`, fires when a target has been unreachable for a minute. The install steps and config files are in `prometheus-server/`.

## build and run

This runs in CircleCI rather than on a laptop. Once, before the first run:

- A public RDS Postgres database, and its details set as `TYPEORM_*` variables in CircleCI.
- AWS keys (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`) as CircleCI variables, and the EC2 key pair added as an SSH key.
- A first S3 bucket and a first CloudFront stack, created by running `cloudfront.yml` once by hand, so there is a `WorkflowID` export for the first promotion to replace.
- A kvdb.io bucket for the migration flag.

Then push to `main`. The twelve screenshots the project asked for (failed build, failed tests, failed audit, alert, rollbacks, promotion, cleanup, graphs) are in `instructions/screenshots/`, with the presentation.

## notes

- **Blue/green by workflow id.** Every release gets its own stacks, and CloudFront is the switch, so a bad release never touches the live one.
- **Fixed waits.** The Ansible play waits 10 minutes for a new instance and the smoke test waits a minute. Slow but simple; polling would be better.
- **Open ports.** The back end's security group opens 22, 3030 and 9100 to the world. Fine for a course project, too open for anything else.
- **Prometheus helpers.** The files in `prometheus-server/` follow a helper set credited to Olatunde Babawale in that folder's README.
- **Old stack.** `circleci/node:13.8.0` images, Prometheus 2.38 and node exporter 0.17. Not migrated.
