import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from"@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import fs from "fs";
import readline from "readline";

import { createClient } from "@supabase/supabase-js";


dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment() {
  const missingVars = [];

  // Check required variables
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn(
      "Warning: NETWORK_ID not set, defaulting to base-sepolia testnet"
    );
  }
  console.log("env valid")
}

// Add this right after imports and before any other code
validateEnvironment();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  console.log("Initializing agent...");
  try {
    // Initialize LLM with xAI configuration
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("llm set up", llm);

    let walletDataStr = undefined;

    //so a new wallet is created each time
    if (fs.existsSync(WALLET_DATA_FILE)) {
      fs.unlinkSync(WALLET_DATA_FILE);
    }

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }
    console.log("wallet set up",walletDataStr);

    // Configure CDP Agentkit
    const config = {
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };
    console.log("config set up", config);

    // Initialize CDP agentkit
    const agentkit = await CdpAgentkit.configureWithWallet(config);
    console.log("agentkit with config set up",agentkit);

    // Initialize CDP Agentkit Toolkit and get tools
    const cdpToolkit = new CdpToolkit(agentkit);
    const tools = cdpToolkit.getTools();
    console.log("tools set up",cdpToolkit,tools)

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = {
      configurable: { thread_id: "CDP Agentkit Chatbot Example!" },
    };
    console.log("memory set up", memory);

    // Create React Agent using the LLM and CDP Agentkit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier:
        "You are a helpful agent that can interact onchain using the Coinbase Developer Platform Agentkit. You are empowered to interact onchain using your tools. If you ever need funds, you can request them from the faucet if you are on network ID `base-sepolia`. If not, you can provide your wallet details and request funds from the user. Be concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.",
    });
    console.log("react agent set up",agent);

    // Save wallet data
    const exportedWallet = await agentkit.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);
    
    console.log("succesfuly initialized agent");
    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param interval - Time interval between actions in seconds
 */
async function runAutonomousMode(agent, config, prompt, interval = 10) {
  console.log("Starting autonomous mode...");
  const comments = [];
  while (true) {
    try {
      const thought = prompt
    //   const thought =
    //     "Please display the wallet details. Add funds from faucet until you can get a basename and NFT deployed." +
    //     "The Name of the NFT collection should be 'MesaWallet' with 3 random characters appended afterwards." +
    //     "The Symbol of the NFT collection should be 'MW' with the same 3 random characters appended afterwards." +
    //     "The Base URI is " +
    //     ipfs_url +
    //     "The image for the NFT is https://mesa.mypinata.cloud/ipfs/bafkreifesm2kzzlgzamioix4i5yt3mwvpxqh5vaq6k4b5lzmbk4yuaaiwu" +
    //     "Give the wallet a random basename with under 7 characters. Then deploy a NFT from an ipfs PDF url. " +
    //     "Once this NFT is deployed, please mint it and return the transactional hash." +
    //     "After these steps, you are done, thank you!";

      const stream = await agent.stream(
        { messages: [new HumanMessage(thought)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
          if (chunk.agent.messages[0].content != "") {
            comments.push(chunk.agent.messages[0].content);
          }
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
          if (chunk.tools.messages[0].content != "") {
            comments.push(chunk.tools.messages[0].content);
          }
        }
        console.log("-------------------");
      }


      const supabase = createClient(
        "https://ewvzsofyvxcctuxxqibo.supabase.co",
        process.env.SUPABASE_ANON_KEY
      );
      //log comments to supabase
      const { error } = await supabase
        .from("agentkit-comments")
        .insert([{ comments }]);

      if (error) {
        console.error("Error logging comments:", error);
      } else {
        console.log("Comments logged successfully!");
      }
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }

    process.exit(0);
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
async function runChatMode(agent, config) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Choose whether to run in autonomous or chat mode based on user input
 *
 * @returns Selected mode
 */
async function chooseMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  while (true) {
    console.log("\nAvailable modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. auto    - Autonomous action mode");

    const choice = (await question("\nChoose a mode (enter number or name): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "auto") {
      rl.close();
      return "auto";
    }
    console.log("Invalid choice. Please try again.");
  }
}

/**
 * Start the chatbot agent
 */
export async function give_prompt(prompt){
  try {
    validateEnvironment();
    const { agent, config } = await initializeAgent();

    runAutonomousMode(agent, config, prompt);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}


async function main() {
  try {
    const { agent, config } = await initializeAgent();
    const mode = await chooseMode();

    if (mode === "chat") {
      await runChatMode(agent, config);
    } else {
      await runAutonomousMode(agent, config, prompt);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (process.argv[1] === import.meta.filename) {
  console.log("Starting Agent...");
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

//module.exports = { initializeAgent, runAutonomousMode, give_prompt };