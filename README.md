## How to create a new Component Repository

- In GitHub, on the page for this repository, select `Use this template` -> `Create a new repository` and fill out your desired location and repository name. The repository's visibility will need to be set to public, and your repository name will need to be in a specific format.
- The repository name you provide will be used to fill in the template variables upon creation, it will be used to determine your COMPONENT_PREFIX and COMPONENT_ID in the format of ${COMPONENT_PREFIX}-${COMPONENT_ID}. For example, if you name your repository ‘foo-bar’ the prefix would be set to ‘foo’ and the id would be set to ‘bar’.
NOTE:
Your COMPONENT_PREFIX may only include alphanumeric characters and underscores. It must begin with a letter and cannot have an '_' as the last character. [a-zA-Z0-9_]
Your COMPONENT_ID may only include letters and underscores. It must begin with a letter. [a-zA-Z_]
- After creating your new repository, remember to run `npm i` to install all dependencies

[Visit our IA documentation for more information on creating components](https://clearblade.atlassian.net/wiki/x/FQB6ug)
