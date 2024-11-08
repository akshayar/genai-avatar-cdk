import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { CfnOutput } from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';

export class AvatarFrontendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);
        const repo = new Repository(this, 'AvatarGenAIFrontendRepo', {
            repositoryName: 'AvatarGenAIFrontendRepo',
        })

        new CfnOutput(this, 'codeCommit', {
            value: repo.repositoryCloneUrlHttp,
            description: 'CodeCommit Https URL',
            exportName: 'codeCommitUrl',
        })

        const amplifyApp = new amplify.App(this, 'AvatarGenAI-Frontend', {
            /*sourceCodeProvider: new amplify.CodeCommitSourceCodeProvider({
                repository: repo,
            }),*/
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: 'akshayar',
                repository: 'genai-avatar-cdk',
                oauthToken: SecretValue.secretsManager('my-github-token')
              }),
            buildSpec: codebuild.BuildSpec.fromObjectToYaml({
                // Alternatively add a `amplify.yml` to the repo
                version: '1.0',
                frontend: {
                    phases: {
                        build: {
                            commands: [
                                'npm ci --cache .npm --prefer-offline',
                                'npm run build',
                            ],
                        },
                    },
                    artifacts: {
                        baseDirectory: 'dist',
                        files: ['**/*'],
                    },
                    cache: {
                        paths: ".npm/**/*"
                    }
                },
            }),
        });

        const master = amplifyApp.addBranch('master');
		
		new CfnOutput(this, 'AmplifyBranchURL', {
            value: master.branchName.concat('.', amplifyApp.defaultDomain),
            description: 'Amplify Deployment URL for master branch',
            exportName: 'AmplifyBranchURL',
        });

    }
}