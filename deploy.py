import argparse
import json
import os
import sys
import time


# Look for packages in the python_packages directory.
sys.path.append('./python_packages')
import boto3
from botocore.exceptions import ClientError


failed_status = [
    'CREATE_FAILED',
    'DELETE_FAILED',
    'ROLLBACK_FAILED',
    'ROLLBACK_COMPLETE',
    'UPDATE_ROLLBACK_FAILED',
    'UPDATE_ROLLBACK_COMPLETE',
    'IMPORT_ROLLBACK_FAILED',
    'IMPORT_ROLLBACK_COMPLETE'
]

standby_status = [
    'CREATE_IN_PROGRESS',
    'ROLLBACK_IN_PROGRESS',
    'DELETE_IN_PROGRESS',
    'UPDATE_IN_PROGRESS',
    'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
    'UPDATE_ROLLBACK_IN_PROGRESS',
    'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
    'REVIEW_IN_PROGRESS',
    'IMPORT_IN_PROGRESS',
    'IMPORT_ROLLBACK_IN_PROGRESS',
]

complete_status = [
    'CREATE_COMPLETE',
    'DELETE_COMPLETE',
    'UPDATE_COMPLETE',
    'IMPORT_COMPLETE'
]

TLC = {
    'us-east-1': 'iad',
    'us-east-2': 'cmh',
    'us-west-1': 'sfo',
    'us-west-2': 'pdx',
    'eu-west-1': 'dub',
    'eu-west-2': 'lhr',
    'eu-west-3': 'cdg',
    'eu-central-1': 'fra',
    'eu-north-1': 'arn'
}


def get_web_params(domain_name: str, region: str, environment: str) -> []:
    return [
        {
            'ParameterKey': 'Environment',
            'ParameterValue': environment
        },
        {
            'ParameterKey': 'AlternateDomainNames',
            'ParameterValue': domain_name
        }
    ]


