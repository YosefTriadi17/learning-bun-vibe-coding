const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

// Read .env for PAT
const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
const patMatch = envContent.match(/Learning_Vibe_Coding_PAT=(.+)/);
if (!patMatch) {
  console.error("PAT not found in .env");
  process.exit(1);
}
const token = patMatch[1].trim();

const repo = "YosefTriadi17/learning-bun-vibe-coding";
const repoUrl = "github.com/YosefTriadi17/learning-bun-vibe-coding.git";
const authUrl = `https://x-access-token:${token}@${repoUrl}`;
const branchName = "docs/update-readme";

// Helper function to make HTTP requests
function request(options, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (payload) {
      req.write(typeof payload === "string" ? payload : JSON.stringify(payload));
    }
    req.end();
  });
}

async function run() {
  console.log("Fetching all open Pull Requests...");
  const getOptions = {
    hostname: "api.github.com",
    path: `/repos/${repo}/pulls?state=open`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Node.js",
    },
  };

  try {
    const { statusCode, body: prs } = await request(getOptions);
    if (statusCode !== 200) {
      console.error(`Failed to fetch PRs (status: ${statusCode}):`, prs);
      process.exit(1);
    }

    console.log(`Found ${prs.length} open PR(s). Closing them...`);
    for (const pr of prs) {
      console.log(`Closing PR #${pr.number}: ${pr.title}`);
      const closeOptions = {
        hostname: "api.github.com",
        path: `/repos/${repo}/pulls/${pr.number}`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "Node.js",
        },
      };
      const closeRes = await request(closeOptions, { state: "closed" });
      if (closeRes.statusCode === 200) {
        console.log(`PR #${pr.number} closed successfully.`);
      } else {
        console.error(`Failed to close PR #${pr.number}:`, closeRes.body);
      }
    }

    console.log("Committing any local changes...");
    try {
      execSync("git add .", { stdio: "ignore" });
      execSync('git commit -m "docs: finalize README, comments, and Swagger tags"', { stdio: "ignore" });
      console.log("Committed successfully.");
    } catch (err) {
      console.log("No new changes to commit or commit failed.");
    }

    console.log(`Pushing branch ${branchName} to GitHub...`);
    execSync(`git push "${authUrl}" ${branchName} --set-upstream --force`, { stdio: "ignore" });
    console.log("Push completed successfully.");

    console.log("Creating new Pull Request to main...");
    const prPayload = {
      title: "docs: update README, services documentation, and Swagger tags",
      head: branchName,
      base: "main",
      body: "Menggabungkan pembaruan dokumentasi (README.md), penambahan komentar JSDoc pada seluruh fungsi services, dan pengelompokan tag Swagger untuk rute Auth, Users, dan Health.",
    };

    const prOptions = {
      hostname: "api.github.com",
      path: `/repos/${repo}/pulls`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "Node.js",
      },
    };

    const prRes = await request(prOptions, prPayload);
    if (prRes.statusCode === 201) {
      console.log("New Pull Request created successfully!");
      console.log(`PR #${prRes.body.number}: ${prRes.body.title}`);
      console.log(`URL: ${prRes.body.html_url}`);
    } else {
      console.error(`Failed to create PR (status ${prRes.statusCode}):`, prRes.body);
    }

  } catch (err) {
    console.error("An error occurred during execution:", err.message);
  }
}

run();
