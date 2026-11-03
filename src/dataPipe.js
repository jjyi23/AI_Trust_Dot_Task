import {studyConfig} from './studyConfig.js';

// Upload state is kept outside the governor and never included in its JSON.
const uploads = new WeakMap();
function submissionFor(governor) {
    if (!uploads.has(governor)) {
        const compiled = governor.compileSelf();
        const payload = {
            schemaVersion: 1,
            participantId: governor.participantId,
            advisorCondition: governor.advisorCondition,
            rawData: JSON.parse(compiled.rawData),
            processedData: JSON.parse(compiled.processedData)
        };
        uploads.set(governor, {
            filename: 'dot-task_' + crypto.randomUUID() + '.json',
            data: JSON.stringify(payload), result: null, pending: null
        });
    }
    return uploads.get(governor);
}

export function uploadGovernor(governor) {
    const submission = submissionFor(governor);
    if (submission.result) return Promise.resolve(submission.result);
    if (submission.pending) return submission.pending;
    submission.pending = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 70000);
        try {
            const response = await fetch('https://pipe.jspsych.org/api/data/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    experimentID: studyConfig.dataPipeExperimentId,
                    filename: submission.filename,
                    data: submission.data
                }),
                signal: controller.signal
            });
            const body = await response.json();
            if ((response.status === 201 || response.status === 202) && !body.error) {
                submission.result = {status: response.status, filename: submission.filename};
                return submission.result;
            }
            const error = new Error(body.error || ('HTTP_' + response.status));
            error.code = body.error;
            throw error;
        } finally {
            clearTimeout(timeout);
            submission.pending = null;
        }
    })();
    return submission.pending;
}

export function showSaveScreen(governor) {
    document.body.style.backgroundColor = '';
    document.body.innerHTML = '<main style="max-width:800px;margin:60px auto;padding:24px;text-align:center">' +
        '<h1>Saving your responses</h1><p id="save-status" role="status" aria-live="polite"></p>' +
        '<button id="save-retry" hidden>Try saving again</button> ' +
        '<button id="save-backup" hidden>Download a backup</button>' +
        '<p id="save-completion"></p></main>';
    const status = document.getElementById('save-status');
    const retry = document.getElementById('save-retry');
    const backup = document.getElementById('save-backup');
    const completion = document.getElementById('save-completion');
    const preventLeaving = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventLeaving);
    backup.onclick = () => {
        const submission = submissionFor(governor);
        const url = URL.createObjectURL(new Blob([submission.data], {type: 'application/json'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = submission.filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const save = async () => {
        retry.hidden = true;
        backup.hidden = true;
        status.textContent = 'Please keep this page open while your responses are uploaded.';
        try {
            const result = await governor.exportGovernor();
            window.removeEventListener('beforeunload', preventLeaving);
            document.querySelector('main h1').textContent = 'Thank you';
            status.textContent = result.status === 202
                ? 'Your responses have been received and are queued for delivery.'
                : 'Your responses have been saved successfully.';
            if (governor.completionURL) {
                const link = document.createElement('a');
                link.href = governor.completionURL;
                link.textContent = 'Return to Prolific to complete your submission';
                completion.replaceChildren(link);
            } else {
                completion.textContent = 'Test complete. A Prolific return link has not been configured.';
            }
        } catch (error) {
            status.textContent = 'We could not confirm that your responses were saved. ' +
                'Keep this page open and try again. If the problem continues, download a backup ' +
                'and contact the researcher through Prolific. Reference: ' +
                (error.code || error.name || 'SAVE_ERROR') + '.';
            // Reuse the same filename and data. FILE_EXISTS is not confirmed success.
            retry.hidden = false;
            backup.hidden = false;
        }
    };
    retry.onclick = save;
    return save();
}
