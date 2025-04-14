document.addEventListener('DOMContentLoaded', function() {
    const socialForm = document.getElementById('socialForm');
    const inputs = document.querySelectorAll('input[type="text"]');  // Get all text inputs

    // Define the allowed domain rule for the name field at the top
    const nameFieldDomainPattern = 'wikifeet*.com';  // This is the pattern for the name field URL
    let allowed_URLs = [];  // Initialize allowed_URLs as an empty array for now

    // Fetch allowed URLs from GitHub (allowed_URLs.json)
    const allowedUrlsUrl = 'https://raw.githubusercontent.com/somerandomscripts/WF-social-data/refs/heads/main/rules/allowed_URLs.json';

    // Fetch the allowed domains from the GitHub file
    fetch(allowedUrlsUrl)
        .then(response => response.json())
        .then(data => {
            allowed_URLs = data;  // Populate allowed_URLs with the data from the file
        })
        .catch(error => {
            console.error('Error fetching allowed URLs:', error);
            alert('Failed to load allowed URLs.');
        });

    // Add event listeners for real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateUrl(input);
        });
    });

    // Validate all URLs when submitting the form
    socialForm.onsubmit = async function (e) {
        e.preventDefault();

        let validUrls = [];
        let issuesFound = [];
        let formData = {};

        // Validate the 'name' field for the wikifeet pattern
        const nameField = document.getElementById('name');
        const nameUrl = nameField.value.trim();
        if (nameUrl && !isValidNameUrl(nameUrl)) {
            issuesFound.push("The URL in the Name field must match the pattern 'wikifeet*.com'.");
            showError(nameField, "Invalid URL in Name field.");
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
                    if (isValidUrl(normalizedUrl, allowed_URLs)) {
                        // If URL is valid, add to form data
                        validUrls.push(normalizedUrl);
                        formData[input.id] = normalizedUrl;
                    } else {
                        issuesFound.push(`Invalid URL in ${input.placeholder}`);
                        showError(input, "Disallowed or broken URL");
                    }
                } else {
                    hideError(input);  // Hide error if input is empty
                }
            }
        });

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

    // Function to check if URL is valid for the name field (wikifeet*.com)
    function isValidNameUrl(url) {
        const regex = /^https?:\/\/(?:www\.)?wikifeet.*\.com\/?$/i;
        return regex.test(url);
    }

    // Real-time URL validation function
    function validateUrl(input) {
        const url = input.value.trim();
        if (input.id === 'name') {
            if (url && !isValidNameUrl(url)) {
                showError(input, "Invalid URL in Name field.");
            } else {
                hideError(input);
            }
        } else if (url) {
            let normalizedUrl = url.startsWith('http') ? url : 'https://' + url;
            if (isValidUrl(normalizedUrl, allowed_URLs)) {
                hideError(input);
            } else {
                showError(input, "Disallowed or broken URL");
            }
        } else {
            hideError(input);  // Hide error if input is empty
        }
    }

    // Function to check if URL is valid
    function isValidUrl(url, allowed_URLs) {
        const domain = new URL(url).hostname;
        return allowed_URLs.some(allowedDomain => domain.includes(allowedDomain));
    }

    // Function to show error message
    function showError(input, message) {
        let errorMessage = input.nextElementSibling;
        if (!errorMessage || !errorMessage.classList.contains('error-message')) {
            errorMessage = document.createElement('span');
            errorMessage.classList.add('error-message');
            input.parentNode.insertBefore(errorMessage, input.nextSibling);
        }
        errorMessage.textContent = message;
    }

    // Function to hide error message
    function hideError(input) {
        const errorMessage = input.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains('error-message')) {
            errorMessage.textContent = '';  // Clear error message
        }
    }
});
