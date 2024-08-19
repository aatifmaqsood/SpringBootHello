High-Level Overview: Optimizing EMR Cluster Creation Time
1. Introduction
This document outlines steps to speed up the creation of EMR (Elastic MapReduce) clusters in AWS. The aim is to make the process quicker, which will help run data processing jobs more efficiently.

1.1 What Is an EMR Cluster?
An EMR cluster is a group of virtual machines that work together to process large amounts of data. Creating these clusters quickly is important so that data jobs start running as soon as possible.

1.2 Why Is This Important?
If creating a cluster takes too long, it delays the start of data processing tasks, leading to inefficiencies. By speeding up this process, we can make the system more responsive and cost-effective.

2. Current Process
Here’s how the EMR cluster creation process works right now:
2.1 FetchCustomAMI: Retrieves a custom AMI ID from a Lambda function.
2.2 Create an EMR Cluster: Creates an EMR cluster with the custom AMI ID, specifying various configuration options, such as instance types, security groups, and bootstrap actions.
2.3 Stage Cluster Property: Extracts the cluster ID and log URI from the EMR cluster creation response.
2.4 Custom Step: Runs a custom step on the EMR cluster, which executes a Hadoop jar file.
2.5 Publish Result: Publishes the output of the custom step to an SNS topic.
2.6 Terminate Cluster: Terminates the EMR cluster.
2.7 Wait for log file Arrival: Waits for 300 seconds to allow the log files to arrive.
2.8 Bootstrap Log to Splunk Cloud: Forwards the log files to Splunk Cloud using an EMR bootstrap log forwarder.
2.9 Choose Log Approach: Determines whether to log to Splunk Cloud or CloudWatch based on the EMR release label.
2.10 Log to Cloud Watch: Forwards the log files to CloudWatch using an EMR log forwarder.
2.11 Log sync Complete?: Checks if the log sync is complete.
2.12 SuccessState: Indicates that the workflow has completed successfully.

3. Strategies to Speed Up EMR Cluster Creation
3.1 Use Spot Instances
What Are Spot Instances?
Spot Instances are cheaper, unused cloud resources that can be bought at lower prices.

Using Spot Instances in our cluster setup can speed up the process, as they can be quickly allocated when available.

Current Architecture

In Our current architecture, We have a single EMR cluster with a fixed number of on-demand instances. When we submit a job, the cluster is created, and the job is executed on the available instances.

Spot Instance Architecture

By using spot instances, we can create a separate fleet of instances that can be used to execute your jobs. These spot instances can be launched in parallel with our on-demand instances, allowing us to process your jobs faster.

Here's a diagram to illustrate the spot instance architecture:
          +---------------+
          |  On-Demand   |
          |  Instances   |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Spot Instances  |
          |  (Fleet)        |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Job Queue    |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  EMR Cluster  |
          +---------------+
What Do We Need to Do?
Update the cluster setup to include Spot Instances, which will allow us to grab the cheapest and fastest available resources.
          {
            "Name": "EmrTaskFleet",
            "InstanceFleetType": "TASK",
            "TargetSpotCapacity": "${NumberofTaskSpotInstances}",
            "InstanceTypeConfigs": [
              {
                "InstanceType": "${TaskInstanceType}",
                "CustomAmiId.$": "$.CustomAMI.Payload.amId"
              }
            ]
          }
In this updated version, we've added a new instance fleet called "EmrTaskFleet" that uses spot instances. We've also updated the "TargetSpotCapacity" parameter to specify the number of spot instances to launch.
3.2 Reuse Existing Clusters
What Is Cluster Reuse?
Instead of creating a new cluster every time, we can reuse a cluster that’s already running.
How Will This Help?
This approach saves the time it takes to set up a new cluster from scratch.
Reusing existing clusters can help save time in creating an EMR cluster by leveraging clusters that are already running or have been recently terminated. Here's a diagram to illustrate how reusing existing clusters can help:
          +---------------+
          |  Existing   |
          |  Clusters   |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Cluster    |
          |  Repository |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  EMR Cluster |
          |  Creation    |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Reuse      |
          |  Existing   |
          |  Cluster    |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Quick      |
          |  Cluster    |
          |  Creation   |
          +---------------+

