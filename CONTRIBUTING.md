# Contributing

Use Node.js 22 or newer. The app has no npm dependencies.

1. Create a branch for the change.
2. Run `npm start` and check the affected interface at http://localhost:5110.
3. Run `npm test` before opening a pull request.

Keep API keys in an untracked `.env` file. `.env.example` documents configuration without containing credentials. Do not put keys in browser code, URLs shared with others, screenshots, or issue descriptions.

Keep sample incidents clearly labeled. Changes to campus coordinates, county coverage, or GDOT response handling should include the source and verification performed. Confirm real feed behavior before describing a change as operationally ready.

The MGA logo is a supplied university branding asset. Do not assume permission to reuse it for other projects. County data and map providers retain their own attribution and usage requirements documented in README.md.
