import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment } from 'aws-cdk-lib/aws-cognito';

export class AvatarBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cognito_id_pool = new CfnIdentityPool(this, 'Avatar-Cognito-Identity-Pool', {
      allowUnauthenticatedIdentities: true,
      identityPoolName: "avatar-identity-pool",
    });

    const role_cognito = new iam.Role(this, 'role-cognito-avatar-demo', {
      assumedBy: new iam.WebIdentityPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": cognito_id_pool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr":"unauthenticated",
          }
        }
      )
    });

    role_cognito.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "polly:*",
      ],
      resources: ["*"],
    }));

    new CfnIdentityPoolRoleAttachment(this, 'Identity-Role-Attachment', {
      identityPoolId: cognito_id_pool.ref,
      roles: { unauthenticated: role_cognito.roleArn }
    });

    const kb = new bedrock.KnowledgeBase(this, 'Avatar-Knowledge-Base', {
      embeddingsModel: bedrock.BedrockFoundationModel.COHERE_EMBED_MULTILINGUAL_V3,
      instruction: `Knowledge base for Avatar bot Amazon`
    });

    const kb_bucket = new s3.Bucket(this, 'kb-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new s3deploy.BucketDeployment(this, 'bucket-deployment', {
      sources: [s3deploy.Source.asset('./files/')],
      destinationBucket: kb_bucket
    });

    const datasource_kb = new bedrock.S3DataSource(this, 'datasource-kb', {
      bucket: kb_bucket,
      knowledgeBase: kb,
      dataSourceName: 'avatardemo',
      chunkingStrategy: bedrock.ChunkingStrategy.DEFAULT,
      maxTokens: 2000,
      overlapPercentage: 20,
    });

    const bedrock_lambda = new Function(this, 'bedrock_lambda', {
      code: Code.fromAsset('lambda/bedrock_lambda'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        'KNOWLEDGE_BASE_ID': kb.knowledgeBaseId,
        'MODEL_ARN': "anthropic.claude-3-haiku-20240307-v1:0",
        'KNOWLEDGE_BASE_TYPE': 'KNOWLEDGE_BASE',
        'GUARDRAIL_ID': 'Add your Guardrail ID here',
      }
    });

    bedrock_lambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess"));

    const api_avatar = new apigateway.LambdaRestApi(this, 'avatar-api', {
      handler: bedrock_lambda,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token', 'Access-Control-Allow-Origin']
      },
      proxy: false,
      //deployOptions: {
      //  loggingLevel: apigateway.MethodLoggingLevel.INFO,
      //}
    });

    api_avatar.root.addMethod('POST', new apigateway.LambdaIntegration(bedrock_lambda), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });


    new cdk.CfnOutput(this, 'data-source-id-input', {
      value: datasource_kb.dataSourceId,
      exportName: 'DataSourceIdOutput'
    });

    new cdk.CfnOutput(this, 'knowledgebase-id-output', {
      value: kb.knowledgeBaseId,
      exportName: 'KnowledgeBaseIdOutput'
    });

    new cdk.CfnOutput(this, 'knowledgebase-id-arn-output', {
      value: kb.knowledgeBaseArn,
      exportName: 'KnowledgeBaseArnOutput'
    });

    new cdk.CfnOutput(this, 'apiOutput',{
      value: api_avatar.url,
      description: "API Avatar GenAI endpoint URL",
    });

    new cdk.CfnOutput(this, 'identityPoolOutput', {
      value: cognito_id_pool.attrId,
      description: 'Identity pool id',
    });

  };
};