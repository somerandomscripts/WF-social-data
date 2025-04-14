const fetch = require('node-fetch');

// Function to normalize URL
function normalizeUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

// Function to check if URL is valid (against approved list)
function isValidUrl(url, approvedUrls) {
  const normalizedUrl = normalizeUrl(url);
  const domain = normalizedUrl.split('/')[0]; // Get the base domain
  return approvedUrls.includes(domain);
}

exports.handler = async function(event) {
  const { data, captcha, user } = JSON.parse(event.body);

  if (!captcha || !data) {
    return {
      statusCode: 400,
      body: 'Missing fields'
    };
  }

  // Fetch approved URLs and allowed users from GitHub
  const approvedUrlsUrl = 'https://raw.githubusercontent.com/somerandomscripts/WF-social-data/refs/heads/main/rules/allowed_URLs.json';
  const allowedUsersUrl = 'https://raw.githubusercontent.com/somerandomscripts/WF-social-data/refs/heads/main/rules/allowed_users.json';

  let approvedUrls = [];
  let allowedUsers = [];

  try {
    const approvedUrlsResponse = await fetch(approvedUrlsUrl);
    approvedUrls = await approvedUrlsResponse.json();

    const allowedUsersResponse = await fetch(allowedUsersUrl);
    allowedUsers = await allowedUsersResponse.json();
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Failed to fetch URLs or users data from GitHub.'
    };
  }

  const validUrls = [];
  const invalidUrls = [];
  const issuesFound = [];

  // Validate the URLs in the submitted data
  Object.values(data).forEach(links => {
    links.forEach(link => {
      if (link && isBadUrl(link)) {
        invalidUrls.push(link);
        issuesFound.push("Double URL");
      } else if (link && !isValidUrl(link, approvedUrls)) {
        invalidUrls.push(link);
        issuesFound.push("Disallowed URL");
      } else if (link) {
        validUrls.push(link);
      }
    });
  });

  // If there are issues, return error and show what was found
  if (invalidUrls.length > 0) {
    return {
      statusCode: 400,
      body: `Invalid URLs detected: ${invalidUrls.join(', ')}`
    };
  }

  // If no issues, display "none" for issuesFound
  if (issuesFound.length === 0) {
    issuesFound.push("none");
  }

  // Set the submitter's name (either anonymous or GitHub user)
  const submitter = user ? user.login : "Anonymous";

  // Construct the GitHub issue body
  const issueData = {
    title: `Social update: ${Object.keys(data)[0]}`,  // Using the first key (e.g., Angela_Kinsey)
    body: `
      Submitter: ${submitter}
      
      Issues:
      ${issuesFound.join('\n')}
      
      \`\`\`json
      ${JSON.stringify(data, null, 2)}
      \`\`\`

      ${validUrls.map(url => `[${url}](${url})`).join('\n')}
    `,
    labels: ["submission"]
  };

  // Create the GitHub issue
  const res = await fetch('https://api.github.com/repos/yourrepo/issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GH_TOKEN}`,
    },
    body: JSON.stringify(issueData),
  });

  if (!res.ok) {
    return {
      statusCode: 500,
      body: 'GitHub API failed'
    };
  }

  return {
    statusCode: 200,
    body: 'Issue created successfully'
  };
};
