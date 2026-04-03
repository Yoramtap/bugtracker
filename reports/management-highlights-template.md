# Management Highlights Template

Use this format for sprint-to-sprint management updates.

## Style Rules

- Keep UAT and bug backlog as one concise bullet each.
- Keep business unit and team names clickable inline.
- For development workflow breakdown, start with one plain-language intro line.
- Then use `Highlights` with short bullets for the main outliers only.
- Use `last month` vs `last year`.
- Round timing values and write them as `~17d`.
- Include `% lower` or `% higher` versus the last-year baseline.
- Name blockers without over-explaining them.
- Keep the tone factual and non-judgmental.

## Reusable Structure

### UAT

- Broadcast UAT is concentrated in [Business Unit A](LINK) at X.X months (N items), [Business Unit B](LINK) at X.X months (N items), [Business Unit C](LINK) at X.X months (N items), and [Business Unit D](LINK) at X.X months (N items).

### Bugs

- Bug backlog remains concentrated in [Team A](LINK), which is now X bugs, up/down Y vs the previous sprint and up/down Z across the last 10 sprints; N of those are Highest/High priority. [Team B](LINK) is at X open bugs, while [Team C](LINK) is at X, [Team D](LINK) at X, [Team E](LINK) at X, and [Team F](LINK) at X.

### Development Workflow Breakdown

Development workflow breakdown compares average time work spends in Progress, In Review and QA.

Highlights

- Team A is at ~Xd in the last month versus ~Yd over the last year, which is ~Z% lower/higher. The main blockers in the current window are BLOCKER_A and BLOCKER_B.
- Team B is at ~Xd in the last month versus ~Yd over the last year, which is ~Z% lower/higher. The main blocker in the current window is BLOCKER_A, with BLOCKER_B also contributing.
- Team C is at ~Xd in the last month versus ~Yd over the last year, which is ~Z% lower/higher. The main blocker in the current window is BLOCKER_A, with little to no QA delay.

## Reference Example (2026-03-27)

### UAT

- Broadcast UAT is concentrated in four business units that are still above the 1-month target: [Tech Debt](https://nepgroup.atlassian.net/issues/?jql=issueKey+in+%28TFC-14540%29+ORDER+BY+updated+DESC) at 3.5 months (1 item), [MEA](https://nepgroup.atlassian.net/issues/?jql=issueKey+in+%28TFC-15925%29+ORDER+BY+updated+DESC) at 1.6 months (1 item), [EU](https://nepgroup.atlassian.net/issues/?jql=issueKey+in+%28TFC-16084%2CTFC-11526%29+ORDER+BY+updated+DESC) at 1.6 months (2 items), and [US](https://nepgroup.atlassian.net/issues/?jql=issueKey+in+%28TFC-14425%2CTFC-16087%2CTFC-13224%2CTFC-16073%29+ORDER+BY+updated+DESC) at 1.4 months (4 items).

### Bugs

- Bug backlog remains concentrated in [BC](https://nepgroup.atlassian.net/issues/?jql=project+%3D+TFC+AND+type+%3D+Bug+AND+labels+%3D+Broadcast+ORDER+BY+priority+DESC%2C+updated+DESC), which is now at 222 bugs, up 9 vs the previous sprint and up 36 across the last 10 sprints; 90 of those are Highest/High priority. [Legacy FE](https://nepgroup.atlassian.net/issues/?jql=project+%3D+TFC+AND+type+%3D+Bug+AND+labels+%3D+Frontend+ORDER+BY+priority+DESC%2C+updated+DESC) is down to 31 open bugs, while [API](https://nepgroup.atlassian.net/issues/?jql=project+%3D+TFC+AND+type+%3D+Bug+AND+labels+%3D+API+ORDER+BY+priority+DESC%2C+updated+DESC) is at 15, [React FE](https://nepgroup.atlassian.net/issues/?jql=project+%3D+TFC+AND+type+%3D+Bug+AND+labels+%3D+%22NewFrontend%22+ORDER+BY+priority+DESC%2C+updated+DESC) at 6, [Workers](https://nepgroup.atlassian.net/issues/?jql=project+%3D+TFO+AND+type+%3D+Bug+AND+labels+%3D+Workers+ORDER+BY+priority+DESC%2C+updated+DESC) at 2, and [Titanium](https://nepgroup.atlassian.net/issues/?jql=project+%3D+MESO+AND+type+%3D+Bug+AND+labels+%3D+%22READY%22+ORDER+BY+priority+DESC%2C+updated+DESC) at 2.

### Development Workflow Breakdown

Development workflow breakdown compares average time work spends in Progress, In Review and QA.

Highlights

- BC is at ~17d in the last month versus ~30d over the last year, which is ~44% lower. The main blockers in the current window are In Progress and QA.
- API is at ~13d in the last month versus ~8d over the last year, which is ~57% higher. The main blocker in the current window is In Review, with QA also contributing.
- Workers is at ~5d in the last month versus ~30d over the last year, which is ~83% lower. The main blocker in the current window is In Review, with little to no QA delay.
