# Dot task: GitHub Pages + DataPipe + Google Drive

This version uses DataPipe experiment `wTirfo2dcMaM`. Its destination is the Google Drive location you selected in DataPipe. No Drive credentials belong in the task code.

## 1. Configure DataPipe before testing

Open your experiment in DataPipe. Confirm the Google Drive destination and turn on accepting data. Keep the destination folder private.

In validation settings, allow JSON. Remove the default `trial_type` required field and use these top-level fields instead:

```
schemaVersion, participantId, advisorCondition, rawData, processedData
```

Keep DataPipe condition assignment off: the task assigns its own condition. Leave Psych-DS metadata off for this initial setup. If you enable a session limit, allow enough submissions for tests, then adjust it before recruitment. Do not finalize the experiment while it is collecting data.

Official validation documentation: https://pipe.jspsych.org/docs/experiments/validation

## 2. Upload the prepared files to GitHub

Create a new public repository, for example `ai-trust-task`. Upload the CONTENTS of this prepared folder into the repository root, preserving the subfolders. Upload extracted files, not the ZIP itself. You should see:

```
index.html
DotTask/
src/
style/
assets/
LICENSE
README_SETUP.md
.nojekyll
```

The prepared folder excludes the old PHP endpoint, old Oxford consent page, backups, and participant data. Do not upload those separately.

In repository Settings > Pages, choose Deploy from a branch, select `main` and `/(root)`, and Save. When deployment finishes, GitHub displays the published address. A custom purchased domain is unnecessary.

Official publishing instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 3. Test the published task

Open your published address with `DotTask/?consent=true` appended. For example, if the site address is `https://YOUR-USERNAME.github.io/ai-trust-task/`, test at:

```
https://YOUR-USERNAME.github.io/ai-trust-task/DotTask/?consent=true
```

This flag is for researcher tests or the redirect after Qualtrics consent; it is not a consent form or proof of consent. Keep the actual consent record in Qualtrics. Opening the task without the flag displays a message asking the participant to start with the survey. Refreshing removes the entry parameters and does not resume a run; start a fresh test from the original link.

Complete the task and its final comment form. The saving screen should confirm receipt. In DataPipe and Google Drive, verify that ONE new `dot-task_<random-id>.json` file arrived. Open it and check the condition, 440 trials (40 practice and 400 main), initial/final answers and confidence, advisor answers/correctness, trust ratings, and final comments. Also test all four conditions over multiple test runs and check images/layout on the intended participant browser.

A queued response means DataPipe accepted the file but has not delivered it to Drive yet. Check the queue and Drive before recruiting. The retry screen means upload success was not confirmed. A duplicate filename error after a lost network response needs researcher verification in Drive; the code deliberately does not treat it as proof of success.

## 4. Add Prolific and Qualtrics when ready

After creating your Prolific study, copy YOUR completion URL into `completionURL` in `src/studyConfig.js`, keeping quotation marks. Commit the updated file to GitHub. Until then the final screen says that no Prolific return link is configured.

Configure Qualtrics to capture `PROLIFIC_PID`, `STUDY_ID`, and `SESSION_ID` as embedded data from its entry URL. Its end-of-survey redirect should pass those same values to your published DotTask address along with `consent=true`. Use Qualtrics URL-encoded piped text for each value. Do not put questionnaire answers in the URL. The intended flow is Prolific -> Qualtrics consent and questionnaire -> dot task -> confirmed saving -> Prolific.

The task saves SHA-1(PROLIFIC_PID) as `participantId`, the study ID, and SHA-1(SESSION_ID) as `recruitment.sessionIdHash`. To merge with Qualtrics, compute the same SHA-1 hash of its Prolific ID. IDs are coded, not anonymous. Test this matching with synthetic IDs before recruitment. No-ID researcher runs are labelled `local-test`.

## What changed and what is saved

- Direct DataPipe upload replaces the PHP request; one JSON file contains raw governor data and processed data, including trust ratings.
- Saving occurs after the final comment form. There is no partial-progress upload: a participant who closes the task before then leaves no cloud submission.
- Upload failures retain the payload in the open page, offer retry with the same filename, and allow a local backup download. Do not close/refresh a failed upload page before resolving it.
- A Prolific return link appears only after DataPipe confirms stored (201) or accepted/queued (202).
- The trial settings are restored to two practice blocks of 20 and ten main blocks of 40. The three guided responses count toward the first practice block's 20.
- Advisor probabilities remain 90% and 60%. The first practice block has no advice; the second and all main blocks use the assigned advisor.
- Existing trust timing is preserved: one before advice starts and ten after main blocks. There are no new after-practice trust measures.
- The old Oxford consent redirect is replaced by the Qualtrics entry check; the old completion code is removed. The end screen confirms saving instead of showing legacy performance charts.
- Internet access is needed for the existing externally hosted jsPsych scripts as well as DataPipe.

Local automated checks passed for trial/timeline counts, advisor reliability, saved trust fields, successful/queued uploads, network/rejection errors, retry payload consistency, and duplicate-call prevention. These used simulated responses. A real upload to your DataPipe/Drive destination and a published-browser pilot are still required; neither has been verified yet.
