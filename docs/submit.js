document.addEventListener('DOMContentLoaded', function () {
	const socialForm = document.getElementById('socialForm');
	const inputs = document.querySelectorAll('input[type="text"], textarea');

	let allowed_URLs = [];
	let name_URLs = [];

	const allowed_URLs_url = 'https://raw.githubusercontent.com/somerandomscripts/WF-social-data/refs/heads/main/rules/allowed_URLs.json';
	const name_URLs_url = 'https://raw.githubusercontent.com/somerandomscripts/WF-social-data/refs/heads/main/rules/name_URLs.json';

	// Fetch allowed domains
	fetch(allowed_URLs_url)
		.then(res => res.json())
		.then(data => allowed_URLs = data)
		.catch(err => {
			console.error("Failed to load allowed_URLs.json:", err);
			alert("Could not load allowed URL list.");
		});

	// Fetch name-specific URLs
	fetch(name_URLs_url)
		.then(res => res.json())
		.then(data => name_URLs = data)
		.catch(err => {
			console.error("Failed to load name_URLs.json:", err);
			alert("Could not load name URL list.");
		});

	// Re-validate entire form every time focus leaves any field
	inputs.forEach(input => {
		input.addEventListener('blur', () => {
			validateAllFields();
		});
	});

	socialForm.onsubmit = async function (e) {
		e.preventDefault();
		validateAllFields();

		// Stop submission if any errors still exist
		const hasErrors = document.querySelectorAll('.error-messages-container span').length > 0;
		if (hasErrors) {
			alert("Please fix the issues before submitting.");
			return;
		}

		// Gather valid data
		let formData = {};
		inputs.forEach(input => {
			const val = input.value.trim();
			if (val) formData[input.id] = val;
		});

		const res = await fetch('/.netlify/functions/createIssue', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		});

		const result = await res.json();
		alert(result.message);
	};

	function validateAllFields() {
		// Clear all existing errors
		inputs.forEach(input => hideError(input));

		// Build map of normalized URLs
		const urlMap = {};
		inputs.forEach(input => {
			const val = input.value.trim();
			if (!val) return;
			const normalized = val.startsWith('http') ? val : 'https://' + val;
			urlMap[input.id] = normalized;
		});

		// Track duplicate groups
		const reverseMap = {};
		Object.entries(urlMap).forEach(([id, url]) => {
			if (!reverseMap[url]) reverseMap[url] = [];
			reverseMap[url].push(id);
		});

		let dupCount = 1;
		Object.entries(reverseMap).forEach(([url, ids]) => {
			if (ids.length > 1) {
				ids.forEach(dupId => {
					const field = document.getElementById(dupId);
					showError(field, `Duplicate set ${dupCount}`, "duplicated");
				});
				dupCount++;
			}
		});

		// Validate disallowed/broken
		inputs.forEach(input => {
			const val = input.value.trim();
			if (!val) return;
			const url = val.startsWith('http') ? val : 'https://' + val;

			try {
				const domain = new URL(url).hostname;

				if (input.id === 'name') {
					if (!name_URLs.some(base => url.includes(base))) {
						showError(input, "Disallowed URL", "disallowed");
					}
				} else {
					if (!allowed_URLs.some(base => domain.includes(base))) {
						showError(input, "Disallowed or broken URL", "broken");
					}
				}
			} catch (err) {
				showError(input, "Disallowed or broken URL", "broken");
			}
		});
	}

	function showError(input, message, type) {
		let container = input.nextElementSibling;
		if (!container || !container.classList.contains('error-messages-container')) {
			container = document.createElement('div');
			container.classList.add('error-messages-container');
			input.parentNode.insertBefore(container, input.nextSibling);
		}

		// Prevent duplicate messages
		const existing = [...container.children].find(el => el.textContent === message);
		if (existing) return;

		const error = document.createElement('span');
		error.classList.add('error-message', type);
		error.textContent = message;
		container.appendChild(error);
	}

	function hideError(input) {
		const container = input.nextElementSibling;
		if (container && container.classList.contains('error-messages-container')) {
			container.remove();
		}
	}
});
