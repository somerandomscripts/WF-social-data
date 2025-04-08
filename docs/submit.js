document.getElementById('socialForm').onsubmit = async (e) => {
	e.preventDefault();

	const captcha = hcaptcha.getResponse();
	if (!captcha) return alert("Complete captcha first");

	const name = document.getElementById('name').value.trim().replace(/\s+/g, '_');

	const data = {
		[name]: [
			document.getElementById('fb').value.trim(),
			document.getElementById('ig').value.trim(),
			document.getElementById('x').value.trim(),
			document.getElementById('tt').value.trim(),
			document.getElementById('of').value.trim()
		]
	};

	const body = {
		title: `Social update: ${name}`,
		body: "Auto-submitted WF social data\n\n```json\n" + JSON.stringify(data, null, 2) + "\n```",
		labels: ["submission"],
	};

	const res = await fetch('https://api.github.com/repos/somerandomscripts/WF-social-data/issues', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer '
		},
		body: JSON.stringify(body)
	});

	if (res.ok) {
		alert("Submitted! Thank you.");
		hcaptcha.reset();
	} else {
		alert("Submission failed.");
	}
};