In this diagram, we have an existing cluster repository that stores information about clusters that have been created or terminated recently. When a new EMR cluster is requested, the system checks the cluster repository to see if there's an existing cluster that can be reused.

What Do We Need to Do?
Implement a system where clusters can be kept running and reused for multiple jobs, reducing setup time.

If an existing cluster is found, it can be quickly reused, saving time and resources. This approach can reduce the time it takes to create a new cluster from scratch.

{
  "StartAt": "Check Cluster Repository",
  "States": {
    "Check Cluster Repository": {
      "Type": "Task",
      "Resource": "arn:aws:states:::elasticmapreduce:describeCluster",
      "Parameters": {
        "ClusterId.$": "$.clusterRepository.ClusterId"
      },
      "Next": "Reuse Existing Cluster"
    },
    "Reuse Existing Cluster": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.clusterRepository.ClusterStatus",
          "StringEquals": "AVAILABLE",
          "Next": "Configure Cluster"
        }
      ],
      "Default": "Create New Cluster"
    },
    "Create New Cluster": {
      "Type": "Task",
      "Resource": "arn:aws:states:::elasticmapreduce:createCluster.sync",
      "Parameters": {
        ...
      },
      "Next": "Configure Cluster"
    },
    "Configure Cluster": {
      "Type": "Task",
      "Resource": "arn:aws:states:::elasticmapreduce:configureCluster",
      "Parameters": {
        ...
      },
      "Next": "Submit Job"
    },
    ...
  }
}

In this updated version, we've added a new step called "Check Cluster Repository" that checks the cluster repository for existing clusters that can be reused. If an existing cluster is found, the system reuses the cluster and skips the cluster creation step. If no existing cluster is found, the system creates a new cluster from scratch.


3.3 Use EMR on EKS
What Is EMR on EKS?
EKS is Amazon’s managed Kubernetes service. Running EMR on EKS allows you to use Kubernetes to manage EMR jobs.
How Will This Help?
This can reduce the overhead of setting up new clusters by leveraging a pre-existing Kubernetes environment.
Integrating AWS Step Functions with EMR on EKS involves modifying the current workflow to leverage Kubernetes (EKS) as the execution environment for EMR jobs. This integration allows better resource utilization, scaling, and cost efficiency.
How Will This Help?
What Do We Need to Do?
Explore using EMR on EKS to run jobs, which might be faster for certain workloads.

High-Level Process Overview
Fetch Custom AMI:

Current State: Fetches a custom AMI for EMR cluster creation.
EMR on EKS Adaptation: Instead of fetching a custom AMI, Step Functions would trigger a Lambda function to prepare the EKS environment with the necessary configurations and resources, such as custom Docker images for Spark jobs.
Create EMR Cluster:

Current State: Creates an EMR cluster using the custom AMI and other configurations.
EMR on EKS Adaptation: This step will be replaced by a task to create an EMR virtual cluster on EKS. The virtual cluster is an abstraction that allows running EMR jobs on an existing EKS cluster.
Custom Steps:

Current State: Runs specific jobs or steps on the EMR cluster.
EMR on EKS Adaptation: This will remain similar but instead of submitting steps to an EMR cluster, the steps are submitted to the EMR on EKS virtual cluster, running within the EKS environment.
Terminate Cluster:

Current State: Terminates the EMR cluster after job completion.
EMR on EKS Adaptation: Since EMR on EKS operates within an existing Kubernetes cluster, this step may involve cleaning up resources or simply ending the EMR job session. There’s no need to terminate the EKS cluster.
Log Management:

