document.addEventListener('DOMContentLoaded', function() {
    const socialForm = document.getElementById('socialForm');
    const inputs = document.querySelectorAll('input[type="text"]');  // Get all text inputs

    // List of valid domains
    const approvedDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'onlyfans.com'];

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

        inputs.forEach(input => {
            const url = input.value.trim();
            if (url) {
                let normalizedUrl = url.startsWith('http') ? url : 'https://' + url;  // Ensure valid URL format
                if (isValidUrl(normalizedUrl, approvedDomains)) {
                    validUrls.push(normalizedUrl);
                    formData[input.id] = normalizedUrl;  // Add to form data
                } else {
                    issuesFound.push(`Invalid URL in ${input.placeholder}`);
                    showError(input, "Disallowed or broken URL");
                }
            } else {
                hideError(input);  // Hide error if input is empty
            }
        });

        // If any issues are found, prevent submission
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

    // Real-time URL validation function
    function validateUrl(input) {
        const url = input.value.trim();
        if (url) {
            let normalizedUrl = url.startsWith('http') ? url : 'https://' + url;  // Ensure valid URL format
            if (isValidUrl(normalizedUrl, approvedDomains)) {
                hideError(input);  // Hide error if URL is valid
            } else {
                showError(input, "Disallowed or broken URL");
            }
        } else {
            hideError(input);  // Hide error if input is empty
        }
    }

    // Function to check if URL is valid
    function isValidUrl(url, approvedDomains) {
        const domain = new URL(url).hostname;
        return approvedDomains.some(approvedDomain => domain.includes(approvedDomain));
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
