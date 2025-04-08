const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event) {
	const { data, user, token, captcha } = JSON.parse(event.body);

	if (!captcha || !data) {
		return {
			statusCode: 400,
			body: 'Missing fields'
		};
	}

	const name = Object.keys(data)[0];
	const issueTitle = `Social update: ${name}`;
	const author = user ? `${user.full_name} (${user.email})` : 'Anonymous';
	const issueBody = `Submitter: ${author}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

	const response = await fetch('https://api.github.com/repos/somerandomscripts/WF-social-data/issues', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
			'User-Agent': 'wf-submission-bot'
		},
		body: JSON.stringify({
			title: issueTitle,
			body: issueBody,
			labels: ['submission']
		})
	});

	if (!response.ok) {
		const text = await response.text();
		return { statusCode: 500, body: `GitHub API failed: ${text}` };
	}

	return {
		statusCode: 200,
		body: 'Issue created successfully'
	};
};
