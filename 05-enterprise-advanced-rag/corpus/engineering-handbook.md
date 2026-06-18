# Engineering Handbook

## Development Workflow
1. Create a feature branch from `main`
2. Write tests for your changes (TDD encouraged)
3. Implement the feature
4. Run the full test suite locally
5. Submit a pull request with a clear description
6. Address code review feedback
7. Merge after approval and passing CI

## Code Review Standards
- All code must be reviewed by at least one other engineer
- PRs should be reviewed within 24 hours
- Focus on correctness, readability, security, and performance
- Be constructive and respectful in feedback

## Testing Requirements
- Unit test coverage must be at least 80%
- Integration tests for all API endpoints
- End-to-end tests for critical user flows
- All tests must pass before merging

## Deployment
- Deployments happen Monday-Thursday (no Friday deploys except emergencies)
- Stage changes to the staging environment first
- Monitor error rates and performance after deployment
- Be ready to rollback if issues arise

## On-Call Rotation
Engineers participate in a weekly on-call rotation. Respond to pages within 15 minutes and escalate if needed.

## Technical Standards
- Follow the language-specific style guide (ESLint for JS/TS, Black for Python)
- Document all public APIs and complex logic
- Prefer simple, maintainable solutions over clever code
- Security review required for authentication, authorization, and data handling changes
