module.exports = {
  branches: ["main"],
  repositoryUrl: "https://github.com/ExoFlex-Inc/ExoFlex",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/github",
  ],
};