def launch_stack(cf, stack_name: str, stack_filename: str, template_dir: str, parameters: list) -> bool:

    print(f"Launching stack '{stack_name}' from file {stack_filename}.")
    with open(os.path.join(template_dir, stack_filename), mode='r') as tf:
        template_body = tf.read()
        
    response = cf.create_stack(
        StackName=stack_name,
        TemplateBody=template_body,
        Parameters=parameters,
        Capabilities=['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
    )

    waiting_for_stack = True
    success = False
    current_status = ''

    while waiting_for_stack == True:

        response = cf.describe_stacks(
            StackName=stack_name
        )
        stack_status = response['Stacks'][0]['StackStatus']

        if stack_status in failed_status:
            waiting_for_stack = False
        elif stack_status in standby_status:
            if current_status != stack_status:
                current_status = stack_status
                print (f"\nStatus changed to {current_status}", end='', flush=True)
        elif stack_status in complete_status:
            waiting_for_stack = False
            success = True
        else:
            raise RuntimeError(f'Illegal CloudFormation status found: {current_status}')

        print('.', end='', flush=True)
        time.sleep(2)

    print(f"\nTask ended with code {stack_status}")
    return success, 'STACK_ID'


def get_application_stack_params(app_stack_name: str, region:str):
    result = {}

    cf = boto3.client('cloudformation', region_name=region)
    response = cf.describe_stacks(
        StackName=app_stack_name,
    )
    
    for output in response['Stacks'][0]['Outputs']:
        if output['OutputKey'] == 'ApiGatewayInvokeUrl':
            result['ApiGatewayUrl'] = output['OutputValue']
        elif output['OutputKey'] == 'UserPoolId':
            result['UserPoolId'] = output['OutputValue']
        elif output['OutputKey'] == 'UserPoolClientId':
            result['UserPoolClientId'] = output['OutputValue']
        elif output['OutputKey'] == 'IdentityPoolId':
            result['IdentityPoolId'] = output['OutputValue']

    return result


def apply_configuration(params: {}, region: str):

    config_data = {
        'production': True,
        'cognitoAppClient': params['UserPoolClientId'],
        'cognitoIdentityPoolId': params['IdentityPoolId'],
        'baseApiUrl': params['ApiGatewayUrl'],
        'cognitoUserPoolData': {
            'ClientId': params['UserPoolClientId'],
            'Region': region,
            'UserPoolId': params['UserPoolId']
        },
        'transcribeMedicalData': {
            'region': region
        }
    }

    with open(os.path.join(os.getcwd(), 'src', 'environments', 'environment.prod.ts'), 'wt') as f:
        f.write("export const environment = \n")
        f.write(json.dumps(config_data))
        f.write(";")


def create_bucket(bucket_name: str, creds: {}):

    s3 = boto3.client('s3', **creds)
    try:
        s3.head_bucket(Bucket=bucket_name)
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            print ("Bucket does not exist. Creating.")
            s3.create_bucket(Bucket=bucket_name)
        else:
            raise RuntimeError('Failed to create bucket.')


def upload_site_to_bucket(bucket_name: str, creds: {}):

    s3 = boto3.client('s3', **creds)
    path_to_dist = os.path.join(os.getcwd(), 'dist', 'octdiag-web')
    for fname in os.listdir(path_to_dist):
        path_to_file = os.path.join(path_to_dist, fname)
        print(f"Uploading {path_to_file}")
        with open(path_to_file, 'rb') as f:
            s3.put_object(
                Body=f,
                Bucket=bucket_name,
                Key=fname
            )


def launch_infrastructure(args):

    region = args.region
    environment = args.environment

    if not args.dont_build:
        app_stack_params = get_application_stack_params(f'{args.stack_prefix}-app', args.region)
        print("App stack parameters:")
        for k in app_stack_params.keys():
            print (f"{k} = {app_stack_params[k]}")

        apply_configuration(app_stack_params, args.region)
        os.system('ng build --prod')

    creds = get_credentials()
    creds['region_name'] = args.region

    bucket_name = f"{TLC[creds['region_name']]}.octdiag.net"
    if not args.skip_upload:
        create_bucket(bucket_name, creds)
        upload_site_to_bucket(bucket_name, creds)

    if not args.skip_infra:
        cf = boto3.client('cloudformation', **creds)

        params = get_web_params(bucket_name, args.region, args.environment)
        web_stack_name = f'{args.stack_prefix}-web'
        success, stack_id = launch_stack(cf, web_stack_name, 'octdiag_web.yaml', args.template_dir, params)

        if not success:
            raise RuntimeError('Failed to deploy network infrastructure.')


def get_credentials():
    sts = boto3.client('sts')

    response = sts.assume_role(
        RoleArn='arn:aws:iam::659050948501:role/OctDiagDeployWebsite',
        RoleSessionName='octdiag-web-deployment'
    )

    aws_access_key_id = response['Credentials']['AccessKeyId']
    aws_secret_access_key = response['Credentials']['SecretAccessKey']
    aws_session_token = response['Credentials']['SessionToken']

    return {
        'aws_access_key_id': aws_access_key_id,
        'aws_secret_access_key': aws_secret_access_key,
        'aws_session_token': aws_session_token
    }


def str2bool(v):
    if isinstance(v, bool):
        return v
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')


# Initialize defaults.
default_environment = 'dev'
default_region = os.environ.get('AWS_DEFAULT_REGION') or 'us-east-1'
default_stack_prefix = f'octdiag-{default_region}-{default_environment}'
default_template_dir = os.environ.get('CF_TEMPLATE_DIR') or os.path.join(os.getcwd(), 'cf')


# Build argument parser.
arg_parser = argparse.ArgumentParser()

arg_parser.add_argument('--dont-build', '-b', type=str2bool, nargs='?',
                        const=True, default=False,
                        help='Do not build the site before uploading.')

arg_parser.add_argument('--environment', '-e', type=str, nargs=1, default=default_environment,
                        help='The environment for which the infrastructure will be deployed (dev, qa, pd).')

arg_parser.add_argument('--region', '-r', type=str, nargs=1, default=default_region,
                        help='The region the stack will be deployed to.')

arg_parser.add_argument('--skip-infra', '-I', type=str2bool, nargs='?', const=True, default=False,
                        help='Skip the CloudFormation deployment.')

arg_parser.add_argument('--skip-upload', '-S', type=str2bool, nargs='?', const=True, default=False,
                        help='Skip the upload to the S3 bucket.')

arg_parser.add_argument('--stack-prefix', '-s', type=str, nargs=1, default=default_stack_prefix,
                        help='The prefix to attach to stack names.')

arg_parser.add_argument('--template-dir', '-t', type=str, nargs=1, default=default_template_dir,
                        help='The directory that contains the CloudFormation' +
                        'templates with which to build the stack.')

# Parse arguments.
args = arg_parser.parse_args()

print("Starting infrastructure deployment.")
launch_infrastructure(args)