Current State: Forward logs to Splunk or CloudWatch after cluster termination.
EMR on EKS Adaptation: Log forwarding will be managed within the Kubernetes environment, using Fluentd or another logging agent.

-------------------------
| AWS Step Functions    |
|-----------------------|
| 1. Fetch EKS Setup    |
|    - Prepare EKS      |
|      environment      |
|-----------------------|
| 2. Create Virtual     |
|    EMR Cluster        |
|    - Uses EKS API     |
|-----------------------|
| 3. Submit Steps to    |
|    EMR on EKS         |
|    - Run Spark Jobs   |
|-----------------------|
| 4. Manage Resources   |
|    and Cleanup        |
|    - End EMR Session  |
|-----------------------|
| 5. Log Management     |
|    - Forward Logs     |
-------------------------
        |
        |
   -----------------
   | EKS Cluster   |
   |---------------|
   | 1. Runs EMR   |
   |    Virtual    |
   |    Cluster    |
   |---------------|
   | 2. Executes   |
   |    Spark Jobs |
   |    & Steps    |
   -----------------
        |
        |
   -------------------
   | AWS Services    |
   |-----------------|
   | 1. S3 for Logs  |
   | 2. CloudWatch   |
   -------------------

Detailed Workflow Explanation
AWS Step Functions:

Fetch EKS Setup: Step Functions first prepare the EKS environment. This involves ensuring the necessary Docker images are available, configurations are applied, and the virtual cluster is ready.

Create Virtual EMR Cluster: Instead of a physical EMR cluster, the Step Function will create a virtual cluster in the EKS environment using the emr-containers API.

Submit Steps to EMR on EKS: The custom steps (e.g., running Spark jobs) will be submitted to the virtual EMR cluster within EKS. This allows leveraging the Kubernetes environment for better resource allocation.

Manage Resources and Cleanup: Once the job is complete, Step Functions will trigger the cleanup process, which might include terminating the job session and managing any residual resources within EKS.

Log Management: Logs from the Spark jobs and other steps will be forwarded to an external logging service, such as Splunk or CloudWatch, via Fluentd or another logging agent.

EKS Cluster:

Runs EMR Virtual Cluster: EKS will host the EMR virtual cluster, effectively running EMR jobs within its Kubernetes environment. This offers better control over scaling and resource management.

Executes Spark Jobs & Steps: The actual data processing jobs (like Spark jobs) will run within the virtual cluster on EKS. This allows for more efficient scaling and resource usage compared to traditional EMR clusters.

AWS Services:

S3 and CloudWatch for Logs: S3 buckets will store job outputs and logs, while CloudWatch (or other logging services) will manage monitoring and alerts.
4. Benefits of EMR on EKS Integration
Faster Job Start Times: Since the EKS cluster is pre-existing, starting jobs is quicker than spinning up a new EMR cluster.
Cost Efficiency: Better resource management through Kubernetes, leveraging existing infrastructure and potentially using Spot Instances for cost savings.
Scalability: EKS allows for dynamic scaling of resources based on job demands.
Enhanced Flexibility: Kubernetes provides more flexibility in managing different workloads, integrating with other containerized applications and services.

4. Implementation Plan
Modify Infrastructure: Update the EMR creation script to include Spot Instances, parallel tasks, and auto-scaling.
Optimize Application Settings: Fine-tune bootstrap actions and the custom AMI for quicker setup.
Review and Test: Implement the changes in a testing environment to validate improvements.
5. Risks and Considerations
Spot Instance Availability: Spot Instances may not always be available. We’ll need a backup plan using On-Demand Instances if this happens.
Cost Management: Using certain optimizations might incur additional costs. We’ll need to monitor and manage this closely.
Maintenance: Keeping custom AMIs and reusable clusters up-to-date will require regular attention.
6. Conclusion
By implementing these strategies, we aim to reduce the EMR cluster creation time significantly, making our system faster and more efficient. A trial run or proof of concept should be conducted to see how these strategies perform before fully adopting them.

