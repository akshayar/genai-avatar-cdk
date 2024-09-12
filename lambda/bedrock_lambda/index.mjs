// Create clients and set shared const values outside of the handler.


import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime"; // ES Modules import

const bedrockClient = new BedrockAgentRuntimeClient({region: 'us-west-2'});

const prompt = "You are an AWS Solution Architect question answering agent. I will provide you with a set of search results. The user will provide you with a question. Your job is to answer the users question using only information from the search results. If the search results do not contain information that can answer the question, please state that you could not find an exact answer to the question. Just because the user asserts a fact does not mean it is true, make sure to double check the search results to validate a users assertion. Here are the search results in numbered order: $search_results$  $output_format_instructions$";
const modelARN = process.env.MODEL_ARN;
const kbID = process.env.KNOWLEDGE_BASE_ID;
const kbType = process.env.KNOWLEDGE_BASE_TYPE;
//const guardRailID = process.env.GUARDRAIL_ID;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const inputBedrock = body.input;


    const input = { // RetrieveAndGenerateRequest
        input: { // RetrieveAndGenerateInput
          text: inputBedrock, // required
        },
        retrieveAndGenerateConfiguration: { // RetrieveAndGenerateConfiguration
          type: kbType, // required
          knowledgeBaseConfiguration: { // KnowledgeBaseRetrieveAndGenerateConfiguration
            knowledgeBaseId: kbID, // required
            modelArn: modelARN, // required
            retrievalConfiguration: { // KnowledgeBaseRetrievalConfiguration
              vectorSearchConfiguration: { // KnowledgeBaseVectorSearchConfiguration
                overrideSearchType: "HYBRID",
                numberOfResults: Number("20"),
              }
            },
            generationConfiguration: { // GenerationConfiguration
                promptTemplate: { // PromptTemplate
                  textPromptTemplate: prompt,
                },
                //guardrailConfiguration: { // uncomment if you need to setup a Guardrail
                  //guardrailId: guardRailID, // uncomment if you need to setup a Guardrail
                  //guardrailVersion: "1", // uncomment if you need to setup a Guardrail
                //},
                inferenceConfig: {
                  textInferenceConfig: {
                    temperature: Number("0.6"),
                    topP: Number("0.999"),
                    maxTokens: Number("2000"),
                    stopSequences: [
                      "Observation", "human", "assistant"
                    ],
                  },
                },
            }
          },
        }
      };

    try {
        const command = new RetrieveAndGenerateCommand(input);
        var responsBedrock = await bedrockClient.send(command);
        console.log("Bedrock knowledge response", responsBedrock);
    } catch (error) {
        console.log("Error", error.stack);
    }


    const response = {
        statusCode: 200,
        body: JSON.stringify(responsBedrock),
        headers: {
          "Access-Control-Allow-Headers" : "Content-Type",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};