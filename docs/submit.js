netlifyIdentity.on('init', updateUser);
netlifyIdentity.on('login', user => {
	updateUser(user);
	netlifyIdentity.close();
});
netlifyIdentity.on('logout', () => {
	updateUser(null);
});

function updateUser(user) {
	const status = document.getElementById('userStatus');
	if (user) {
		status.innerText = `Logged in as: ${user.user_metadata.full_name}`;
	} else {
		status.innerText = 'Not logged in';
	}
}

document.getElementById('socialForm').addEventListener('submit', async (e) => {
	e.preventDefault();

	const captcha = hcaptcha.getResponse();
	if (!captcha) return alert("Complete captcha first");

	const user = netlifyIdentity.currentUser(); // Safe to call here
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

	try {
		const res = await fetch('/.netlify/functions/createIssue', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (res.ok) {
			alert("Submitted!");
			hcaptcha.reset();
		} else {
			const error = await res.text();
			alert("Submission failed: " + error);
		}
	} catch (err) {
		alert("Error: " + err.message);
	}
});
