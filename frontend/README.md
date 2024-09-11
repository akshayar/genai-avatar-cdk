# Amazon Sumerian Host Babylon.js Demos

This directory contains a number of demonstrations, each focused on a different feature of the Hosts API.

## Prerequisites

Before you can run the demos, you will need to set up a few thing in your AWS account. For step-by-step instructions on setting up this required infrastructure, see [AWS-Infrastructure-Setup.md](AWS-Infrastructure-Setup.md).

## Local Environment Setup

In a terminal on your local machine, navigate to the repository root directory and run...

```
chmod +x setup.sh
./setup.sh
```

You will be asked to answer some questions such as language, `cognitoIdentityPoolId`, character and so on. After that some file will be updated and you can run:

```
npm install
```


## Running the Demos Locally

In a terminal, navigate to repository root directory.

Start the demo server by running...

```
npm run start
```

This starts a local web server and launches two new browser tabs. The tab that will have focus will be titled **"BabylonJS Sumerian Host Demos"**. Click on any demo to give it a try.

When you're finished with the demos, you can quit the local dev server by pressing CTRL-C in the same terminal in which you started the server.

## Deploying the Demos to a Web Server

If you'd like to deploy the demos to a web server so that others can access them follow the steps below.

Run the following command which will build a deployable version of the web application.

```
npm run build
```

The command above outputs the deployable files to a "dist" folder. Deploy all the files inside the "dist" folder to your web server.

> 💡**Tip:** If you want an easy solution for hosting these demos, [AWS Amplify](https://aws.amazon.com/amplify) provides a simple drag-and-drop interface for hosting static web applications.

Congratulations! The demos are now accessible to anyone who can access that web server. 🎉
