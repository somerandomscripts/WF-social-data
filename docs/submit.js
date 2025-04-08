document.getElementById('socialForm').onsubmit = async (e) => {
	e.preventDefault();

	netlifyIdentity.ready.then(() => {
		const user = netlifyIdentity.currentUser();
		submitForm(user);
	});
};

function submitForm(user) {
	const captcha = hcaptcha.getResponse();
	if (!captcha) return alert("Complete captcha first");

	const name = document.getElementById('name').value.trim().replace(/\s+/g, '_');

	const payload = {
		user: user ? user.user_metadata : null,
		token: user ? user.token.access_token : null,
		captcha,
		data: {
			[name]: [
				document.getElementById('fb').value.trim(),
				document.getElementById('ig').value.trim(),
				document.getElementById('x').value.trim(),
				document.getElementById('tt').value.trim(),
				document.getElementById('of').value.trim()
			]
		}
	};

	fetch('/.netlify/functions/createIssue', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	}).then(res => {
		if (res.ok) {
			alert("Submitted!");
			hcaptcha.reset();
		} else {
			alert("Submission failed.");
		}
	});
}
