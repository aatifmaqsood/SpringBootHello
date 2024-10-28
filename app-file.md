Design Document: Storing Application Properties from Udeploy to GitOps Model
Objective
This document outlines the strategy for transitioning application properties management from Udeploy to a GitOps model. It covers how properties should be stored, organised, and maintained at different levels: application, environment, and region.

Overview
In a traditional Udeploy setup, application properties are often stored in a centralised configuration database or file. The transition to a GitOps model will involve storing these properties as code in a Git repository, allowing for version control, auditable changes, and enhanced deployment capabilities. The goal is to provide a structured way to store properties that ensures scalability, consistency, and ease of management across multiple applications, environments, and regions.
Storage Strategy
File Structure
To manage application properties efficiently, we propose few ways.
1)  Hierarchical file structure within the Git repository. The following structure is recommended:

   /     └── vtest-hello-world         
          ├── values.yaml         
          ├── environments/         
          │   ├── dev/         
          │   │   ├── us-east1.yaml         
          │   │   └── us-east2.yaml         
          │   ├── qa/         
          │   │   ├── us-east1.yaml         
          │   │   └── us-east2.yaml         
          │   └── prod/         
          │       ├── us-east1.yaml         
          │       └── us-east2.yaml         

.
Hierarchy of Properties
To organise properties effectively, it's essential to follow a clear hierarchy that allows overriding and specialisation:
Application Level
The application level is the most generic level. Properties common to all environments and regions should be stored in the application.yaml file.
Example contents of application.yaml:
```yaml
App_ID: 5123412323 database:   connectionTimeout: 5000 logging:   level: INFO api:   baseUrl: https://api.myapp.com
Product_Line: PL38253 ```
Environment Level
Environment-specific properties should be stored in separate directories under the environments folder. Each environment (e.g., dev, qa, prod) will have its own folder containing region-specific property files.
Example of environments/dev/us-east1.yaml:
```yaml database:   url: jdbc:mysql://dev-us-east1-db.myapp.com:3306/mydb   username: dev_user logging:   level: DEBUG api:   baseUrl: https://api.dev.myapp.com
IamUserName: srvAP323235334
AwsUser: AKai
S3bucketName: vtest-hello-world-us-east1-bucket
AccountNumber: 3230942232 ```
Region Level
Properties that are specific to a region (e.g., region-specific database endpoints) should be stored in files like us-east1.yaml or us-east2.yaml under the appropriate environment directory. These files allow finer granularity to manage properties that are unique to a region.
2) Managing application properties using Jinja2 templates can streamline the process of handling environment-specific , region-specific settings. Here's how we can integrate Jinja2 for managing properties in the GitOps model.
/     └── vtest-hello-world         ├── values.yaml.j2         ├── environments/         │   ├── dev/         │   │   ├── us-east1.yaml         │   │   └── us-east2.yaml         │   ├── qa/         │   │   ├── us-east1.yaml         │   │   └── us-east2.yaml         │   └── prod/         │       ├── us-east1.yaml         │       └── us-east2.yaml
       ├── app.yaml

Jinja2 Template Format:
# values.yaml.j2
app_name: {{ app_name }}
environment: {{ environment }}
region: {{ region }}
appID: {{ appID }}
ProductLine: {{ ProductLine }}
s3BucketName: {{ app_name }}-{{ region }}-{{ environment }}
IamUserName: {{ IamUserName }}
AwsUser: {{ AwsUser }}
database:
  host: {{ database_host }}
  port: {{ database_port }}

account_id: {{ account_id }}
log_level : {{ log_level }}


2) application specific properties:
   # app.yaml
   app_name: vtest-hello-world
   appId: 138407
   ProductLine: PL124312

4) Environment specific properties:
   # environments/dev/us-east1.yaml
   environment: dev
   region: us-east1
   IamUserName: srvAP323235334
   AwsUser: Akai
   database:
     host: dev-pg.com
     port: 5432
   account_id: 3289373922
   log_level: debug

   # environments/qa/us-east1.yaml   
environment: qa
IamUserName: srvAP323231211
AwsUser: Lave

database:
     host: qa-pg.com
     port: 5433
 account_id: 539472322
 log_level: Info

Here generated properties file will be merger of template file with regional environmental file. While having this we can achieve and generate rendered file having all properties at runtime using python script or jinja2 cli.
For eg like: jinja2 vtest-hello-world/values.yaml.j2 -f  vtest-hello-world/app.yaml -f environments/dev/us-east1.yaml > rendered-app.yaml


Conclusion
Transitioning from Udeploy to a GitOps model for managing application properties allows for better scalability, version control, and traceability. By following a hierarchical structure for properties and adhering to best practices, the new approach will provide a more reliable and consistent way to manage configurations across environments and regions.
