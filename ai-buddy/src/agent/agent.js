import { StateGraph,MessagesAnnotation } from "@langchain/langgraph";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import { AIMessage, ToolMessage,HumanMessage  } from "@langchain/core/messages";
import dotenv from "dotenv";
import * as tools from "./tools.js";
dotenv.config();
const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.5,
     maxTokens: 2048,
    apiKey: (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim(),
});


const graph = new StateGraph(MessagesAnnotation)
.addNode("tools",async (state,config) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const toolsCall = lastMessage.tool_calls;

    const toolCallResults = await Promise.all(toolsCall.map(async (call) => {

const toolMap = {
    search_product: tools.searchProduct,
    add_product_to_cart: tools.addProductToCart,
};
        const tool = toolMap[call.name];

        if (!tool) {
            throw new Error(`Tool ${call.name} not found`);
        }
        const toolInput = call.args;
        const toolResult = await tool.func({...toolInput, token: config.metadata.token})
        return new ToolMessage({
            content: toolResult,
            name: call.name,
        });
    }));
    state.messages.push(...toolCallResults);
    return state;
})
.addNode("chat", async (state,config) => {  
    const response = await model.invoke(state.messages, { tools: [ tools.searchProduct, tools.addProductToCart ] })


        state.messages.push(new AIMessage({ content: response.text, tool_calls: response.tool_calls }))

        return state;  

        })
        .addEdge("__start__","chat")
        .addConditionalEdges("chat",async (state) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
                return "tools";
            }
            else {
                return "__end__";

            }
        })
        .addEdge("tools","chat");

const agent =  graph.compile();
export default agent;







