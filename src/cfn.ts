// CloudFormation template the customer deploys to grant LoxeAI a read-only
// cross-account role. The trust policy uses the LoxeAI scanner principal ARN
// + customer-supplied ExternalId.

export const CFN_TEMPLATE = `AWSTemplateFormatVersion: '2010-09-09'
Description: LoxeAI Pilot v2 — read-only cross-account role for SOC 2 evidence collection

Parameters:
  ExternalId:
    Type: String
    Description: A unique secret you generate (paste the same value into pilot.loxeai.com)
    MinLength: 16
    AllowedPattern: '^[A-Za-z0-9_\\-]+$'
  LoxeAIPrincipalArn:
    Type: String
    Description: LoxeAI scanner principal (do not change)
    Default: arn:aws:iam::171916339757:root

Resources:
  LoxeAIReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: LoxeAIPilotReadOnlyRole
      MaxSessionDuration: 3600
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Ref LoxeAIPrincipalArn
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                sts:ExternalId: !Ref ExternalId
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/SecurityAudit
        - arn:aws:iam::aws:policy/ReadOnlyAccess
      Policies:
        - PolicyName: LoxeAIPilotDeny
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Belt-and-suspenders: explicitly deny anything that could read secret material
              - Effect: Deny
                Action:
                  - secretsmanager:GetSecretValue
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - kms:Decrypt
                  - kms:GenerateDataKey
                  - kms:Sign
                Resource: '*'

Outputs:
  RoleArn:
    Description: Paste this RoleArn into pilot.loxeai.com
    Value: !GetAtt LoxeAIReadOnlyRole.Arn
  ExternalIdEcho:
    Description: The ExternalId you supplied
    Value: !Ref ExternalId
`;
