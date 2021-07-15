# cvs-tsk-report-gen

## Introduction

The report gen task is a microservice to be consumed by DVSA to help generate reports.

## Dependencies

The project runs on node 10.x with typescript and serverless framework. For further details about project dependencies, please refer to the `package.json` file.
[nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) is used to managed node versions and configuration explicitly done per project using an `.npmrc` file.

## Configuration and environmental variable

The `BRANCH` environment variable indicates in which environment is this application running. Not setting this variable will result in defaulting to `local`.

The configuration file can be found under `src/config/config.yml`.
Environment variable injection is possible with the syntax:
`${BRANCH}`, or you can specify a default value: `${BRANCH:local}`.

## Running the project

Please install and run the following security programs as part of your development process -
[git-secrets](https://github.com/awslabs/git-secrets)
After installing, do a one-time set up with `git secrets --register-aws`. Run with `git secrets --scan`.
You will also need to install [repo-security-scanner](https://github.com/UKHomeOffice/repo-security-scanner)

Set up your nodejs environment running `nvm use` and once the dependencies are installed using `npm i`, you can run the scripts from `package.json` to build your project.

### Building

- Building the docker image - `npm run build:docker`
- Building with source maps - `npm run build:dev`
- Building without source maps - `npm run build`

### Running

- The S3 server can be started by running `npm run start:docker`.
- The app can be started by running `npm run start`

### Lambda Invoke

The `invoke` configuration contains settings for both the `local` and the `remote` environment.
The local environment contains configuration for the Lambda Invoke local endpoint, as well as configuration for loading mock JSON response.

```
invoke:
  local:
    params:
      apiVersion: 2015-03-31
      endpoint: http://localhost:3000
    functions:
      testResults:
          name: cvs-svc-test-results
          mock: tests/resources/test-results-response.json
  remote:
    params:
      apiVersion: 2015-03-31
    functions:
      testResults:
          name: test-results-${BRANCH}
```

### S3

The S3 configuration contains settings for both the `local` and the `remote` environment. The `local` environment contains configuration for the local S3 instance. The `remote` environment does not require parameters.

```
s3:
  local:
    endpoint: http://localhost:7000
    s3ForcePathStyle: true
  remote: {}
```

### Testing

Jest is used for unit testing.
Please refer to the [Jest documentation](https://jestjs.io/docs/en/getting-started) for further details.
In order to test, you need to run the following:

- `npm run test` for unit tests

### Contributing

The projects has multiple hooks configured using [husky](https://github.com/typicode/husky#readme) which will execute the following scripts: `security-checks`, `audit`, `tslint`, `prepush`.
The codebase uses [typescript clean code standards](https://github.com/labs42io/clean-code-typescript) as well as sonarqube for static analysis.
SonarQube is available locally, please follow the instructions below if you wish to run the service locally (brew is the preferred approach):

- _Brew_:

  - Install sonarqube using brew
  - Change `sonar.host.url` to point to localhost, by default, sonar runs on `http://localhost:9000`
  - run the sonar server `sonar start`, then perform your analysis `npm run sonar-scanner`

- _Manual_:
  - Add sonar-scanner in environment variables in your \_profile file add the line: `export PATH=<PATH_TO_SONAR_SCANNER>/sonar-scanner-3.3.0.1492-macosx/bin:$PATH`
  - Start the SonarQube server: `cd <PATH_TO_SONARQUBE_SERVER>/bin/macosx-universal-64 ./sonar.sh start`
  - In the microservice folder run the command: `npm run sonar-scanner`
