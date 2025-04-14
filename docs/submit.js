document.getElementById('socialForm').onsubmit = async function (e) {
    e.preventDefault();

    // Your approved URLs list (this could also be fetched from a server if needed)
    const approvedDomains = ['facebook.com', 'instagram.com']; 

    let validUrls = [];
    let invalidUrls = [];
    let issuesFound = [];

    const socialLinks = [
        document.getElementById('fb').value.trim(),
        document.getElementById('ig').value.trim(),
        document.getElementById('x').value.trim(),
        document.getElementById('tt').value.trim(),
        document.getElementById('of').value.trim()
    ];

    // Normalize URLs and check
    socialLinks.forEach(link => {
        if (!link) return; // Skip empty links

        let normalizedUrl = link.startsWith('http') ? link : 'https://' + link; // Ensure valid URL format

        // Check if URL is valid and belongs to the allowed domains
        if (isValidUrl(normalizedUrl, approvedDomains)) {
            validUrls.push(normalizedUrl);
        } else {
            invalidUrls.push(normalizedUrl);
            issuesFound.push("Disallowed or broken URL: " + normalizedUrl);
        }
    });

    // If issues were found, show alerts and don't submit
    if (issuesFound.length > 0) {
        alert("Issues found with the following URLs:\n\n" + issuesFound.join("\n"));
        return;
    }

    // Otherwise, submit valid URLs
    const formData = {
        [document.getElementById('name').value.trim()]: validUrls
    };

    // Send the data to the server (Netlify function)
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

function isValidUrl(url, approvedDomains) {
    const domain = new URL(url).hostname;
    return approvedDomains.some(approvedDomain => domain.includes(approvedDomain));
}
