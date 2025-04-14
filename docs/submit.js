document.addEventListener('DOMContentLoaded', function () {
    const socialForm = document.getElementById('socialForm');
    const inputs = document.querySelectorAll('input[type="text"], textarea');  // Get all text inputs and textareas

    let allowed_URLs = [];
    let name_URLs = [];

    // Fetch allowed URLs from GitHub (allowed_URLs.json)
    const allowed_URLs_url = 'https://raw.githubusercontent.com/somerandomscripts/WF-social-data/refs/heads/main/rules/allowed_URLs.json';
    // Fetch name URLs from GitHub (name_URLs.json)
    const name_URLs_url = 'https://raw.githubusercontent.com/somerandomscripts/WF-social-data/refs/heads/main/rules/name_URLs.json';

    // Fetch the allowed URLs (domains) from allowed_URLs.json
    fetch(allowed_URLs_url)
        .then(response => response.json())
        .then(data => {
            allowed_URLs = data;  // Populate allowed_URLs with the data from the file
        })
        .catch(error => {
            console.error('Error fetching allowed URLs:', error);
            alert('Failed to load allowed URLs.');
        });

    // Fetch the name URLs from name_URLs.json
    fetch(name_URLs_url)
        .then(response => response.json())
        .then(data => {
            name_URLs = data;  // Populate name_URLs with the data from the file
        })
        .catch(error => {
            console.error('Error fetching name URLs:', error);
            alert('Failed to load name URLs.');
        });

    // Add event listeners for real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateUrl(input);
        });
    });

    // Validate all URLs when submitting the form
    socialForm.onsubmit = async function (e) {
        e.preventDefault();

        let validUrls = [];
        let issuesFound = [];
        let formData = {};

        // Validate the 'name' field for the URLs in name_URLs.json
        const nameField = document.getElementById('name');
        const nameUrl = nameField.value.trim();
        if (nameUrl && !isValidNameUrl(nameUrl)) {
            issuesFound.push("The URL in the Name field must match one of the URLs in the name_URLs list.");
            showError(nameField, "Invalid URL in Name field.", "disallowed");
        } else {
            hideError(nameField);
            if (nameUrl) validUrls.push(nameUrl);  // If name URL is valid, add it
            formData[nameField.id] = nameUrl;
        }

        // Validate other fields
        inputs.forEach(input => {
            if (input.id !== 'name') {
                const url = input.value.trim();
                if (url) {
                    let normalizedUrl = url.startsWith('http') ? url : 'https://' + url;  // Ensure valid URL format
                    if (isValidUrl(normalizedUrl)) {
                        // If URL is valid, add to form data
                        validUrls.push(normalizedUrl);
                        formData[input.id] = normalizedUrl;
                    } else {
                        issuesFound.push(`Invalid URL in ${input.placeholder}`);
                        showError(input, "Disallowed or broken URL", "broken");
                    }
                } else {
                    hideError(input);  // Hide error if input is empty
                }
            }
        });

        // Check for duplicate URLs
        const duplicateGroups = checkForDuplicates(inputs);
        if (duplicateGroups.length > 0) {
            duplicateGroups.forEach((group, index) => {
                group.forEach(input => {
                    showError(input, `Duplicated URL ${index + 1}`, "duplicated");
                });
            });
        }

        // If any issues are found, prevent form submission
        if (issuesFound.length > 0) {
            alert("Please fix the following issues:\n\n" + issuesFound.join("\n"));
            return;  // Prevent form submission if there are errors
        }

        // Proceed with submitting the valid data
        const response = await fetch('/.netlify/functions/createIssue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        alert(result.message);
    };

    // Function to check if URL is valid for the name field (matching name_URLs list)
    function isValidNameUrl(url) {
        return name_URLs.some(validUrl => url.includes(validUrl));
    }

    // Real-time URL validation function
    function validateUrl(input) {
        const url = input.value.trim();
        if (input.id === 'name') {
            if (url && !isValidNameUrl(url)) {
                showError(input, "Invalid URL in Name field.", "disallowed");
            } else {
                hideError(input);
            }
        } else if (url) {
            let normalizedUrl = url.startsWith('http') ? url : 'https://' + url;
            if (isValidUrl(normalizedUrl)) {
                hideError(input);
            } else {
                showError(input, "Disallowed or broken URL", "broken");
            }
        } else {
            hideError(input);  // Hide error if input is empty
        }
    }

    // Function to check if URL is valid using the allowed_URLs
    function isValidUrl(url) {
        const domain = new URL(url).hostname;
        return allowed_URLs.some(allowedDomain => domain.includes(allowedDomain));
    }

    // Function to show error message
    function showError(input, message, errorType) {
        let errorMessagesContainer = input.nextElementSibling;
        if (!errorMessagesContainer || !errorMessagesContainer.classList.contains('error-messages-container')) {
            errorMessagesContainer = document.createElement('div');
            errorMessagesContainer.classList.add('error-messages-container');
            input.parentNode.insertBefore(errorMessagesContainer, input.nextSibling);
        }

        const errorMessage = document.createElement('span');
        errorMessage.classList.add('error-message');
        errorMessage.classList.add(errorType);  // Add the specific error type class (e.g., "duplicated", "broken", "disallowed")
        errorMessage.textContent = message;
        errorMessagesContainer.appendChild(errorMessage);
    }

    // Function to hide error message
    function hideError(input) {
        const errorMessagesContainer = input.nextElementSibling;
        if (errorMessagesContainer && errorMessagesContainer.classList.contains('error-messages-container')) {
            errorMessagesContainer.innerHTML = '';  // Clear all error messages
        }
    }

    // Function to check for duplicate URLs
    function checkForDuplicates(inputs) {
        const urlMap = {};
        const duplicateGroups = [];

        inputs.forEach(input => {
            const url = input.value.trim();
            if (url) {
                if (!urlMap[url]) {
                    urlMap[url] = [];
                }
                urlMap[url].push(input);
            }
        });

        // Group duplicates together
        for (let url in urlMap) {
            if (urlMap[url].length > 1) {
                duplicateGroups.push(urlMap[url]);
            }
        }

        return duplicateGroups;
    }
});
