const { Octokit } = require("@octokit/rest");
const core = require('@actions/core');
const fs = require("fs");

// This file contains the main logic for the backup action.
// Get input parameters
const projectUrl = core.getInput("project_url");
const token = core.getInput("github_token")
const scriptsPath = core.getInput("scripts_path")

// Export the backupProject function
module.exports.backupProject = async function (projectUrl, scope) {
  console.log(`Backing up GitHub project: ${projectUrl}`);

  const octokit = new Octokit({
    auth: token,
  });

  try {
    // Fetch the repository information
    const [owner, repo, projectV2Number] = projectUrl.split("/").slice(-3);
    // const { data: repository } = await octokit.repos.get({ owner, repo });

    const commonQuery = `
            id
            items(first: 100) {
              totalCount
              pageInfo {
                startCursor
                endCursor
                hasNextPage
              }
              nodes {
                content{
                  __typename
                  ... on DraftIssue{
                    id
                    body
                    assignees(first:5){
                      totalCount
                      ... on UserConnection{
                        nodes {
                          login
                        }
                      }
                    }
                    createdAt
                  }
                }
                fieldValues(first: 100) {
                  edges {
                    node {
                      ... on ProjectV2ItemFieldUserValue {
                        __typename
                        users(first: 5) {
                          nodes {
                            login
                          }
                          pageInfo {
                            endCursor
                            startCursor
                          }
                          edges {
                            node {
                              login
                            }
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldTextValue {
                        text
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            id
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldDateValue {
                        date
                        field {
                          ... on ProjectV2Field {
                            name
                            id
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldReviewerValue {
                        __typename
                        reviewers {
                          nodes {
                            ... on Mannequin {
                              login
                            }
                            ... on Team {
                              slug
                            }
                            ... on User {
                              login
                            }
                          }
                        }
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldNumberValue {
                        number
                        field {
                          ... on ProjectV2Field {
                            name
                            id
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldLabelValue {
                        __typename
                        labels(first: 10) {
                          nodes {
                            name
                            id
                          }
                        }
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                      }
                    }
                    cursor
                  }
                  pageInfo {
                    hasNextPage
                    startCursor
                    endCursor
                  }
                }
                id
                databaseId
              }
            }
    `;

    let query;
    if (scope === 'organization') {
      query = `
        query getProject($owner: String!, $projectV2Number: Int!) {
          organization(login: $owner) {
            projectV2(number: $projectV2Number) {
              ${commonQuery}
            }
          }
        }
      `;
    } else if (scope === 'user') {
      query = `
        query getProject($owner: String!, $projectV2Number: Int!) {
          user(login: $owner) {
            projectV2(number: $projectV2Number) {
              ${commonQuery}
            }
          }
        }
      `;
    }
    // Fetch all the project items in the project
    console.log("Fetching project items...");
    console.log(query);
    const response = await octokit.graphql(query, { owner, projectV2Number: parseInt(projectV2Number) });
    const { data: projectItems } = response;
    console.log("Project items fetched successfully");
    
    
    // Save the project items to a file
    fs.writeFileSync("project-items.json", JSON.stringify(projectItems, null, 2));

    // TODO: Process the repository and issues data as needed for backup/export

    console.log("Backup/export process completed successfully");
  } catch (error) {
    console.error("An error occurred during backup/export process:", error);
  }
};

// Export the importProject function that will be used to import the project items 
// from the graphql file in the local directory named copilot-blueprint.graphql
// It will take the project title and owner as input parameters
module.exports.importProject = async function (projectTitle, owner, dataFilePath) {
  console.log(`Importing GitHub project: ${projectTitle}`);

  const octokit = new Octokit({
    auth: token,
  });

  try {
    // Read the project items from the file
    const parsedJson = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    const data = parsedJson.data;
    
    const scope = Object.keys(data)[0]; // "user"
    
    var projectV2 = JSON.stringify(data[scope].projectV2);
    // Remove quotes from the keys in the projectV2 object
    projectV2 = projectV2.replace(/"([^"]+)":/g, '$1:');
    // Then remove all the id fields from the projectV2 object
    projectV2 = projectV2.replace(/id:.*?,/g, 'id\n');

    //save projectV2 to a file
    fs.writeFileSync("projectV2-ready.json", projectV2);


    // Get the id of the owner
    const { data: user } = await octokit.users.getByUsername({ username: owner });
    const ownerId = user.id;

    // Import the project items to the owner using the GraphQL mutation
    const mutation = `
      mutation createProjectV2($owner: ID!, $projectTitle: String!) {
        createProjectV2(input: {ownerId: $owner, title: $projectTitle}) {
          projectV2 
            {id}
        }
      }
    `;
    console.log("Importing project items...");
    const response = await octokit.graphql(mutation, { owner: ownerId, projectTitle });
    console.log(response);
    
  } catch (error) {
    console.error("An error occurred during import process:", error);
  }
};

