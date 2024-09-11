# Avatar Generative AI Demo

![Amazon Sumerian Host characters](./images/hosts_cover.jpg)

## Front End Personalization 

* You can edit HTML title and chatbot name  in `index.html` file, line 8.
* You can edit messages that will show in demo there are in `messages-es-mx.js` file, such as: chatbot name, welcome message, example question, errors.
* You can change avatar models and Amazon Polly voices in `alexaTMDemo.js` file changing lines 66 and 68.

## Back End Personalization

* You can add an Amazon Bedrock Guardrail to Lambda, create a Guardrail and uncomment Lambda comments inside `generationConfiguration` key

## Deploy the project into your AWS Account
> ***Check that you have available Claude models and Cohere Embed Multilingual in Amazon Bedrock under `Model Access`***.
```
git clone https://github.com/abarrales/genai-avatar-cdk.git
```
Add the file you want the Avatar to respond from into the `files/` directory. Right now it has the Solutions Architect Associate Exam Guide. Delete it and add your file.
> ***It is required that you have access to codecommit in order to deploy the demo. We recommend uploading the repository to CodeCommit, create a Cloud9 instance, clone the CodeCommit repository and run the following commands in Cloud9***.
```
cd genai-avatar-cdk
npm install
sh setup.sh
```
After the deployment you have to manually sync the source from the knowledge base from Bedrock in the AWS Console.


