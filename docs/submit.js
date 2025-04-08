netlifyIdentity.on('init', user => {
	updateUser(user);
});

netlifyIdentity.on('login', user => {
	updateUser(user);
	netlifyIdentity.close();
});

function updateUser(user) {
	const status = document.getElementById('userStatus');
	if (user) {
		status.innerText = `Logged in as: ${user.user_metadata.full_name}`;
	} else {
		status.innerText = 'Not logged in';
	}
}

document.getElementById('socialForm').onsubmit = async (e) => {
	e.preventDefault();

	const user = netlifyIdentity.currentUser();
	if (!user) return alert("Login with GitHub first.");

	const captcha = hcaptcha.getResponse();
	if (!captcha) return alert("Complete captcha first");

	const name = document.getElementById('name').value.trim().replace(/\s+/g, '_');

	const payload = {
		user: user.user_metadata,
		token: user.token.access_token,
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

	const res = await fetch('/.netlify/functions/createIssue', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	if (res.ok) {
		alert("Submitted!");
		hcaptcha.reset();
	} else {
		alert("Submission failed.");
	}
};
