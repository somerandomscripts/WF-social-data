const fetch = require('node-fetch');
const fs = require('fs');

function normalizeUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

function isValidUrl(url, approvedUrls) {
  const normalizedUrl = normalizeUrl(url);
  const domain = normalizedUrl.split('/')[0]; // Get the base domain
  return approvedUrls.includes(domain);
}

function isBadUrl(url) {
  return /(https?:\/\/)?(www\.)?([\w\-]+\.[a-z]{2,})(\/[^\/]+){2,}/.test(url);  // Double domains check
}

exports.handler = async function(event) {
  const { data, captcha, user } = JSON.parse(event.body);

  if (!captcha || !data) {
    return {
      statusCode: 400,
      body: 'Missing fields'
    };
  }

  // Load the approved URLs list
  const approvedUrls = JSON.parse(fs.readFileSync('approved_URLs.json'));

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
