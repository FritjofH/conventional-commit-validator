const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const TASK_TYPES = core.getInput('task_types') || 'feat,fix,docs,test,ci,refactor,perf,chore,revert,build,style';
    const CC_PATTERN = new RegExp(`^(${TASK_TYPES.split(',').join('|')})\\s*(?:\\(([^)]+)\\))?: .+`);  

    const ADD_LABEL = core.getInput('add_label') === 'true';
    const ADD_SCOPE_LABEL = core.getInput('add_scope_label') === 'true';
    const CUSTOM_LABELS = JSON.parse(core.getInput('custom_labels') || '{"feat":"feature","docs":"documentation","ci":"CI/CD","perf":"performance"}');

    const LINK_ON_FAILURE = core.getInput('link_on_failure' || undefined);

    const token = core.getInput('GITHUB_TOKEN');
    const octokit = github.getOctokit(token);

    const { context } = github;
    const prNumber = context.payload.pull_request.number;
    const baseBranch = context.payload.pull_request.base.ref;
    
    if (baseBranch !== 'master' && baseBranch !== 'main') {
      core.info('Skipping check as the PR is not targeting master or main.');
      return;
    }

    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
    });

    let commitTypes = new Set();
    let scopeLabels = new Set();
    commits.forEach(commit => {
      const match = commit.commit.message.match(CC_PATTERN);
      if (match) {
        core.info("commit (sha): " + commit.sha + " follows the convention");
        commitTypes.add(match[1]);
        if (ADD_SCOPE_LABEL && match[2]) {
          scopeLabels.add(match[2]);
        }
      }
    });

    const allCommitsValid = commitTypes.size > 0 && commitTypes.size === commits.length;

    const prTitle = context.payload.pull_request.title;
    const prMatch = prTitle.match(CC_PATTERN);
    const prTitleValid = prMatch !== null;

    let badPR = true;

    if (allCommitsValid) {
      badPR = false;
      core.info('All commit messages follow the Conventional Commits standard.');
    }
    
    if (prTitleValid) {
      badPR = false;
      commitTypes.add(prMatch[1]);
      if (ADD_SCOPE_LABEL && prMatch[2]) {
        scopeLabels.add(prMatch[2]);
      }
      core.info('PR title follows the Conventional Commits standard.');
    }
    
    if (badPR) {
      var errorMessage = 'Neither commit messages nor PR title follow the Conventional Commits standard.';
      if (LINK_ON_FAILURE) {
        errorMessage += ("\nRead more here: " + LINK_ON_FAILURE);
      }
      core.setFailed(errorMessage);
      return;
    }

    let labelsToAdd = [];
    if (ADD_LABEL && commitTypes.size > 0) {
      commitTypes.forEach(type => {
        labelsToAdd.push(CUSTOM_LABELS[type] || type);
      });
    }
    if (ADD_SCOPE_LABEL && scopeLabels.size > 0) {
      scopeLabels.forEach(type => {
        labelsToAdd.push(CUSTOM_LABELS[type] || type);
      });
    }

    if (labelsToAdd.length > 0) {
      let uniqueLabels = [...new Set(labelsToAdd)]
      await octokit.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        labels: uniqueLabels
      });
      core.info(`Added labels: ${uniqueLabels.join(', ')}`);
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();

module.exports = { run };
