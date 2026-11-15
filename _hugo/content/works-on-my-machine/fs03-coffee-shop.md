---
title: "fs03-coffee-shop"
description: "a drink-menu app: ionic frontend, flask api, and auth0 role-based access for the public, baristas and managers."
weight: 4
featured: false
highlights:
  - "wrote the backend and the Auth0 JWT layer: bearer header parsing, RS256 verification against the tenant's JWKS, audience and issuer checks"
  - "role-based access (public, barista, manager) enforced per endpoint through a permission decorator"
  - "full CRUD API on Flask and SQLAlchemy (SQLite), with JSON error handlers"
stack: ["auth0", "ionic-framework", "python", "sqlalchemy", "flask", "sqlite", "jwt", "typescript"]
repo: "https://github.com/janymuong/fs03-coffee-shop"
---

## name

fs03-coffee-shop: a drink menu where what you can see and change depends on who you are.

## synopsis

A full-stack CRUD app for a cafe menu. Each drink is a title plus a recipe of coloured ingredient parts, which the frontend draws as a graphic.

- **public:** sees drink names and graphics.
- **barista:** also sees the recipe details.
- **manager:** can also create, edit and delete drinks.

A Udacity Full Stack Nanodegree project (identity and access management). The Ionic frontend came with the course; the backend auth and API are mine.

## architecture

```text
Ionic app ──login──▶ Auth0 ──JWT (with permissions)──▶ Ionic app
    │
    └── Authorization: Bearer <jwt> ──▶ Flask API
                                          │
                       @requires_auth('post:drinks')
                       1. read bearer token
                       2. verify RS256 signature via Auth0 JWKS
                       3. check audience + issuer
                       4. check permission in the token
                                          │
                                          ▼
                              SQLAlchemy ▶ SQLite
```

## endpoints

| route | permission | returns |
|---|---|---|
| `GET /drinks` | none | short form (colour, parts) |
| `GET /drinks-detail` | `get:drinks-detail` | long form (with ingredient names) |
| `POST /drinks` | `post:drinks` | the new drink |
| `PATCH /drinks/<id>` | `patch:drinks` | the updated drink |
| `DELETE /drinks/<id>` | `delete:drinks` | the deleted id |

Barista holds `get:drinks` and `get:drinks-detail`. Manager holds all five. The repo includes a Postman collection with public, barista and manager folders for testing each role.

## build and run

```bash
# backend
cd backend
pip install -r requirements.txt
cd src
export FLASK_APP=api.py FLASK_DEBUG=True
flask run --reload        # localhost:5000

# frontend
cd frontend
npm install
ionic serve               # localhost:8100
```

The frontend reads `src/environments/environment.ts` for the API URL and the Auth0 domain, audience and client id.

## notes

- **Auth0 setup.** a single-page application plus an API with RBAC and "add permissions in the access token" enabled. Without those, the token carries no permissions and the API answers 400.
- **Errors.** Missing or malformed header is 401, expired token is 401, missing permission is 403, unknown id is 404, bad body is 422.
- **Database resets on start.** `db_drop_and_create_all()` runs at import, so every restart wipes the drinks and re-seeds one `water` row.
- **Old stack.** Flask 2.2, SQLAlchemy 1.4, Ionic 4 and Angular 7. Not migrated.