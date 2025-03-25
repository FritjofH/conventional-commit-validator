const core = require('@actions/core');
const github = require('@actions/github');
const { run } = require('./index');

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('GitHub Action - Conventional Commit Check', () => {
    let octokitMock;

    beforeEach(() => {
        jest.clearAllMocks();

        core.getInput.mockImplementation((name) => {
            const inputs = {
                'task_types': 'feat,fix,docs,test,ci,refactor,perf,chore,build,style,ops',
                'add_label': 'true',
                'add_scope_label': 'true',
                'GITHUB_TOKEN': 'test-token',
                'link_on_failure': "confluence.com"
            };
            return inputs[name];
        });

        octokitMock = {
            rest: {
                pulls: {
                    listCommits: jest.fn(),
                    update: jest.fn(),
                },
                issues: {
                    addLabels: jest.fn(),
                },
            },
        };
        github.getOctokit.mockReturnValue(octokitMock);
    });

    test('skips check if PR is not targeting master', async () => {
        github.context.payload = {
            pull_request: {
                base: { ref: 'develop' },
            },
        };

        await run();
        expect(core.info).toHaveBeenCalledWith('Skipping check as the PR is not targeting master or main.');
    });

    test('passes when the correct message but bad title is used', async () => {
        github.context = {
            payload: {
                pull_request: {
                    number: 1,
                    base: { ref: 'master' },
                    title: 'removed trailing whitespace',
                },
            },
            repo: {
                owner: 'test-owner',
                repo: 'test-repo',
            },
        };

        octokitMock.rest.pulls.listCommits.mockResolvedValue({
            data: [
                { commit: { message: 'style (whitespace): removed trailing whitespace' } }
            ]
        });

        await run();
        expect(core.info).toHaveBeenCalledWith('All commit messages follow the Conventional Commits standard.');
    });


    test('passes when the invalid message but good title is used', async () => {
        github.context = {
            payload: {
                pull_request: {
                    number: 1,
                    base: { ref: 'master' },
                    title: 'style (whitespace): removed trailing whitespace',
                },
            },
            repo: {
                owner: 'test-owner',
                repo: 'test-repo',
            },
        };

        octokitMock.rest.pulls.listCommits.mockResolvedValue({
            data: [
                { commit: { message: 'removed trailing whitespace' } }
            ]
        });

        await run();
        expect(core.info).toHaveBeenCalledWith('PR title follows the Conventional Commits standard.');
    });

    test('fails when commit messages and PR title do not follow Conventional Commits', async () => {
        github.context = {
            payload: {
                pull_request: {
                    number: 1,
                    base: { ref: 'master' },
                    title: 'Invalid title',
                },
            },
            repo: {
                owner: 'test-owner',
                repo: 'test-repo',
            },
        };

        octokitMock.rest.pulls.listCommits.mockResolvedValue({
            data: [
                { commit: { message: 'invalid commit message' } }
            ]
        });

        await run();
        expect(core.setFailed).toHaveBeenCalledWith('Neither commit messages nor PR title follow the Conventional Commits standard.\nRead more here: confluence.com');
    });

    test('adds labels when commits follow Conventional Commits', async () => {
        github.context = {
            payload: {
                pull_request: {
                    number: 1,
                    base: { ref: 'master' },
                    title: 'feat(core): add new feature',
                },
            },
            repo: {
                owner: 'test-owner',
                repo: 'test-repo',
            },
        };

        octokitMock.rest.pulls.listCommits.mockResolvedValue({
            data: [
                { commit: { message: 'fix(login): resolve bug' } }
            ]
        });

        await run();
        expect(octokitMock.rest.issues.addLabels).toHaveBeenCalledWith({
            owner: 'test-owner',
            repo: 'test-repo',
            issue_number: 1,
            labels: ['fix', 'feature', 'login', 'core'],
        });
    });
});
