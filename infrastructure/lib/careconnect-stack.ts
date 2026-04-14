// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2       from 'aws-cdk-lib/aws-ec2';
import * as ecs       from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr       from 'aws-cdk-lib/aws-ecr';
import * as rds       from 'aws-cdk-lib/aws-rds';
import * as s3        from 'aws-cdk-lib/aws-s3';
import * as cognito   from 'aws-cdk-lib/aws-cognito';
import * as kms       from 'aws-cdk-lib/aws-kms';
import * as iam       from 'aws-cdk-lib/aws-iam';
import * as logs      from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';

export class CareConnectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // ─────────────────────────────────────────────────────────────
    // KMS — account-level encryption key for all resources
    // ─────────────────────────────────────────────────────────────
    const encryptionKey = new kms.Key(this, 'CareConnectKey', {
      description:       'CareConnect — encryption key for RDS, S3, Secrets',
      enableKeyRotation: true,
      removalPolicy:     cdk.RemovalPolicy.RETAIN,
    });

    // ─────────────────────────────────────────────────────────────
    // VPC — 2 AZs, public + private subnets, single NAT gateway
    // ─────────────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'CareConnectVpc', {
      maxAzs:      2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'Public',  subnetType: ec2.SubnetType.PUBLIC,           cidrMask: 24 },
        { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'Isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED,  cidrMask: 28 },
      ],
    });

    // ─────────────────────────────────────────────────────────────
    // Security Groups
    // ─────────────────────────────────────────────────────────────
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      description: 'ALB — allow HTTPS from internet',
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const appSg = new ec2.SecurityGroup(this, 'AppSg', {
      vpc,
      description: 'ECS Fargate tasks',
    });
    appSg.addIngressRule(albSg, ec2.Port.tcp(3001), 'ALB → app');

    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc,
      description: 'RDS PostgreSQL',
    });
    dbSg.addIngressRule(appSg, ec2.Port.tcp(5432), 'App → RDS');

    // ─────────────────────────────────────────────────────────────
    // RDS PostgreSQL 15 — private isolated subnet, Multi-AZ
    // ─────────────────────────────────────────────────────────────
    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName:   '/careconnect/db-credentials',
      description:  'CareConnect RDS master credentials',
      encryptionKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'careconnect_admin' }),
        generateStringKey:    'password',
        excludePunctuation:   true,
        passwordLength:       32,
      },
    });

    const database = new rds.DatabaseInstance(this, 'CareConnectDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType:    ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      vpc,
      vpcSubnets:      { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups:  [dbSg],
      credentials:     rds.Credentials.fromSecret(dbSecret),
      databaseName:    'careconnect',
      multiAz:         true,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      deletionProtection:   true,
      backupRetention:      cdk.Duration.days(14),
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      cloudwatchLogsRetention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─────────────────────────────────────────────────────────────
    // S3 — resident photos bucket (private, KMS-encrypted)
    // ─────────────────────────────────────────────────────────────
    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName:           `careconnect-resident-photos-${this.account}`,
      encryption:           s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess:    s3.BlockPublicAccess.BLOCK_ALL,
      versioned:            true,
      enforceSSL:           true,
      lifecycleRules: [{
        id:         'expire-old-versions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─────────────────────────────────────────────────────────────
    // Cognito User Pool — MFA + RBAC groups
    // ─────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'CareConnectUserPool', {
      userPoolName:       'careconnect-users',
      selfSignUpEnabled:  false,                      // admin-only provisioning
      signInAliases:      { email: true },
      mfa:                cognito.Mfa.REQUIRED,
      mfaSecondFactor:    { sms: false, otp: true },  // TOTP only (no SMS cost)
      passwordPolicy: {
        minLength:            12,
        requireLowercase:     true,
        requireUppercase:     true,
        requireDigits:        true,
        requireSymbols:       true,
        tempPasswordValidity: cdk.Duration.days(3),
      },
      accountRecovery:    cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:      cdk.RemovalPolicy.RETAIN,
    });

    // Standard app client for the mobile app
    const userPoolClient = userPool.addClient('MobileClient', {
      userPoolClientName:  'careconnect-mobile',
      authFlows: {
        userSrp:            true,
        userPassword:       false,   // SRP only — no plaintext password
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity:     cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      generateSecret:      false,    // public client
    });

    // RBAC groups
    for (const groupName of ['admin', 'nurse', 'carer']) {
      new cognito.CfnUserPoolGroup(this, `Group-${groupName}`, {
        userPoolId:  userPool.userPoolId,
        groupName,
        description: `CareConnect ${groupName} role`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ECR Repository — backend Docker images
    // ─────────────────────────────────────────────────────────────
    const ecrRepo = new ecr.Repository(this, 'BackendRepo', {
      repositoryName:   'careconnect-backend',
      imageScanOnPush:  true,
      encryption:       ecr.RepositoryEncryption.KMS,
      encryptionKey,
      lifecycleRules: [{
        maxImageCount: 10,
        description:   'Keep last 10 images',
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─────────────────────────────────────────────────────────────
    // ECS Cluster + Fargate Service behind ALB
    // ─────────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'CareConnectCluster', {
      vpc,
      clusterName:           'careconnect',
      containerInsights:     true,
    });

    const taskLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName:    '/ecs/careconnect-backend',
      retention:       logs.RetentionDays.THREE_MONTHS,
      encryptionKey,
      removalPolicy:   cdk.RemovalPolicy.RETAIN,
    });

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy:   new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'CareConnect ECS task role — S3 + Secrets read',
    });
    photosBucket.grantReadWrite(taskRole);
    dbSecret.grantRead(taskRole);
    encryptionKey.grantDecrypt(taskRole);

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'ApiService', {
      cluster,
      serviceName:        'careconnect-api',
      cpu:                512,
      memoryLimitMiB:     1024,
      desiredCount:       2,
      securityGroups:     [appSg],
      taskSubnets:        { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      publicLoadBalancer: true,
      taskImageOptions: {
        image:        ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
        containerPort: 3001,
        taskRole,
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: 'api',
          logGroup:     taskLogGroup,
        }),
        environment: {
          NODE_ENV:           'production',
          PORT:               '3001',
          AWS_REGION:         'ap-southeast-2',
          S3_BUCKET:          photosBucket.bucketName,
          COGNITO_USER_POOL_ID: userPool.userPoolId,
          COGNITO_CLIENT_ID:  userPoolClient.userPoolClientId,
        },
        secrets: {
          DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret, 'connectionString'),
        },
      },
      healthCheck: {
        command:     ['CMD-SHELL', 'wget -qO- http://localhost:3001/health || exit 1'],
        interval:    cdk.Duration.seconds(30),
        timeout:     cdk.Duration.seconds(5),
        retries:     3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Auto-scaling — ECS tasks scale on CPU
    const scaling = fargateService.service.autoScaleTaskCount({ maxCapacity: 6, minCapacity: 2 });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 60,
      scaleInCooldown:  cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    // Allow the Fargate SG to reach RDS
    database.connections.allowFrom(appSg, ec2.Port.tcp(5432));

    // ─────────────────────────────────────────────────────────────
    // CloudTrail — audit log of all API activity
    // ─────────────────────────────────────────────────────────────
    const trailBucket = new s3.Bucket(this, 'TrailBucket', {
      bucketName:        `careconnect-cloudtrail-${this.account}`,
      encryption:        s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned:         true,
      enforceSSL:        true,
      removalPolicy:     cdk.RemovalPolicy.RETAIN,
    });

    new cloudtrail.Trail(this, 'AuditTrail', {
      trailName:          'careconnect-audit',
      bucket:             trailBucket,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
      encryptionKey,
      isMultiRegionTrail: false,
      includeGlobalServiceEvents: true,
    });

    // ─────────────────────────────────────────────────────────────
    // Outputs
    // ─────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value:       `https://${fargateService.loadBalancer.loadBalancerDnsName}`,
      description: 'CareConnect API base URL',
      exportName:  'CareConnectApiUrl',
    });
    new cdk.CfnOutput(this, 'EcrRepoUri', {
      value:       ecrRepo.repositoryUri,
      description: 'ECR repository URI for CI/CD push',
      exportName:  'CareConnectEcrUri',
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value:       userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName:  'CareConnectUserPoolId',
    });
    new cdk.CfnOutput(this, 'CognitoClientId', {
      value:       userPoolClient.userPoolClientId,
      description: 'Cognito app client ID for mobile',
      exportName:  'CareConnectCognitoClientId',
    });
    new cdk.CfnOutput(this, 'PhotosBucketName', {
      value:       photosBucket.bucketName,
      description: 'S3 bucket for resident photos',
      exportName:  'CareConnectPhotosBucket',
    });
  }
}
