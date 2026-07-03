# Changelog

## [0.8.2](https://github.com/vesperp4/mono/compare/portal-api-v0.8.1...portal-api-v0.8.2) (2026-07-03)


### Bug Fixes

* **portal-api:** close email enumeration, fail closed on missing ACS, handle SIGTERM ([#199](https://github.com/vesperp4/mono/issues/199)) ([f610c72](https://github.com/vesperp4/mono/commit/f610c72881c21bd8c1dfb798678c7e434ea3fa62))

## [0.8.1](https://github.com/vesperp4/mono/compare/portal-api-v0.8.0...portal-api-v0.8.1) (2026-07-03)


### Bug Fixes

* **portal-api:** add process-only /livez endpoint for liveness ([#193](https://github.com/vesperp4/mono/issues/193)) ([bbce7bd](https://github.com/vesperp4/mono/commit/bbce7bd2ef12fbb9b5d404d363656f0bfdf7c35f))
* **portal-api:** key rate limiter on the trusted X-Forwarded-For hop ([#192](https://github.com/vesperp4/mono/issues/192)) ([93ff47b](https://github.com/vesperp4/mono/commit/93ff47b48ba8c14955a33701e0341634b4bd18c6))

## [0.8.0](https://github.com/vesperp4/mono/compare/portal-api-v0.7.0...portal-api-v0.8.0) (2026-07-03)


### Features

* **portal-api:** authenticated member endpoints — GET/PATCH /members/me ([#180](https://github.com/vesperp4/mono/issues/180)) ([a2d35f1](https://github.com/vesperp4/mono/commit/a2d35f1c8eaf8f17273bb5e223743fdcf15ae950))
* **portal-api:** per-IP rate limiting on public email endpoints ([#181](https://github.com/vesperp4/mono/issues/181)) ([7449608](https://github.com/vesperp4/mono/commit/7449608130512180ce03be9af6cf008bd7fedf5c))

## [0.7.0](https://github.com/vesperp4/mono/compare/portal-api-v0.6.0...portal-api-v0.7.0) (2026-07-02)


### Features

* **portal:** sign-in — Microsoft OIDC (PUPR tenant) + magic link + sessions ([#171](https://github.com/vesperp4/mono/issues/171)) ([#177](https://github.com/vesperp4/mono/issues/177)) ([a9ab22f](https://github.com/vesperp4/mono/commit/a9ab22f986b1c53709ad4dd159a703f1e8504655))

## [0.6.0](https://github.com/vesperp4/mono/compare/portal-api-v0.5.0...portal-api-v0.6.0) (2026-06-17)


### Features

* **portal-api:** send verification email via Azure Communication Services ([#139](https://github.com/vesperp4/mono/issues/139)) ([d54a1fe](https://github.com/vesperp4/mono/commit/d54a1fe4fcda747f90b0a00591f320661038a29b))

## [0.5.0](https://github.com/vesperp4/mono/compare/portal-api-v0.4.1...portal-api-v0.5.0) (2026-06-17)


### Features

* **portal-api:** refresh the Entra DB token for long-lived replicas ([#136](https://github.com/vesperp4/mono/issues/136)) ([a654254](https://github.com/vesperp4/mono/commit/a654254e32cad6a2d337df240891581eb47e470b))

## [0.4.1](https://github.com/vesperp4/mono/compare/portal-api-v0.4.0...portal-api-v0.4.1) (2026-06-17)


### Bug Fixes

* **portal-api:** pin Docker builder to bookworm to match runtime glibc ([#134](https://github.com/vesperp4/mono/issues/134)) ([3aa72bb](https://github.com/vesperp4/mono/commit/3aa72bb0bd76224b412d07d5aefbe437658b50b0))

## [0.4.0](https://github.com/vesperp4/mono/compare/portal-api-v0.3.0...portal-api-v0.4.0) (2026-06-17)


### Features

* **portal-api:** passwordless Entra Postgres auth ([#132](https://github.com/vesperp4/mono/issues/132)) ([84b631e](https://github.com/vesperp4/mono/commit/84b631efb90f41ebbc6a5e1dbc26acb833d7b37b))

## [0.3.0](https://github.com/vesperp4/mono/compare/portal-api-v0.2.2...portal-api-v0.3.0) (2026-06-17)


### Features

* **portal:** split into portal-api + portal-web; members join/verify ([#123](https://github.com/vesperp4/mono/issues/123)) ([f2762b1](https://github.com/vesperp4/mono/commit/f2762b1347e58f64cc0538e53dc3723233284cdf))


### Bug Fixes

* sync main into dev to resolve merge conflicts ([#27](https://github.com/vesperp4/mono/issues/27)) ([1301fd3](https://github.com/vesperp4/mono/commit/1301fd3ddbf4016ea22dcc09c44c19cff4b88978))

## [0.2.2](https://github.com/vesperp4/mono/compare/mainsite-api-v0.2.1...mainsite-api-v0.2.2) (2026-06-17)


### Bug Fixes

* sync main into dev to resolve merge conflicts ([#27](https://github.com/vesperp4/mono/issues/27)) ([1301fd3](https://github.com/vesperp4/mono/commit/1301fd3ddbf4016ea22dcc09c44c19cff4b88978))

## [0.2.1](https://github.com/vesperp4/mono/compare/vesperp4-api-v0.2.0...vesperp4-api-v0.2.1) (2026-06-16)


### Bug Fixes

* **website-api:** commit Cargo.lock to unblock release image build ([#109](https://github.com/vesperp4/mono/issues/109)) ([6b74a8c](https://github.com/vesperp4/mono/commit/6b74a8c9b95aad4c7082463845a5652f3b541da1))

## [0.2.0](https://github.com/vesperp4/mono/compare/vesperp4-api-v0.1.0...vesperp4-api-v0.2.0) (2026-06-16)


### Features

* **ci:** containerized Rust API + trunk-based CI/CD pipeline ([#99](https://github.com/vesperp4/mono/issues/99)) ([485b64b](https://github.com/vesperp4/mono/commit/485b64b46f7139c064d586eab8082331e91ddd37))


### Bug Fixes

* sync main into dev to resolve merge conflicts ([#27](https://github.com/vesperp4/mono/issues/27)) ([1301fd3](https://github.com/vesperp4/mono/commit/1301fd3ddbf4016ea22dcc09c44c19cff4b88978))
