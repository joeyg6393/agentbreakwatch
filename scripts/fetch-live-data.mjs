import fs from "node:fs/promises";
import path from "node:path";

const TARGETS = [
  {
    "slug": "openai-node",
    "packageName": "openai",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "OpenAI Node SDK",
    "vendor": "OpenAI",
    "githubRepo": "openai/openai-node",
    "breakingSummary": "Responses API and realtime event payloads updated; Chat Completions tool_choice strict schema enforcement tightened in v7.x.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "client.responses.create",
      "client.chat.completions.create",
      "RealtimeClient"
    ],
    "migrationBefore": "const res = await client.chat.completions.create({\n  model: \"gpt-4o\",\n  functions: [{ name: \"lookup\", parameters: schema }],\n  function_call: \"auto\"\n});",
    "migrationAfter": "const res = await client.responses.create({\n  model: \"gpt-5\",\n  tools: [{ type: \"function\", name: \"lookup\", parameters: schema, strict: true }],\n  tool_choice: \"auto\"\n});"
  },
  {
    "slug": "anthropic-sdk-ts",
    "packageName": "@anthropic-ai/sdk",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "Anthropic TypeScript SDK",
    "vendor": "Anthropic",
    "githubRepo": "anthropics/anthropic-sdk-typescript",
    "breakingSummary": "Major v1.x transition drops legacy completions helpers and enforces typed beta headers for computer-use, code-execution, and MCP connector blocks.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "anthropic.messages.create",
      "ToolUseBlock",
      "BetaMcpToolConfig"
    ],
    "migrationBefore": "const msg = await anthropic.beta.messages.create({\n  model: \"claude-3-7-sonnet-20250219\",\n  betas: [\"token-efficient-tools-2025-02-19\"],\n  messages\n});",
    "migrationAfter": "const msg = await anthropic.messages.create({\n  model: \"claude-sonnet-4-5\",\n  thinking: { type: \"enabled\", budget_tokens: 4096 },\n  messages\n});"
  },
  {
    "slug": "mcp-sdk-ts",
    "packageName": "@modelcontextprotocol/sdk",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "MCP Core SDK",
    "displayName": "Model Context Protocol TypeScript SDK",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "v1.x is now a backport line while v2 ships as split @modelcontextprotocol/server and @modelcontextprotocol/client packages. Streamable HTTP transport replaces legacy SSEClientTransport defaults; McpServer.registerTool inputSchema requires Zod object shape or JSON Schema draft-2020-12.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "McpServer",
      "StreamableHTTPServerTransport",
      "SSEClientTransport",
      "registerTool"
    ],
    "migrationBefore": "import { SSEServerTransport } from \"@modelcontextprotocol/sdk/server/sse.js\";\nconst transport = new SSEServerTransport(\"/messages\", res);\nawait server.connect(transport);",
    "migrationAfter": "import { StreamableHTTPServerTransport } from \"@modelcontextprotocol/sdk/server/streamableHttp.js\";\nconst transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });\nawait server.connect(transport);"
  },
  {
    "slug": "mcp-server-ts-v2",
    "packageName": "@modelcontextprotocol/server",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "MCP Core SDK",
    "displayName": "MCP TypeScript SDK v2 Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "v2 split of @modelcontextprotocol/sdk. 2.4.0 rejects x-mcp-header on number parameters (error -32020, per the 2026-07-28 spec), stops wrapping outputSchema results from z.object().meta({ id }) in { result } on 2025-11-25 connections, and its bundled Ajv rejects $id or $ref values with an invalid URI scheme.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "McpServer",
      "registerTool",
      "outputSchema",
      "structuredContent",
      "x-mcp-header"
    ],
    "migrationBefore": "import { McpServer } from \"@modelcontextprotocol/sdk/server/mcp.js\";\n// client code read structuredContent.result",
    "migrationAfter": "import { McpServer } from \"@modelcontextprotocol/server\";\n// on 2025-11-25 connections read structuredContent directly\n// use z.int() for any parameter annotated with x-mcp-header"
  },
  {
    "slug": "mcp-client-ts-v2",
    "packageName": "@modelcontextprotocol/client",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "MCP Core SDK",
    "displayName": "MCP TypeScript SDK v2 Client",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "v2 split of @modelcontextprotocol/sdk. Since 2.4.0 the client does not list tools that put x-mcp-header on a number parameter, and outputSchema results built from z.object().meta({ id }) arrive unwrapped in structuredContent on 2025-11-25 connections.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "Client",
      "listTools",
      "callTool",
      "structuredContent",
      "OAuthClientProvider"
    ],
    "migrationBefore": "import { Client } from \"@modelcontextprotocol/sdk/client/index.js\";\nconst value = result.structuredContent.result;",
    "migrationAfter": "import { Client } from \"@modelcontextprotocol/client\";\nconst value = result.structuredContent;"
  },
  {
    "slug": "vercel-ai-sdk",
    "packageName": "ai",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "Vercel AI SDK Core",
    "vendor": "Vercel",
    "githubRepo": "vercel/ai",
    "breakingSummary": "AI SDK v7 unifies LanguageModelV3 provider specifications, replaces maxSteps with stopWhen(stepCountIs(n)), and restructures UIMessage stream parts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "generateText",
      "streamText",
      "tool",
      "stopWhen",
      "UIMessage"
    ],
    "migrationBefore": "const result = await generateText({\n  model: openai(\"gpt-4o\"),\n  maxSteps: 5,\n  tools: { weather: tool({ parameters: z.object({ city: z.string() }), execute }) }\n});",
    "migrationAfter": "const result = await generateText({\n  model: openai(\"gpt-5\"),\n  stopWhen: stepCountIs(5),\n  tools: { weather: tool({ inputSchema: z.object({ city: z.string() }), execute }) }\n});"
  },
  {
    "slug": "ai-sdk-openai",
    "packageName": "@ai-sdk/openai",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "Vercel AI SDK OpenAI Provider",
    "vendor": "Vercel",
    "githubRepo": "vercel/ai",
    "breakingSummary": "v4 provider targets LanguageModelV3 spec and defaults to OpenAI Responses API for reasoning and built-in web/file search tools.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "openai",
      "openai.responses",
      "providerOptions.openai"
    ],
    "migrationBefore": "const model = openai(\"gpt-4o\", { structuredOutputs: true });",
    "migrationAfter": "const model = openai.responses(\"gpt-5\");"
  },
  {
    "slug": "ai-sdk-anthropic",
    "packageName": "@ai-sdk/anthropic",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "Vercel AI SDK Anthropic Provider",
    "vendor": "Vercel",
    "githubRepo": "vercel/ai",
    "breakingSummary": "v4 provider requires AI SDK 7+ and moves thinking budget configuration under providerOptions.anthropic.thinking.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "anthropic",
      "providerOptions.anthropic.thinking"
    ],
    "migrationBefore": "const model = anthropic(\"claude-3-7-sonnet-20250219\", { sendReasoning: true });",
    "migrationAfter": "const result = await generateText({\n  model: anthropic(\"claude-sonnet-4-5\"),\n  providerOptions: { anthropic: { thinking: { type: \"enabled\", budgetTokens: 4000 } } }\n});"
  },
  {
    "slug": "langchain-core-js",
    "packageName": "@langchain/core",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "LangChain Core JS",
    "vendor": "LangChain",
    "githubRepo": "langchain-ai/langchainjs",
    "breakingSummary": "v1.x removes deprecated RunnableBinding legacy call signatures and standardizes ToolMessage artifact and content_blocks metadata.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "StructuredTool",
      "RunnableSequence",
      "AIMessage",
      "bindTools"
    ],
    "migrationBefore": "const res = await model.call(messages, { functions: toolDefs });",
    "migrationAfter": "const modelWithTools = model.bindTools(toolDefs);\nconst res = await modelWithTools.invoke(messages);"
  },
  {
    "slug": "langgraph-js",
    "packageName": "@langchain/langgraph",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "LangGraph.js",
    "vendor": "LangChain",
    "githubRepo": "langchain-ai/langgraphjs",
    "breakingSummary": "v1.x StateGraph Annotation reducer syntax and interrupt() resume semantics updated; createReactAgent moved to @langchain/langgraph/prebuilt.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "StateGraph",
      "Annotation",
      "interrupt",
      "Command"
    ],
    "migrationBefore": "const workflow = new StateGraph({ channels: { messages: { value: (a, b) => a.concat(b) } } });",
    "migrationAfter": "const State = Annotation.Root({ messages: Annotation({ reducer: (a, b) => a.concat(b) }) });\nconst workflow = new StateGraph(State);"
  },
  {
    "slug": "langchain-mcp-adapters",
    "packageName": "@langchain/mcp-adapters",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "MCP Core SDK",
    "displayName": "LangChain MCP Adapters",
    "vendor": "LangChain",
    "githubRepo": "langchain-ai/langchainjs",
    "breakingSummary": "v2.0 requires @langchain/core >= 1.0 and @modelcontextprotocol/sdk >= 1.20; MultiServerMCPClient transport config enforces explicit transport type.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "MultiServerMCPClient",
      "loadMcpTools"
    ],
    "migrationBefore": "const client = new MultiServerMCPClient({ math: { command: \"node\", args: [\"server.js\"] } });\nawait client.initializeConnections();",
    "migrationAfter": "const client = new MultiServerMCPClient({\n  mcpServers: { math: { transport: \"stdio\", command: \"node\", args: [\"server.js\"] } }\n});\nconst tools = await client.getTools();"
  },
  {
    "slug": "mastra-core",
    "packageName": "@mastra/core",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "Mastra Core Framework",
    "vendor": "Mastra",
    "githubRepo": "mastra-ai/mastra",
    "breakingSummary": "Rapid v1.x cadence updates Agent memory thread scoping, createTool inputSchema validation, and workflow step execution context.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "Mastra",
      "Agent",
      "createTool",
      "createWorkflow"
    ],
    "migrationBefore": "const agent = new Agent({ name: \"helper\", llm: { provider: \"OPEN_AI\", name: \"gpt-4o\" } });",
    "migrationAfter": "const agent = new Agent({ id: \"helper\", name: \"helper\", model: openai(\"gpt-5\") });"
  },
  {
    "slug": "openai-agents-js",
    "packageName": "@openai/agents",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "OpenAI Agents SDK (JS/TS)",
    "vendor": "OpenAI",
    "githubRepo": "openai/openai-agents-js",
    "breakingSummary": "0.x minor releases regularly refine handoff filter signatures, hosted MCP tool definitions, and RealtimeAgent voice session events.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "Agent",
      "run",
      "tool",
      "handoff",
      "hostedMcpTool"
    ],
    "migrationBefore": "const myTool = tool({ name: \"search\", parameters: z.object({ q: z.string() }), execute: async ({ q }) => q });",
    "migrationAfter": "const myTool = tool({\n  name: \"search\",\n  description: \"Search docs\",\n  parameters: z.object({ q: z.string() }),\n  strict: true,\n  execute: async ({ q }) => q\n});"
  },
  {
    "slug": "google-genai-js",
    "packageName": "@google/genai",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "Google Gen AI SDK (JS/TS)",
    "vendor": "Google",
    "githubRepo": "googleapis/js-genai",
    "breakingSummary": "Replaces deprecated @google/generative-ai package; v2.x standardizes ai.models.generateContent and functionDeclarations schema typing.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "GoogleGenAI",
      "ai.models.generateContent",
      "FunctionDeclaration"
    ],
    "migrationBefore": "import { GoogleGenerativeAI } from \"@google/generative-ai\";\nconst genAI = new GoogleGenerativeAI(API_KEY);\nconst model = genAI.getGenerativeModel({ model: \"gemini-1.5-pro\" });",
    "migrationAfter": "import { GoogleGenAI } from \"@google/genai\";\nconst ai = new GoogleGenAI({ apiKey: API_KEY });\nconst response = await ai.models.generateContent({ model: \"gemini-2.5-pro\", contents: \"Hello\" });"
  },
  {
    "slug": "stagehand",
    "packageName": "@browserbasehq/stagehand",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Browser Agent SDK",
    "displayName": "Stagehand Browser Agent SDK",
    "vendor": "Browserbase",
    "githubRepo": "browserbase/stagehand",
    "breakingSummary": "v4.x overhauls stagehand.act() and stagehand.extract() options object, separating modelClient configuration from Playwright page lifecycle.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "Stagehand",
      "page.act",
      "page.extract",
      "page.observe"
    ],
    "migrationBefore": "await stagehand.page.act({ action: \"click sign in\", modelName: \"gpt-4o\" });",
    "migrationAfter": "await stagehand.act(\"click sign in\");"
  },
  {
    "slug": "mistralai-sdk",
    "packageName": "@mistralai/mistralai",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "Mistral AI TypeScript SDK",
    "vendor": "Mistral AI",
    "githubRepo": "mistralai/client-ts",
    "breakingSummary": "v3.x generated via Speakeasy updates camelCase request fields and agents.complete tool call response union types.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "Mistral",
      "client.chat.complete",
      "client.agents.complete"
    ],
    "migrationBefore": "import MistralClient from \"@mistralai/mistralai\";\nconst client = new MistralClient(apiKey);",
    "migrationAfter": "import { Mistral } from \"@mistralai/mistralai\";\nconst client = new Mistral({ apiKey });"
  },
  {
    "slug": "cohere-ai-js",
    "packageName": "cohere-ai",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "Cohere TypeScript SDK",
    "vendor": "Cohere",
    "githubRepo": "cohere-ai/cohere-typescript",
    "breakingSummary": "v8.x defaults to Cohere Chat v2 endpoint (CohereClientV2) with OpenAI-style messages and strict tool parameter schemas.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "CohereClientV2",
      "cohere.chat"
    ],
    "migrationBefore": "const cohere = new CohereClient({ token });\nawait cohere.chat({ message: \"hi\", connectors: [{ id: \"web-search\" }] });",
    "migrationAfter": "const cohere = new CohereClientV2({ token });\nawait cohere.chat({ model: \"command-a-03-2025\", messages: [{ role: \"user\", content: \"hi\" }] });"
  },
  {
    "slug": "openai-python",
    "packageName": "openai",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "OpenAI Python SDK",
    "vendor": "OpenAI",
    "githubRepo": "openai/openai-python",
    "breakingSummary": "v3.x Python SDK enforces Pydantic v2 strict models on client.responses.parse and removes legacy beta.threads assistants helpers.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "OpenAI",
      "AsyncOpenAI",
      "client.responses.parse"
    ],
    "migrationBefore": "completion = client.beta.chat.completions.parse(\n    model=\"gpt-4o\",\n    messages=messages,\n    response_format=CalendarEvent,\n)",
    "migrationAfter": "response = client.responses.parse(\n    model=\"gpt-5\",\n    input=messages,\n    text_format=CalendarEvent,\n)"
  },
  {
    "slug": "anthropic-python",
    "packageName": "anthropic",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Model Provider SDK",
    "displayName": "Anthropic Python SDK",
    "vendor": "Anthropic",
    "githubRepo": "anthropics/anthropic-sdk-python",
    "breakingSummary": "v2.x drops Python 3.9 support, requires typed thinking blocks on multi-turn tool loops, and updates streaming citation events.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "Anthropic",
      "AsyncAnthropic",
      "messages.stream"
    ],
    "migrationBefore": "client.beta.prompt_caching.messages.create(model=\"claude-3-5-sonnet-20241022\", messages=msgs)",
    "migrationAfter": "client.messages.create(model=\"claude-sonnet-4-5\", max_tokens=4096, messages=msgs)"
  },
  {
    "slug": "mcp-python",
    "packageName": "mcp",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "MCP Core SDK",
    "displayName": "Model Context Protocol Python SDK",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/python-sdk",
    "breakingSummary": "v2.x restructures FastMCP lifespan context, StreamableHTTP session handling, and CallToolResult structuredContent validation.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "FastMCP",
      "ClientSession",
      "streamablehttp_client",
      "CallToolResult"
    ],
    "migrationBefore": "from mcp.client.sse import sse_client\nasync with sse_client(\"http://localhost:8000/sse\") as (read, write):\n    async with ClientSession(read, write) as session:\n        await session.initialize()",
    "migrationAfter": "from mcp.client.streamable_http import streamablehttp_client\nasync with streamablehttp_client(\"http://localhost:8000/mcp\") as (read, write, _):\n    async with ClientSession(read, write) as session:\n        await session.initialize()"
  },
  {
    "slug": "fastmcp-python",
    "packageName": "fastmcp",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "MCP Core SDK",
    "displayName": "FastMCP (Python)",
    "vendor": "Prefect / Jlowin",
    "githubRepo": "jlowin/fastmcp",
    "breakingSummary": "FastMCP v4.x introduces OpenAPI/MCP composition mounts, OAuth proxy providers, and strict output_schema serialization.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "FastMCP",
      "Context",
      "Client",
      "mount"
    ],
    "migrationBefore": "mcp.mount(\"sub\", sub_server)",
    "migrationAfter": "mcp.mount(sub_server, prefix=\"sub\")"
  },
  {
    "slug": "langgraph-python",
    "packageName": "langgraph",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "LangGraph (Python)",
    "vendor": "LangChain",
    "githubRepo": "langchain-ai/langgraph",
    "breakingSummary": "v1.x standardizes human-in-the-loop interrupt() and Command(resume=...) primitives and moves prebuilt agents to langgraph.prebuilt.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "StateGraph",
      "interrupt",
      "Command",
      " InMemorySaver"
    ],
    "migrationBefore": "from langgraph.checkpoint.sqlite import SqliteSaver\nmemory = SqliteSaver.from_conn_string(\":memory:\")",
    "migrationAfter": "from langgraph.checkpoint.memory import InMemorySaver\ncheckpointer = InMemorySaver()"
  },
  {
    "slug": "crewai-python",
    "packageName": "crewai",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "CrewAI",
    "vendor": "CrewAI",
    "githubRepo": "crewAIInc/crewAI",
    "breakingSummary": "v1.x Flows and Crew memory backends use native LiteLLM / provider clients and enforce BaseTool args_schema Pydantic v2 classes.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "Agent",
      "Task",
      "Crew",
      "Flow",
      "BaseTool"
    ],
    "migrationBefore": "from crewai_tools import tool\n@tool(\"search\")\ndef search(q: str) -> str: ...",
    "migrationAfter": "from crewai.tools import tool\n@tool(\"search\")\ndef search(q: str) -> str:\n    \"\"\"Search query\"\"\"\n    return q"
  },
  {
    "slug": "pydantic-ai",
    "packageName": "pydantic-ai",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "PydanticAI",
    "vendor": "Pydantic",
    "githubRepo": "pydantic/pydantic-ai",
    "breakingSummary": "v2.x replaces result_type with output_type on Agent(), and renames result.data to result.output across all run methods.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "Agent",
      "RunContext",
      "MCPServerStdio",
      "MCPServerStreamableHTTP"
    ],
    "migrationBefore": "agent = Agent(\"openai:gpt-4o\", result_type=MyModel)\nresult = await agent.run(\"hello\")\nprint(result.data)",
    "migrationAfter": "agent = Agent(\"openai:gpt-5\", output_type=MyModel)\nresult = await agent.run(\"hello\")\nprint(result.output)"
  },
  {
    "slug": "litellm-python",
    "packageName": "litellm",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Model Router / Gateway",
    "displayName": "LiteLLM",
    "vendor": "BerriAI",
    "githubRepo": "BerriAI/litellm",
    "breakingSummary": "High-frequency releases update model cost maps, Anthropic/Bedrock tool call argument normalization, and MCP gateway bridge routes.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "completion",
      "acompletion",
      "responses",
      "experimental_mcp_client"
    ],
    "migrationBefore": "res = litellm.completion(model=\"claude-3-sonnet\", messages=msgs, functions=fns)",
    "migrationAfter": "res = litellm.completion(model=\"anthropic/claude-sonnet-4-5\", messages=msgs, tools=tools)"
  },
  {
    "slug": "dspy-python",
    "packageName": "dspy",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "DSPy",
    "vendor": "Stanford NLP",
    "githubRepo": "stanfordnlp/dspy",
    "breakingSummary": "DSPy v3.x unifies dspy.LM() with LiteLLM identifiers, removes legacy dspy.OpenAI classes, and updates dspy.ReAct tool wrapping.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "dspy.LM",
      "dspy.ReAct",
      "dspy.Tool",
      "dspy.MIPROv2"
    ],
    "migrationBefore": "lm = dspy.OpenAI(model=\"gpt-4o\")\ndspy.settings.configure(lm=lm)",
    "migrationAfter": "lm = dspy.LM(\"openai/gpt-5\")\ndspy.configure(lm=lm)"
  },
  {
    "slug": "openai-agents-python",
    "packageName": "openai-agents",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "OpenAI Agents SDK (Python)",
    "vendor": "OpenAI",
    "githubRepo": "openai/openai-agents-python",
    "breakingSummary": "Updates MCPServerStreamableHttp params, RunConfig tracing processors, and strict JSON Schema validation for @function_tool.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "Agent",
      "Runner",
      "function_tool",
      "MCPServerStreamableHttp"
    ],
    "migrationBefore": "@function_tool\ndef fetch_weather(city: str, units: str = \"c\") -> str: ...",
    "migrationAfter": "@function_tool(strict_mode=True)\ndef fetch_weather(city: str, units: str) -> str: ..."
  },
  {
    "slug": "mcp-server-filesystem",
    "packageName": "@modelcontextprotocol/server-filesystem",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Filesystem Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers",
    "breakingSummary": "Major v2.0.0 release enforces roots protocol capabilities, tightens symlink path traversal validation, and updates edit_file dryRun diff schema.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "read_text_file",
      "read_multiple_files",
      "edit_file",
      "list_allowed_directories"
    ],
    "migrationBefore": "// tools/call: read_file (legacy alias)\n{ \"name\": \"read_file\", \"arguments\": { \"path\": \"/workspace/app.ts\" } }",
    "migrationAfter": "// tools/call: read_text_file (v2.0.0+)\n{ \"name\": \"read_text_file\", \"arguments\": { \"path\": \"/workspace/app.ts\", \"head\": 200 } }"
  },
  {
    "slug": "mcp-server-memory",
    "packageName": "@modelcontextprotocol/server-memory",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Knowledge Graph Memory Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers",
    "breakingSummary": "Major v2.0.0 release updates MEMORY_FILE_PATH env handling and enforces strict entityType and observations array validation in create_entities.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "create_entities",
      "create_relations",
      "add_observations",
      "search_nodes"
    ],
    "migrationBefore": "{ \"name\": \"create_entities\", \"arguments\": { \"entities\": [{ \"name\": \"User\", \"type\": \"person\" }] } }",
    "migrationAfter": "{ \"name\": \"create_entities\", \"arguments\": { \"entities\": [{ \"name\": \"User\", \"entityType\": \"person\", \"observations\": [] }] } }"
  },
  {
    "slug": "mcp-server-sequential-thinking",
    "packageName": "@modelcontextprotocol/server-sequential-thinking",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Sequential Thinking Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers",
    "breakingSummary": "Major v2.0.0 release adds structured outputSchema validation to sequentialthinking tool responses and requires strict boolean nextThoughtNeeded.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "sequentialthinking"
    ],
    "migrationBefore": "{ \"thought\": \"Step 1\", \"thoughtNumber\": 1, \"totalThoughts\": 3, \"nextThoughtNeeded\": \"true\" }",
    "migrationAfter": "{ \"thought\": \"Step 1\", \"thoughtNumber\": 1, \"totalThoughts\": 3, \"nextThoughtNeeded\": true }"
  },
  {
    "slug": "mcp-server-everything",
    "packageName": "@modelcontextprotocol/server-everything",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Everything Conformance Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers",
    "breakingSummary": "Major v2.0.0 release aligns test tools, prompts, and resources with MCP 2025-11-25 / 2026 spec features including elicitation and audio blocks.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "echo",
      "annotatedMessage",
      "getResourceReference",
      "startElicitation"
    ],
    "migrationBefore": "npx -y @modelcontextprotocol/server-everything sse",
    "migrationAfter": "npx -y @modelcontextprotocol/server-everything streamableHttp"
  },
  {
    "slug": "mcp-server-github",
    "packageName": "@modelcontextprotocol/server-github",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP GitHub Server (Legacy NPM)",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "Archived on npm at v2025.4.8 in favor of GitHub's official remote/Docker ghcr.io/github/github-mcp-server; tool names and pagination parameters differ.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "create_or_update_file",
      "search_repositories",
      "create_pull_request"
    ],
    "migrationBefore": "\"github\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/server-github\"]\n}",
    "migrationAfter": "\"github\": {\n  \"url\": \"https://api.githubcopilot.com/mcp/\",\n  \"headers\": { \"Authorization\": \"Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}\" }\n}"
  },
  {
    "slug": "mcp-server-postgres",
    "packageName": "@modelcontextprotocol/server-postgres",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP PostgreSQL Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "Frozen at v0.6.2 in archived reference servers; lacks MCP 2025+ Streamable HTTP and parameterized query tools.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "query"
    ],
    "migrationBefore": "npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb",
    "migrationAfter": "npx -y @zeddotdev/postgres-context-server postgresql://localhost/mydb"
  },
  {
    "slug": "mcp-server-slack",
    "packageName": "@modelcontextprotocol/server-slack",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Slack Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "v2025.4.25 requires SLACK_TEAM_ID and SLACK_BOT_TOKEN env vars; legacy workspace token auth fails.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "slack_list_channels",
      "slack_post_message",
      "slack_get_channel_history"
    ],
    "migrationBefore": "\"env\": { \"SLACK_TOKEN\": \"xoxb-...\" }",
    "migrationAfter": "\"env\": { \"SLACK_BOT_TOKEN\": \"xoxb-...\", \"SLACK_TEAM_ID\": \"T01234567\" }"
  },
  {
    "slug": "mcp-server-brave-search",
    "packageName": "@modelcontextprotocol/server-brave-search",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Brave Search Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "v0.6.2 reference server superseded by Brave's official @brave/brave-search-mcp-server with news/video/image tools.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "brave_web_search",
      "brave_local_search"
    ],
    "migrationBefore": "npx -y @modelcontextprotocol/server-brave-search",
    "migrationAfter": "npx -y @brave/brave-search-mcp-server"
  },
  {
    "slug": "mcp-server-puppeteer",
    "packageName": "@modelcontextprotocol/server-puppeteer",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Puppeteer Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "Archived at v2025.5.12; teams migrating to @playwright/mcp or chrome-devtools-mcp for accessibility snapshots.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "puppeteer_navigate",
      "puppeteer_screenshot",
      "puppeteer_evaluate"
    ],
    "migrationBefore": "\"puppeteer\": { \"command\": \"npx\", \"args\": [\"-y\", \"@modelcontextprotocol/server-puppeteer\"] }",
    "migrationAfter": "\"playwright\": { \"command\": \"npx\", \"args\": [\"-y\", \"@playwright/mcp@latest\"] }"
  },
  {
    "slug": "mcp-server-gdrive",
    "packageName": "@modelcontextprotocol/server-gdrive",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Google Drive Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "v2025.1.14 requires local OAuth credentials file path via GDRIVE_CREDENTIALS_PATH.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "search",
      "gdrive_read_file"
    ],
    "migrationBefore": "npx -y @modelcontextprotocol/server-gdrive",
    "migrationAfter": "GDRIVE_CREDENTIALS_PATH=/path/creds.json npx -y @modelcontextprotocol/server-gdrive"
  },
  {
    "slug": "mcp-server-google-maps",
    "packageName": "@modelcontextprotocol/server-google-maps",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Google Maps Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "v0.6.2 requires GOOGLE_MAPS_API_KEY with Places API (New) and Directions API enabled.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "maps_geocode",
      "maps_search_places",
      "maps_directions"
    ],
    "migrationBefore": "{ \"name\": \"maps_search_places\", \"arguments\": { \"query\": \"coffee\", \"location\": \"40.7,-74.0\" } }",
    "migrationAfter": "{ \"name\": \"maps_search_places\", \"arguments\": { \"query\": \"coffee\", \"location\": { \"latitude\": 40.7, \"longitude\": -74.0 } } }"
  },
  {
    "slug": "mcp-server-redis",
    "packageName": "@modelcontextprotocol/server-redis",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Redis Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "v2025.4.25 transitions to official @redis/mcp-server for Redis Streams, hashes, and vector index tools.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "set",
      "get",
      "delete",
      "list"
    ],
    "migrationBefore": "npx -y @modelcontextprotocol/server-redis redis://localhost:6379",
    "migrationAfter": "npx -y @upstash/mcp-server run"
  },
  {
    "slug": "mcp-server-aws-kb",
    "packageName": "@modelcontextprotocol/server-aws-kb-retrieval",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP AWS KB Retrieval Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "Superseded by awslabs.bedrock-kb-retrieval-mcp-server with reranking and metadata filters.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "retrieve_from_aws_kb"
    ],
    "migrationBefore": "npx -y @modelcontextprotocol/server-aws-kb-retrieval",
    "migrationAfter": "uvx awslabs.bedrock-kb-retrieval-mcp-server@latest"
  },
  {
    "slug": "mcp-inspector",
    "packageName": "@modelcontextprotocol/inspector",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "MCP Inspector",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/inspector",
    "breakingSummary": "v2.x requires session token authentication by default on proxy server port 6277 to prevent DNS rebinding / local RCE.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "mcp-inspector",
      "MCP_PROXY_AUTH_TOKEN"
    ],
    "migrationBefore": "npx @modelcontextprotocol/inspector node build/index.js",
    "migrationAfter": "DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector node build/index.js\n# Or use the printed MCP_PROXY_AUTH_TOKEN URL"
  },
  {
    "slug": "stripe-mcp",
    "packageName": "@stripe/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Payments & FinTech MCP",
    "displayName": "Stripe Official MCP Server",
    "vendor": "Stripe",
    "githubRepo": "stripe/agent-toolkit",
    "breakingSummary": "v0.3.x scopes tools by resource permission flags (--tools=all or granular resource.action) and recommends remote https://mcp.stripe.com.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "create_customer",
      "create_payment_link",
      "list_invoices",
      "search_documentation"
    ],
    "migrationBefore": "npx -y @stripe/mcp --api-key=$STRIPE_SECRET_KEY",
    "migrationAfter": "npx -y @stripe/mcp --tools=all --api-key=$STRIPE_SECRET_KEY"
  },
  {
    "slug": "playwright-mcp",
    "packageName": "@playwright/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Playwright Official MCP Server",
    "vendor": "Microsoft",
    "githubRepo": "microsoft/playwright-mcp",
    "breakingSummary": "Rapid 0.0.x releases rename vision mode flags (--caps=vision,pdf) and update browser_snapshot element ref identifiers.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "browser_navigate",
      "browser_click",
      "browser_snapshot",
      "browser_type"
    ],
    "migrationBefore": "npx @playwright/mcp@latest --vision",
    "migrationAfter": "npx @playwright/mcp@latest --caps=vision,pdf"
  },
  {
    "slug": "supabase-mcp",
    "packageName": "@supabase/mcp-server-supabase",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Supabase Official MCP Server",
    "vendor": "Supabase",
    "githubRepo": "supabase-community/supabase-mcp",
    "breakingSummary": "v0.14.x supports --read-only and --project-ref scoping; execute_sql and apply_migration split DDL vs DML operations.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "execute_sql",
      "apply_migration",
      "list_tables",
      "get_advisors"
    ],
    "migrationBefore": "npx -y @supabase/mcp-server-supabase --access-token=$SUPABASE_PAT",
    "migrationAfter": "npx -y @supabase/mcp-server-supabase@latest --access-token=$SUPABASE_PAT --project-ref=$PROJECT_REF --read-only"
  },
  {
    "slug": "cloudflare-mcp",
    "packageName": "@cloudflare/mcp-server-cloudflare",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Cloudflare Official MCP Server",
    "vendor": "Cloudflare",
    "githubRepo": "cloudflare/mcp-server-cloudflare",
    "breakingSummary": "Local CLI server supplemented by dedicated remote OAuth MCP servers (workers-bindings, observability, radar).",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "kv_list",
      "r2_list_buckets",
      "d1_query",
      "worker_put"
    ],
    "migrationBefore": "npx @cloudflare/mcp-server-cloudflare run",
    "migrationAfter": "npx mcp-remote https://bindings.mcp.cloudflare.com/sse"
  },
  {
    "slug": "notion-mcp",
    "packageName": "@notionhq/notion-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Notion Official MCP Server",
    "vendor": "Notion",
    "githubRepo": "makenotion/notion-mcp-server",
    "breakingSummary": "v2.x replaces raw Notion-Version header config with simplified markdown block append payloads and OPENAPI_MCP_HEADERS env format.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "API-post-search",
      "API-patch-block-children",
      "API-retrieve-a-page"
    ],
    "migrationBefore": "\"env\": { \"NOTION_API_TOKEN\": \"ntn_...\" }",
    "migrationAfter": "\"env\": { \"NOTION_TOKEN\": \"ntn_...\" }"
  },
  {
    "slug": "sentry-mcp",
    "packageName": "@sentry/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Sentry Official MCP Server",
    "vendor": "Sentry",
    "githubRepo": "getsentry/sentry-mcp",
    "breakingSummary": "v0.42.x consolidates search_issues and get_issue_details parameters, requiring organizationSlug on all multi-org tokens.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "find_issues",
      "get_issue_details",
      "analyze_issue_with_seer"
    ],
    "migrationBefore": "{ \"name\": \"get_issue\", \"arguments\": { \"issue_id\": \"PROJ-123\" } }",
    "migrationAfter": "{ \"name\": \"get_issue_details\", \"arguments\": { \"organizationSlug\": \"my-org\", \"issueId\": \"PROJ-123\" } }"
  },
  {
    "slug": "apify-mcp",
    "packageName": "@apify/actors-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Web Scraping & Data MCP",
    "displayName": "Apify Actors MCP Server",
    "vendor": "Apify",
    "githubRepo": "apify/actors-mcp-server",
    "breakingSummary": "v0.19.x adds dynamic actor discovery tools (search-actors, add-actor) instead of preloading all actor schemas at startup.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "search-actors",
      "call-actor",
      "get-actor-details"
    ],
    "migrationBefore": "npx -y @apify/actors-mcp-server --actors \"apify/web-scraper\"",
    "migrationAfter": "npx -y @apify/actors-mcp-server --tools actors,docs,apify/rag-web-browser"
  },
  {
    "slug": "firecrawl-mcp",
    "packageName": "firecrawl-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Web Scraping & Data MCP",
    "displayName": "Firecrawl MCP Server",
    "vendor": "Firecrawl",
    "githubRepo": "mendableai/firecrawl-mcp-server",
    "breakingSummary": "v3.x upgrades to Firecrawl v2 API: firecrawl_extract requires schema or prompt, and firecrawl_scrape removes deprecated pageOptions.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "firecrawl_scrape",
      "firecrawl_crawl",
      "firecrawl_search",
      "firecrawl_extract"
    ],
    "migrationBefore": "{ \"name\": \"firecrawl_scrape\", \"arguments\": { \"url\": \"https://example.com\", \"pageOptions\": { \"onlyMainContent\": true } } }",
    "migrationAfter": "{ \"name\": \"firecrawl_scrape\", \"arguments\": { \"url\": \"https://example.com\", \"formats\": [\"markdown\"], \"onlyMainContent\": true } }"
  },
  {
    "slug": "exa-mcp",
    "packageName": "exa-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Exa Search MCP Server",
    "vendor": "Exa",
    "githubRepo": "exa-labs/exa-mcp-server",
    "breakingSummary": "v3.x enables remote hosted MCP by default and renames tool identifiers to web_search_exa and deep_researcher_start.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "web_search_exa",
      "company_research_exa",
      "crawling_exa"
    ],
    "migrationBefore": "{ \"name\": \"search\", \"arguments\": { \"query\": \"AI agents\" } }",
    "migrationAfter": "{ \"name\": \"web_search_exa\", \"arguments\": { \"query\": \"AI agents\", \"numResults\": 5 } }"
  },
  {
    "slug": "tavily-mcp",
    "packageName": "tavily-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Tavily Search MCP Server",
    "vendor": "Tavily",
    "githubRepo": "tavily-ai/tavily-mcp",
    "breakingSummary": "v0.2.x adds tavily-crawl and tavily-map tools and enforces enum validation on search_depth and topic parameters.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "tavily-search",
      "tavily-extract",
      "tavily-crawl",
      "tavily-map"
    ],
    "migrationBefore": "{ \"name\": \"tavily-search\", \"arguments\": { \"query\": \"news\", \"days\": \"3\" } }",
    "migrationAfter": "{ \"name\": \"tavily-search\", \"arguments\": { \"query\": \"news\", \"topic\": \"news\", \"days\": 3 } }"
  },
  {
    "slug": "browserbase-mcp",
    "packageName": "@browserbasehq/mcp-server-browserbase",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Browserbase Stagehand MCP Server",
    "vendor": "Browserbase",
    "githubRepo": "browserbase/mcp-server-browserbase",
    "breakingSummary": "v2.x consolidates raw Puppeteer tools into Stagehand-powered browserbase_stagehand_act, observe, and extract tools.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "browserbase_session_create",
      "browserbase_stagehand_navigate",
      "browserbase_stagehand_act",
      "browserbase_stagehand_extract"
    ],
    "migrationBefore": "{ \"name\": \"browserbase_click\", \"arguments\": { \"selector\": \"#login\" } }",
    "migrationAfter": "{ \"name\": \"browserbase_stagehand_act\", \"arguments\": { \"action\": \"Click the login button\" } }"
  },
  {
    "slug": "neon-mcp",
    "packageName": "@neondatabase/mcp-server-neon",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Neon Serverless Postgres MCP Server",
    "vendor": "Neon",
    "githubRepo": "neondatabase/mcp-server-neon",
    "breakingSummary": "v0.6.x introduces safe database branch migration workflow (prepare_database_migration + complete_database_migration).",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "run_sql",
      "run_sql_transaction",
      "prepare_database_migration",
      "complete_database_migration"
    ],
    "migrationBefore": "npx -y @neondatabase/mcp-server-neon $NEON_API_KEY",
    "migrationAfter": "npx -y @neondatabase/mcp-server-neon start $NEON_API_KEY"
  },
  {
    "slug": "upstash-mcp",
    "packageName": "@upstash/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Upstash Redis & QStash MCP Server",
    "vendor": "Upstash",
    "githubRepo": "upstash/mcp-server",
    "breakingSummary": "v0.4.0 updates Redis command execution tool schemas and adds QStash schedule management endpoints.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "redis_database_run_single_redis_command",
      "redis_database_list_databases"
    ],
    "migrationBefore": "npx @upstash/mcp-server init $EMAIL $KEY",
    "migrationAfter": "npx -y @upstash/mcp-server run $EMAIL $KEY"
  },
  {
    "slug": "context7-mcp",
    "packageName": "@upstash/context7-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Docs MCP",
    "displayName": "Context7 Live Docs MCP Server",
    "vendor": "Upstash",
    "githubRepo": "upstash/context7",
    "breakingSummary": "v4.x requires calling resolve-library-id before get-library-docs (or query-docs) and addsCONTEXT7_API_KEY rate-limit headers.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "resolve-library-id",
      "get-library-docs"
    ],
    "migrationBefore": "{ \"name\": \"get-library-docs\", \"arguments\": { \"library\": \"next.js\" } }",
    "migrationAfter": "{ \"name\": \"get-library-docs\", \"arguments\": { \"context7CompatibleLibraryID\": \"/vercel/next.js\", \"topic\": \"routing\" } }"
  },
  {
    "slug": "raygun-mcp",
    "packageName": "@raygun.io/mcp-server-raygun",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Raygun Crash Reporting MCP Server",
    "vendor": "Raygun",
    "githubRepo": "MindscapeHQ/mcp-server-raygun",
    "breakingSummary": "Requires RAYGUN_PAT_TOKEN with V3 API read scopes for error group and deployment inspection.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "list_applications",
      "list_error_groups",
      "get_error_group"
    ],
    "migrationBefore": "\"env\": { \"RAYGUN_API_KEY\": \"...\" }",
    "migrationAfter": "\"env\": { \"RAYGUN_PAT_TOKEN\": \"...\" }"
  },
  {
    "slug": "kubernetes-mcp",
    "packageName": "mcp-server-kubernetes",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Kubernetes MCP Server",
    "vendor": "Flux159",
    "githubRepo": "Flux159/mcp-server-kubernetes",
    "breakingSummary": "v4.x consolidates kubectl_* tools into unified kubectl_get, kubectl_apply, kubectl_describe with non-destructive mode flags.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "kubectl_get",
      "kubectl_describe",
      "kubectl_apply",
      "helm_install"
    ],
    "migrationBefore": "{ \"name\": \"get_pods\", \"arguments\": { \"namespace\": \"default\" } }",
    "migrationAfter": "{ \"name\": \"kubectl_get\", \"arguments\": { \"resourceType\": \"pods\", \"namespace\": \"default\" } }"
  },
  {
    "slug": "figma-developer-mcp",
    "packageName": "figma-developer-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Framelink Figma MCP Server",
    "vendor": "Framelink",
    "githubRepo": "GLips/Figma-Context-MCP",
    "breakingSummary": "v0.13.x renames --figma-api-key CLI flag and simplifies get_figma_data nodeId format (123:456 or 123-456).",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "get_figma_data",
      "download_figma_images"
    ],
    "migrationBefore": "{ \"name\": \"get_file\", \"arguments\": { \"file_key\": \"abc\" } }",
    "migrationAfter": "{ \"name\": \"get_figma_data\", \"arguments\": { \"fileKey\": \"abc\", \"nodeId\": \"1:2\" } }"
  },
  {
    "slug": "e2b-mcp",
    "packageName": "@e2b/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Code Sandbox MCP",
    "displayName": "E2B Code Interpreter MCP Server",
    "vendor": "E2B",
    "githubRepo": "e2b-dev/mcp-server",
    "breakingSummary": "v0.2.x updates sandbox timeout lifecycle and run_code stdout/stderr structured return format.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "run_code"
    ],
    "migrationBefore": "{ \"name\": \"execute_python\", \"arguments\": { \"code\": \"print(1)\" } }",
    "migrationAfter": "{ \"name\": \"run_code\", \"arguments\": { \"code\": \"print(1)\" } }"
  },
  {
    "slug": "perplexity-mcp",
    "packageName": "@perplexity-ai/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Perplexity Official MCP Server",
    "vendor": "Perplexity",
    "githubRepo": "ppl-ai/modelcontextprotocol",
    "breakingSummary": "v1.3.x splits sonar-pro and sonar-deep-research into perplexity_ask, perplexity_research, and perplexity_reason tools.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "perplexity_ask",
      "perplexity_research",
      "perplexity_reason"
    ],
    "migrationBefore": "npx -y server-perplexity-ask",
    "migrationAfter": "npx -y @perplexity-ai/mcp-server"
  },
  {
    "slug": "chrome-devtools-mcp",
    "packageName": "chrome-devtools-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Chrome DevTools Official MCP Server",
    "vendor": "Chrome DevTools",
    "githubRepo": "ChromeDevTools/chrome-devtools-mcp",
    "breakingSummary": "v1.12.x updates performance trace recording tools and network request inspection UID parameters.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "navigate_page",
      "take_snapshot",
      "list_network_requests",
      "performance_start_trace"
    ],
    "migrationBefore": "{ \"name\": \"get_network_request\", \"arguments\": { \"url\": \"https://api.example.com\" } }",
    "migrationAfter": "{ \"name\": \"get_network_request\", \"arguments\": { \"reqid\": 42 } }"
  },
  {
    "slug": "mcp-remote",
    "packageName": "mcp-remote",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "mcp-remote (Stdio-to-Remote OAuth Bridge)",
    "vendor": "Cloudflare / Geelen",
    "githubRepo": "geelen/mcp-remote",
    "breakingSummary": "v0.15.x defaults to http-first (Streamable HTTP with SSE fallback) and updates OAuth callback port selection.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "mcp-remote"
    ],
    "migrationBefore": "npx mcp-remote https://example.com/sse",
    "migrationAfter": "npx -y mcp-remote https://example.com/mcp --transport http-first"
  },
  {
    "slug": "supergateway",
    "packageName": "supergateway",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Supergateway MCP Transport Proxy",
    "vendor": "Supercorp",
    "githubRepo": "supercorp-ai/supergateway",
    "breakingSummary": "v4.x adds stateful/stateless Streamable HTTP output flags (--outputTransport streamableHttp) alongside SSE and WS.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "supergateway"
    ],
    "migrationBefore": "npx -y supergateway --stdio \"npx -y @modelcontextprotocol/server-filesystem .\" --port 8000",
    "migrationAfter": "npx -y supergateway --stdio \"npx -y @modelcontextprotocol/server-filesystem .\" --outputTransport streamableHttp --port 8000"
  },
  {
    "slug": "mcp-server-git",
    "packageName": "mcp-server-git",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Git Server (Python)",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers",
    "breakingSummary": "CalVer 2026.10.19 release hardens git_diff and git_checkout argument validation against flag injection (CVE-2025/2026).",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "git_status",
      "git_diff_unstaged",
      "git_commit",
      "git_log"
    ],
    "migrationBefore": "{ \"name\": \"git_diff\", \"arguments\": { \"repo_path\": \".\", \"target\": \"--output=/tmp/pwn\" } }",
    "migrationAfter": "{ \"name\": \"git_diff\", \"arguments\": { \"repo_path\": \"/abs/path/to/repo\", \"target\": \"main\" } }"
  },
  {
    "slug": "mcp-server-fetch",
    "packageName": "mcp-server-fetch",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Fetch Server (Python)",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers",
    "breakingSummary": "CalVer 2026.10.19 release enforces robots.txt checking by default unless --ignore-robots-txt is passed and caps max_length.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "fetch"
    ],
    "migrationBefore": "uvx mcp-server-fetch",
    "migrationAfter": "uvx mcp-server-fetch --user-agent=\"MyAgent/1.0\""
  },
  {
    "slug": "mcp-server-time",
    "packageName": "mcp-server-time",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP Time & Timezone Server (Python)",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers",
    "breakingSummary": "CalVer 2026.10.19 requires valid IANA timezone strings in get_current_time and convert_time.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "get_current_time",
      "convert_time"
    ],
    "migrationBefore": "{ \"name\": \"get_current_time\", \"arguments\": { \"timezone\": \"EST\" } }",
    "migrationAfter": "{ \"name\": \"get_current_time\", \"arguments\": { \"timezone\": \"America/New_York\" } }"
  },
  {
    "slug": "mcp-server-sqlite",
    "packageName": "mcp-server-sqlite",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Official Reference MCP",
    "displayName": "MCP SQLite Server (Python)",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/servers-archived",
    "breakingSummary": "v2025.4.25 separates read_query (SELECT only) from write_query and create_table.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "read_query",
      "write_query",
      "create_table",
      "list_tables"
    ],
    "migrationBefore": "{ \"name\": \"query\", \"arguments\": { \"sql\": \"SELECT * FROM users\" } }",
    "migrationAfter": "{ \"name\": \"read_query\", \"arguments\": { \"query\": \"SELECT * FROM users\" } }"
  },
  {
    "slug": "mcp-server-qdrant",
    "packageName": "mcp-server-qdrant",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Vector DB MCP",
    "displayName": "Qdrant Official MCP Server",
    "vendor": "Qdrant",
    "githubRepo": "qdrant/mcp-server-qdrant",
    "breakingSummary": "v0.8.x requires explicit QDRANT_COLLECTION_NAME or per-call collection_name parameter in qdrant-find and qdrant-store.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "qdrant-store",
      "qdrant-find"
    ],
    "migrationBefore": "{ \"name\": \"qdrant-find\", \"arguments\": { \"query\": \"auth logic\" } }",
    "migrationAfter": "{ \"name\": \"qdrant-find\", \"arguments\": { \"query\": \"auth logic\", \"collection_name\": \"codebase\" } }"
  },
  {
    "slug": "awslabs-core-mcp",
    "packageName": "awslabs.core-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "AWS Labs Core MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "v1.0.x modularizes AWS MCP role profiles (AWS_API_MCP_PROFILE_NAME) and prompt_understanding routing.",
    "schemaDriftRisk": "low",
    "affectedSymbols": [
      "prompt_understanding"
    ],
    "migrationBefore": "uvx awslabs.core-mcp-server",
    "migrationAfter": "FASTMCP_LOG_LEVEL=ERROR uvx awslabs.core-mcp-server@latest"
  },
  {
    "slug": "claude-code-cli",
    "packageName": "@anthropic-ai/claude-code",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Agent CLI & MCP Host",
    "displayName": "Claude Code CLI & MCP Server",
    "vendor": "Anthropic",
    "githubRepo": "anthropics/claude-code",
    "breakingSummary": "v2.1.x updates `claude mcp serve` tool schemas and `.mcp.json` project-scoped server approval rules.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "claude mcp add",
      "claude mcp serve",
      "Bash",
      "Edit"
    ],
    "migrationBefore": "claude mcp add my-server -e KEY=val -- npx server",
    "migrationAfter": "claude mcp add --transport stdio my-server -e KEY=val -- npx server"
  },
  {
    "slug": "openai-codex-cli",
    "packageName": "@openai/codex",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Agent CLI & MCP Host",
    "displayName": "OpenAI Codex CLI & MCP Host",
    "vendor": "OpenAI",
    "githubRepo": "openai/codex",
    "breakingSummary": "v0.164.x configures MCP servers in ~/.codex/config.toml under [mcp_servers.<name>] and supports running Codex itself as an MCP server.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "codex mcp",
      "mcp_servers"
    ],
    "migrationBefore": "codex --ApprovalMode full-auto \"fix tests\"",
    "migrationAfter": "codex --full-auto \"fix tests\""
  },
  {
    "slug": "anthropic-claude-agent-sdk",
    "packageName": "@anthropic-ai/claude-agent-sdk",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "Anthropic Claude Agent SDK (TS)",
    "vendor": "Anthropic",
    "githubRepo": "anthropics/claude-agent-sdk-typescript",
    "breakingSummary": "0.3.x updates query() async generator message types, CanUseTool permission callback signatures, and mcpServers stdio/SSE config structure.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "query",
      "CanUseTool",
      "McpServerConfig",
      "SDKMessage"
    ],
    "migrationBefore": "for await (const msg of query({ prompt: \"fix bug\", options: { allowedTools: [\"Bash\"] } })) {\n  console.log(msg);\n}",
    "migrationAfter": "for await (const msg of query({\n  prompt: \"fix bug\",\n  options: { permissionMode: \"acceptEdits\", allowedTools: [\"Bash\", \"Edit\"] }\n})) {\n  console.log(msg);\n}"
  },
  {
    "slug": "ai-sdk-mcp",
    "packageName": "@ai-sdk/mcp",
    "registry": "npm",
    "kind": "sdk",
    "subcategory": "MCP Core SDK",
    "displayName": "Vercel AI SDK MCP Client",
    "vendor": "Vercel",
    "githubRepo": "vercel/ai",
    "breakingSummary": "v2.x aligns createMCPClient with AI SDK v7 LanguageModelV3 tool definitions and StreamableHTTPClientTransport.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "createMCPClient",
      "StreamableHTTPClientTransport",
      "mcpClient.tools"
    ],
    "migrationBefore": "const client = await experimental_createMCPClient({ transport: { type: \"sse\", url } });",
    "migrationAfter": "const client = await createMCPClient({ transport: new StreamableHTTPClientTransport(new URL(url)) });"
  },
  {
    "slug": "browser-use-python",
    "packageName": "browser-use",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Browser Agent SDK",
    "displayName": "Browser Use (Python)",
    "vendor": "Browser Use",
    "githubRepo": "browser-use/browser-use",
    "breakingSummary": "0.13.x separates BrowserSession and BrowserProfile from legacy BrowserConfig and updates Controller custom action decorators.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "Agent",
      "BrowserSession",
      "BrowserProfile",
      "Controller"
    ],
    "migrationBefore": "browser = Browser(config=BrowserConfig(headless=True))\nagent = Agent(task=\"Search\", llm=llm, browser=browser)",
    "migrationAfter": "session = BrowserSession(browser_profile=BrowserProfile(headless=True))\nagent = Agent(task=\"Search\", llm=llm, browser_session=session)"
  },
  {
    "slug": "autogen-agentchat-python",
    "packageName": "autogen-agentchat",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "Microsoft AutoGen AgentChat",
    "vendor": "Microsoft",
    "githubRepo": "microsoft/autogen",
    "breakingSummary": "v0.7.x asynchronous event-driven architecture replaces legacy v0.2 ConversableAgent.initiate_chat and register_for_llm patterns.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "AssistantAgent",
      "RoundRobinGroupChat",
      "McpWorkbench"
    ],
    "migrationBefore": "user_proxy.initiate_chat(assistant, message=\"Analyze data\")",
    "migrationAfter": "team = RoundRobinGroupChat([assistant], max_turns=4)\nresult = await team.run(task=\"Analyze data\")"
  },
  {
    "slug": "smolagents-python",
    "packageName": "smolagents",
    "registry": "pypi",
    "kind": "sdk",
    "subcategory": "Agent Framework",
    "displayName": "Hugging Face Smolagents",
    "vendor": "Hugging Face",
    "githubRepo": "huggingface/smolagents",
    "breakingSummary": "v1.26.x requires explicit additional_authorized_imports on CodeAgent and context-managed ToolCollection.from_mcp() loading.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "CodeAgent",
      "ToolCallingAgent",
      "ToolCollection.from_mcp",
      "InferenceClientModel"
    ],
    "migrationBefore": "agent = CodeAgent(tools=[], model=HfApiModel())",
    "migrationAfter": "agent = CodeAgent(tools=[], model=InferenceClientModel(), additional_authorized_imports=[\"json\"])"
  },
  {
    "slug": "awslabs-aws-docs-mcp",
    "packageName": "awslabs.aws-documentation-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Developer Docs MCP",
    "displayName": "AWS Documentation MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.aws-documentation-mcp-server@latest deployments risk parameter drift across read_documentation and search_documentation.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "read_documentation",
      "search_documentation",
      "recommend"
    ],
    "migrationBefore": "\"awslabs-aws-docs-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.aws-documentation-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-aws-docs-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.aws-documentation-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-cdk-mcp",
    "packageName": "awslabs.cdk-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "AWS CDK MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.cdk-mcp-server@latest deployments risk parameter drift across CDKGeneralGuidance and ExplainCDKNagRule.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "CDKGeneralGuidance",
      "ExplainCDKNagRule",
      "SearchGenAICDKConstructs"
    ],
    "migrationBefore": "\"awslabs-cdk-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.cdk-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-cdk-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.cdk-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-terraform-mcp",
    "packageName": "awslabs.terraform-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "AWS Terraform MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.terraform-mcp-server@latest deployments risk parameter drift across ExecuteTerraformCommand and SearchAwsProviderDocs.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "ExecuteTerraformCommand",
      "SearchAwsProviderDocs",
      "RunCheckovScan"
    ],
    "migrationBefore": "\"awslabs-terraform-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.terraform-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-terraform-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.terraform-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-eks-mcp",
    "packageName": "awslabs.eks-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "AWS EKS Kubernetes MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.eks-mcp-server@latest deployments risk parameter drift across manage_eks_stacks and list_k8s_resources.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "manage_eks_stacks",
      "list_k8s_resources",
      "get_pod_logs"
    ],
    "migrationBefore": "\"awslabs-eks-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.eks-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-eks-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.eks-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-lambda-mcp",
    "packageName": "awslabs.lambda-tool-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "AWS Lambda Tool MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.lambda-tool-mcp-server@latest deployments risk parameter drift across invoke_lambda_function and list_lambda_functions.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "invoke_lambda_function",
      "list_lambda_functions"
    ],
    "migrationBefore": "\"awslabs-lambda-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.lambda-tool-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-lambda-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.lambda-tool-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-cost-mcp",
    "packageName": "awslabs.cost-analysis-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "AWS Cost Analysis MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.cost-analysis-mcp-server@latest deployments risk parameter drift across get_cost_and_usage and analyze_cdk_project_costs.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "get_cost_and_usage",
      "analyze_cdk_project_costs"
    ],
    "migrationBefore": "\"awslabs-cost-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.cost-analysis-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-cost-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.cost-analysis-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-cloudwatch-mcp",
    "packageName": "awslabs.cloudwatch-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "AWS CloudWatch MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.cloudwatch-mcp-server@latest deployments risk parameter drift across describe_log_groups and execute_log_insights_query.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "describe_log_groups",
      "execute_log_insights_query",
      "get_active_alarms"
    ],
    "migrationBefore": "\"awslabs-cloudwatch-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.cloudwatch-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-cloudwatch-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.cloudwatch-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-dynamodb-mcp",
    "packageName": "awslabs.dynamodb-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "AWS DynamoDB MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.dynamodb-mcp-server@latest deployments risk parameter drift across dynamodb_data_modeling and put_item.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "dynamodb_data_modeling",
      "put_item",
      "query_table"
    ],
    "migrationBefore": "\"awslabs-dynamodb-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.dynamodb-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-dynamodb-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.dynamodb-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-postgres-mcp",
    "packageName": "awslabs.postgres-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "AWS RDS Postgres MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.postgres-mcp-server@latest deployments risk parameter drift across run_query and get_table_schema.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "run_query",
      "get_table_schema",
      "connect_to_database"
    ],
    "migrationBefore": "\"awslabs-postgres-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.postgres-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-postgres-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.postgres-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-bedrock-kb-mcp",
    "packageName": "awslabs.bedrock-kb-retrieval-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "AWS Bedrock KB Retrieval MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.bedrock-kb-retrieval-mcp-server@latest deployments risk parameter drift across QueryKnowledgeBases and ListKnowledgeBases.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "QueryKnowledgeBases",
      "ListKnowledgeBases"
    ],
    "migrationBefore": "\"awslabs-bedrock-kb-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.bedrock-kb-retrieval-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-bedrock-kb-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.bedrock-kb-retrieval-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-nova-canvas-mcp",
    "packageName": "awslabs.nova-canvas-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Amazon Nova Canvas MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.nova-canvas-mcp-server@latest deployments risk parameter drift across generate_image and generate_image_with_colors.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "generate_image",
      "generate_image_with_colors"
    ],
    "migrationBefore": "\"awslabs-nova-canvas-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.nova-canvas-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-nova-canvas-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.nova-canvas-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-diagram-mcp",
    "packageName": "awslabs.aws-diagram-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "AWS Architecture Diagram MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.aws-diagram-mcp-server@latest deployments risk parameter drift across generate_diagram and get_diagram_examples.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "generate_diagram",
      "get_diagram_examples",
      "list_icons"
    ],
    "migrationBefore": "\"awslabs-diagram-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.aws-diagram-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-diagram-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.aws-diagram-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-git-research-mcp",
    "packageName": "awslabs.git-repo-research-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "AWS Git Repo Research MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.git-repo-research-mcp-server@latest deployments risk parameter drift across create_research_repository and search_research_repository.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "create_research_repository",
      "search_research_repository"
    ],
    "migrationBefore": "\"awslabs-git-research-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.git-repo-research-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-git-research-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.git-repo-research-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "awslabs-openapi-mcp",
    "packageName": "awslabs.openapi-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "AWS Labs OpenAPI MCP Server",
    "vendor": "AWS Labs",
    "githubRepo": "awslabs/mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx awslabs.openapi-mcp-server@latest deployments risk parameter drift across list_api_endpoints and invoke_api_endpoint.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "list_api_endpoints",
      "invoke_api_endpoint"
    ],
    "migrationBefore": "\"awslabs-openapi-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.openapi-mcp-server\"]\n}",
    "migrationAfter": "\"awslabs-openapi-mcp\": {\n  \"command\": \"uvx\",\n  \"args\": [\"awslabs.openapi-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "mcp-atlassian-pypi",
    "packageName": "mcp-atlassian",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Atlassian Jira & Confluence MCP (Python)",
    "vendor": "Sooperset",
    "githubRepo": "sooperset/mcp-atlassian",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx mcp-atlassian@latest deployments risk parameter drift across jira_get_issue and jira_search.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "jira_get_issue",
      "jira_search",
      "confluence_search",
      "confluence_get_page"
    ],
    "migrationBefore": "\"mcp-atlassian-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-atlassian\"]\n}",
    "migrationAfter": "\"mcp-atlassian-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-atlassian@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "mcp-neo4j-cypher",
    "packageName": "mcp-neo4j-cypher",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Neo4j Cypher Graph MCP Server",
    "vendor": "Neo4j",
    "githubRepo": "neo4j-contrib/mcp-neo4j",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx mcp-neo4j-cypher@latest deployments risk parameter drift across read_neo4j_cypher and write_neo4j_cypher.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "read_neo4j_cypher",
      "write_neo4j_cypher",
      "get_neo4j_schema"
    ],
    "migrationBefore": "\"mcp-neo4j-cypher\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-neo4j-cypher\"]\n}",
    "migrationAfter": "\"mcp-neo4j-cypher\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-neo4j-cypher@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "mcp-motherduck",
    "packageName": "mcp-server-motherduck",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "MotherDuck & DuckDB MCP Server",
    "vendor": "MotherDuck",
    "githubRepo": "motherduckdb/mcp-server-motherduck",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx mcp-server-motherduck@latest deployments risk parameter drift across query and list_databases.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "query",
      "list_databases",
      "describe_table"
    ],
    "migrationBefore": "\"mcp-motherduck\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-server-motherduck\"]\n}",
    "migrationAfter": "\"mcp-motherduck\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-server-motherduck@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "mcp-snowflake",
    "packageName": "mcp-snowflake-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Snowflake Data Warehouse MCP Server",
    "vendor": "Snowflake Community",
    "githubRepo": "isaacwasserman/mcp-snowflake-server",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx mcp-snowflake-server@latest deployments risk parameter drift across read_query and write_query.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "read_query",
      "write_query",
      "list_tables",
      "describe_table"
    ],
    "migrationBefore": "\"mcp-snowflake\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-snowflake-server\"]\n}",
    "migrationAfter": "\"mcp-snowflake\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-snowflake-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "mcp-clickhouse",
    "packageName": "mcp-clickhouse",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "ClickHouse Official MCP Server",
    "vendor": "ClickHouse",
    "githubRepo": "ClickHouse/mcp-clickhouse",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx mcp-clickhouse@latest deployments risk parameter drift across run_select_query and list_databases.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "run_select_query",
      "list_databases",
      "list_tables"
    ],
    "migrationBefore": "\"mcp-clickhouse\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-clickhouse\"]\n}",
    "migrationAfter": "\"mcp-clickhouse\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-clickhouse@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "mcp-grafana-pypi",
    "packageName": "mcp-grafana",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Grafana MCP Server (Python)",
    "vendor": "Grafana",
    "githubRepo": "grafana/mcp-grafana",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx mcp-grafana@latest deployments risk parameter drift across search_dashboards and query_prometheus.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "search_dashboards",
      "query_prometheus",
      "query_loki_logs",
      "list_incidents"
    ],
    "migrationBefore": "\"mcp-grafana-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-grafana\"]\n}",
    "migrationAfter": "\"mcp-grafana-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"mcp-grafana@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "arxiv-mcp-server",
    "packageName": "arxiv-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "arXiv Research Papers MCP Server",
    "vendor": "Blazickjp",
    "githubRepo": "blazickjp/arxiv-mcp-server",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx arxiv-mcp-server@latest deployments risk parameter drift across search_papers and download_paper.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "search_papers",
      "download_paper",
      "read_paper",
      "list_papers"
    ],
    "migrationBefore": "\"arxiv-mcp-server\": {\n  \"command\": \"uvx\",\n  \"args\": [\"arxiv-mcp-server\"]\n}",
    "migrationAfter": "\"arxiv-mcp-server\": {\n  \"command\": \"uvx\",\n  \"args\": [\"arxiv-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "duckduckgo-mcp-pypi",
    "packageName": "duckduckgo-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "DuckDuckGo Search MCP Server (Python)",
    "vendor": "Nickclyde",
    "githubRepo": "nickclyde/duckduckgo-mcp-server",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx duckduckgo-mcp-server@latest deployments risk parameter drift across search and fetch_content.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "search",
      "fetch_content"
    ],
    "migrationBefore": "\"duckduckgo-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"duckduckgo-mcp-server\"]\n}",
    "migrationAfter": "\"duckduckgo-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"duckduckgo-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "prometheus-mcp-pypi",
    "packageName": "prometheus-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Prometheus Metrics MCP Server",
    "vendor": "Pab1it0",
    "githubRepo": "pab1it0/prometheus-mcp-server",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx prometheus-mcp-server@latest deployments risk parameter drift across execute_query and execute_range_query.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "execute_query",
      "execute_range_query",
      "list_metrics",
      "get_targets"
    ],
    "migrationBefore": "\"prometheus-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"prometheus-mcp-server\"]\n}",
    "migrationAfter": "\"prometheus-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"prometheus-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "elasticsearch-mcp-pypi",
    "packageName": "elasticsearch-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Elasticsearch & OpenSearch MCP Server",
    "vendor": "Elastic",
    "githubRepo": "elastic/mcp-server-elasticsearch",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx elasticsearch-mcp-server@latest deployments risk parameter drift across list_indices and get_mappings.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "list_indices",
      "get_mappings",
      "search",
      "esql"
    ],
    "migrationBefore": "\"elasticsearch-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"elasticsearch-mcp-server\"]\n}",
    "migrationAfter": "\"elasticsearch-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"elasticsearch-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "redis-mcp-pypi",
    "packageName": "redis-mcp-server",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Redis Official MCP Server (Python)",
    "vendor": "Redis",
    "githubRepo": "redis/mcp-redis",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx redis-mcp-server@latest deployments risk parameter drift across hset and hget.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "hset",
      "hget",
      "json_set",
      "vector_search"
    ],
    "migrationBefore": "\"redis-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"redis-mcp-server\"]\n}",
    "migrationAfter": "\"redis-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"redis-mcp-server@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "chroma-mcp-pypi",
    "packageName": "chroma-mcp",
    "registry": "pypi",
    "kind": "mcp",
    "subcategory": "Vector DB MCP",
    "displayName": "Chroma Vector DB MCP Server",
    "vendor": "Chroma",
    "githubRepo": "chroma-core/chroma-mcp",
    "breakingSummary": "Requires FastMCP / MCP Python SDK v2+ tool schema validation; unpinned uvx chroma-mcp@latest deployments risk parameter drift across chroma_query_documents and chroma_add_documents.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "chroma_query_documents",
      "chroma_add_documents",
      "chroma_list_collections"
    ],
    "migrationBefore": "\"chroma-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"chroma-mcp\"]\n}",
    "migrationAfter": "\"chroma-mcp-pypi\": {\n  \"command\": \"uvx\",\n  \"args\": [\"chroma-mcp@latest\"],\n  \"env\": { \"FASTMCP_LOG_LEVEL\": \"ERROR\" }\n}"
  },
  {
    "slug": "modelcontextprotocol-core",
    "packageName": "@modelcontextprotocol/core",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Modelcontextprotocol Core",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "Modelcontextprotocol Core (@modelcontextprotocol/core) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "core"
    ],
    "migrationBefore": "\"modelcontextprotocol-core\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/core@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-core\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/core@2.4.0\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-server",
    "packageName": "@modelcontextprotocol/server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Modelcontextprotocol Server",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "Modelcontextprotocol Server (@modelcontextprotocol/server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "server"
    ],
    "migrationBefore": "\"modelcontextprotocol-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/server@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/server@2.4.0\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-client",
    "packageName": "@modelcontextprotocol/client",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Modelcontextprotocol Client",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "Modelcontextprotocol Client (@modelcontextprotocol/client) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "client"
    ],
    "migrationBefore": "\"modelcontextprotocol-client\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/client@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-client\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/client@2.4.0\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-ext-apps",
    "packageName": "@modelcontextprotocol/ext-apps",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Modelcontextprotocol Ext Apps",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/ext-apps",
    "breakingSummary": "Modelcontextprotocol Ext Apps (@modelcontextprotocol/ext-apps) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "ext-apps"
    ],
    "migrationBefore": "\"modelcontextprotocol-ext-apps\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/ext-apps@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-ext-apps\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/ext-apps@2.0.3\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-node",
    "packageName": "@modelcontextprotocol/node",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Modelcontextprotocol Node",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "Modelcontextprotocol Node (@modelcontextprotocol/node) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "node"
    ],
    "migrationBefore": "\"modelcontextprotocol-node\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/node@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-node\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/node@2.1.2\"]\n}"
  },
  {
    "slug": "storybook-mcp",
    "packageName": "@storybook/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Storybook MCP",
    "vendor": "Storybook",
    "githubRepo": "storybookjs/storybook",
    "breakingSummary": "Storybook MCP (@storybook/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"storybook-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@storybook/mcp@latest\"]\n}",
    "migrationAfter": "\"storybook-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@storybook/mcp@10.6.3\"]\n}"
  },
  {
    "slug": "mcp-handler",
    "packageName": "mcp-handler",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "MCP Handler",
    "vendor": "vercel-labs",
    "githubRepo": "vercel-labs/mcp-handler",
    "breakingSummary": "MCP Handler (mcp-handler) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-handler"
    ],
    "migrationBefore": "\"mcp-handler\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-handler@latest\"]\n}",
    "migrationAfter": "\"mcp-handler\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-handler@2.3.0\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-server-pdf",
    "packageName": "@modelcontextprotocol/server-pdf",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Modelcontextprotocol Server PDF",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/ext-apps",
    "breakingSummary": "Modelcontextprotocol Server PDF (@modelcontextprotocol/server-pdf) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "server-pdf"
    ],
    "migrationBefore": "\"modelcontextprotocol-server-pdf\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/server-pdf@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-server-pdf\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/server-pdf@2.0.3\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-express",
    "packageName": "@modelcontextprotocol/express",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Modelcontextprotocol Express",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "Modelcontextprotocol Express (@modelcontextprotocol/express) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "express"
    ],
    "migrationBefore": "\"modelcontextprotocol-express\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/express@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-express\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/express@2.0.2\"]\n}"
  },
  {
    "slug": "better-auth-mcp",
    "packageName": "@better-auth/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Better-auth MCP",
    "vendor": "Better Auth",
    "githubRepo": "better-auth/better-auth",
    "breakingSummary": "Better-auth MCP (@better-auth/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"better-auth-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@better-auth/mcp@latest\"]\n}",
    "migrationAfter": "\"better-auth-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@better-auth/mcp@1.7.12\"]\n}"
  },
  {
    "slug": "pi-mcp-adapter",
    "packageName": "pi-mcp-adapter",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Pi MCP Adapter",
    "vendor": "nicobailon",
    "githubRepo": "nicobailon/pi-mcp-adapter",
    "breakingSummary": "Pi MCP Adapter (pi-mcp-adapter) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "pi-mcp-adapter"
    ],
    "migrationBefore": "\"pi-mcp-adapter\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"pi-mcp-adapter@latest\"]\n}",
    "migrationAfter": "\"pi-mcp-adapter\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"pi-mcp-adapter@6.0.0\"]\n}"
  },
  {
    "slug": "mcporter",
    "packageName": "mcporter",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Mcporter",
    "vendor": "openclaw",
    "githubRepo": "openclaw/mcporter",
    "breakingSummary": "Mcporter (mcporter) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcporter"
    ],
    "migrationBefore": "\"mcporter\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcporter@latest\"]\n}",
    "migrationAfter": "\"mcporter\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcporter@0.16.0\"]\n}"
  },
  {
    "slug": "lovable-dev-mcp-js",
    "packageName": "@lovable.dev/mcp-js",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Lovable.dev MCP Js",
    "vendor": "Lovable.dev",
    "githubRepo": "lovablelabs/lovable",
    "breakingSummary": "Lovable.dev MCP Js (@lovable.dev/mcp-js) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-js"
    ],
    "migrationBefore": "\"lovable-dev-mcp-js\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@lovable.dev/mcp-js@latest\"]\n}",
    "migrationAfter": "\"lovable-dev-mcp-js\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@lovable.dev/mcp-js@3.3.0\"]\n}"
  },
  {
    "slug": "posthog-mcp",
    "packageName": "@posthog/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Posthog MCP",
    "vendor": "Posthog",
    "githubRepo": "PostHog/posthog-js",
    "breakingSummary": "Posthog MCP (@posthog/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"posthog-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@posthog/mcp@latest\"]\n}",
    "migrationAfter": "\"posthog-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@posthog/mcp@0.23.0\"]\n}"
  },
  {
    "slug": "pandacss-mcp",
    "packageName": "@pandacss/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Pandacss MCP",
    "vendor": "Pandacss",
    "githubRepo": "chakra-ui/panda",
    "breakingSummary": "Pandacss MCP (@pandacss/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"pandacss-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@pandacss/mcp@latest\"]\n}",
    "migrationAfter": "\"pandacss-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@pandacss/mcp@2.4.0\"]\n}"
  },
  {
    "slug": "clerk-mcp-tools",
    "packageName": "@clerk/mcp-tools",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Clerk MCP Tools",
    "vendor": "Clerk",
    "githubRepo": "clerk/mcp-tools",
    "breakingSummary": "Clerk MCP Tools (@clerk/mcp-tools) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-tools"
    ],
    "migrationBefore": "\"clerk-mcp-tools\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@clerk/mcp-tools@latest\"]\n}",
    "migrationAfter": "\"clerk-mcp-tools\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@clerk/mcp-tools@0.7.0\"]\n}"
  },
  {
    "slug": "add-mcp",
    "packageName": "add-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Add MCP",
    "vendor": "neon-solutions",
    "githubRepo": "neon-solutions/add-mcp",
    "breakingSummary": "Add MCP (add-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "add-mcp"
    ],
    "migrationBefore": "\"add-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"add-mcp@latest\"]\n}",
    "migrationAfter": "\"add-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"add-mcp@2.6.0\"]\n}"
  },
  {
    "slug": "payloadcms-plugin-mcp",
    "packageName": "@payloadcms/plugin-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Payloadcms Plugin MCP",
    "vendor": "Payloadcms",
    "githubRepo": "payloadcms/payload",
    "breakingSummary": "Payloadcms Plugin MCP (@payloadcms/plugin-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "plugin-mcp"
    ],
    "migrationBefore": "\"payloadcms-plugin-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@payloadcms/plugin-mcp@latest\"]\n}",
    "migrationAfter": "\"payloadcms-plugin-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@payloadcms/plugin-mcp@3.92.0\"]\n}"
  },
  {
    "slug": "azure-mcp",
    "packageName": "@azure/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Azure MCP",
    "vendor": "Azure",
    "githubRepo": "microsoft/mcp",
    "breakingSummary": "Azure MCP (@azure/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"azure-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@azure/mcp@latest\"]\n}",
    "migrationAfter": "\"azure-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@azure/mcp@4.0.0-beta.3\"]\n}"
  },
  {
    "slug": "zereight-mcp-gitlab",
    "packageName": "@zereight/mcp-gitlab",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Zereight MCP Gitlab",
    "vendor": "Zereight",
    "githubRepo": "zereight/gitlab-mcp",
    "breakingSummary": "Zereight MCP Gitlab (@zereight/mcp-gitlab) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-gitlab"
    ],
    "migrationBefore": "\"zereight-mcp-gitlab\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@zereight/mcp-gitlab@latest\"]\n}",
    "migrationAfter": "\"zereight-mcp-gitlab\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@zereight/mcp-gitlab@2.3.7\"]\n}"
  },
  {
    "slug": "copilotkit-mcp-apps-renderer",
    "packageName": "@copilotkit/mcp-apps-renderer",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Copilotkit MCP Apps Renderer",
    "vendor": "Copilotkit",
    "githubRepo": "CopilotKit/CopilotKit",
    "breakingSummary": "Copilotkit MCP Apps Renderer (@copilotkit/mcp-apps-renderer) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-apps-renderer"
    ],
    "migrationBefore": "\"copilotkit-mcp-apps-renderer\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@copilotkit/mcp-apps-renderer@latest\"]\n}",
    "migrationAfter": "\"copilotkit-mcp-apps-renderer\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@copilotkit/mcp-apps-renderer@1.79.1\"]\n}"
  },
  {
    "slug": "azure-devops-mcp",
    "packageName": "@azure-devops/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Azure-devops MCP",
    "vendor": "Azure Devops",
    "githubRepo": "microsoft/azure-devops-mcp",
    "breakingSummary": "Azure-devops MCP (@azure-devops/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"azure-devops-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@azure-devops/mcp@latest\"]\n}",
    "migrationAfter": "\"azure-devops-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@azure-devops/mcp@2.11.0\"]\n}"
  },
  {
    "slug": "next-devtools-mcp",
    "packageName": "next-devtools-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Next Devtools MCP",
    "vendor": "vercel",
    "githubRepo": "vercel/next-devtools-mcp",
    "breakingSummary": "Next Devtools MCP (next-devtools-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "next-devtools-mcp"
    ],
    "migrationBefore": "\"next-devtools-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"next-devtools-mcp@latest\"]\n}",
    "migrationAfter": "\"next-devtools-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"next-devtools-mcp@0.4.0\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-conformance",
    "packageName": "@modelcontextprotocol/conformance",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Modelcontextprotocol Conformance",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/conformance",
    "breakingSummary": "Modelcontextprotocol Conformance (@modelcontextprotocol/conformance) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "conformance"
    ],
    "migrationBefore": "\"modelcontextprotocol-conformance\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/conformance@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-conformance\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/conformance@0.1.16\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-hono",
    "packageName": "@modelcontextprotocol/hono",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Modelcontextprotocol Hono",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "Modelcontextprotocol Hono (@modelcontextprotocol/hono) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "hono"
    ],
    "migrationBefore": "\"modelcontextprotocol-hono\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/hono@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-hono\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/hono@2.0.2\"]\n}"
  },
  {
    "slug": "pi-mcp-extension",
    "packageName": "pi-mcp-extension",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Pi MCP Extension",
    "vendor": "irahardianto",
    "githubRepo": "irahardianto/pi-mcp-extension",
    "breakingSummary": "Pi MCP Extension (pi-mcp-extension) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "pi-mcp-extension"
    ],
    "migrationBefore": "\"pi-mcp-extension\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"pi-mcp-extension@latest\"]\n}",
    "migrationAfter": "\"pi-mcp-extension\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"pi-mcp-extension@1.10.2\"]\n}"
  },
  {
    "slug": "sap-ux-fiori-mcp-server",
    "packageName": "@sap-ux/fiori-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Sap-ux Fiori MCP Server",
    "vendor": "Sap Ux",
    "githubRepo": "SAP/open-ux-tools",
    "breakingSummary": "Sap-ux Fiori MCP Server (@sap-ux/fiori-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "fiori-mcp-server"
    ],
    "migrationBefore": "\"sap-ux-fiori-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@sap-ux/fiori-mcp-server@latest\"]\n}",
    "migrationAfter": "\"sap-ux-fiori-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@sap-ux/fiori-mcp-server@1.15.15\"]\n}"
  },
  {
    "slug": "tanstack-ai-mcp",
    "packageName": "@tanstack/ai-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Tanstack Ai MCP",
    "vendor": "Tanstack",
    "githubRepo": "TanStack/ai",
    "breakingSummary": "Tanstack Ai MCP (@tanstack/ai-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "ai-mcp"
    ],
    "migrationBefore": "\"tanstack-ai-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@tanstack/ai-mcp@latest\"]\n}",
    "migrationAfter": "\"tanstack-ai-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@tanstack/ai-mcp@1.0.0\"]\n}"
  },
  {
    "slug": "ui5-mcp-server",
    "packageName": "@ui5/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Ui5 MCP Server",
    "vendor": "Ui5",
    "githubRepo": "UI5/mcp-server",
    "breakingSummary": "Ui5 MCP Server (@ui5/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"ui5-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@ui5/mcp-server@latest\"]\n}",
    "migrationAfter": "\"ui5-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@ui5/mcp-server@0.3.2\"]\n}"
  },
  {
    "slug": "n8n-mcp",
    "packageName": "n8n-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "N8n MCP",
    "vendor": "czlonkowski",
    "githubRepo": "czlonkowski/n8n-mcp",
    "breakingSummary": "N8n MCP (n8n-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "n8n-mcp"
    ],
    "migrationBefore": "\"n8n-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"n8n-mcp@latest\"]\n}",
    "migrationAfter": "\"n8n-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"n8n-mcp@2.97.0\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-ext-tasks",
    "packageName": "@modelcontextprotocol/ext-tasks",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Modelcontextprotocol Ext Tasks",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/ext-tasks",
    "breakingSummary": "Modelcontextprotocol Ext Tasks (@modelcontextprotocol/ext-tasks) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "ext-tasks"
    ],
    "migrationBefore": "\"modelcontextprotocol-ext-tasks\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/ext-tasks@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-ext-tasks\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/ext-tasks@0.2.2\"]\n}"
  },
  {
    "slug": "currents-mcp",
    "packageName": "@currents/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Currents MCP",
    "vendor": "Currents",
    "githubRepo": "currents-dev/currents-mcp",
    "breakingSummary": "Currents MCP (@currents/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"currents-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@currents/mcp@latest\"]\n}",
    "migrationAfter": "\"currents-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@currents/mcp@2.7.0\"]\n}"
  },
  {
    "slug": "xcodebuildmcp",
    "packageName": "xcodebuildmcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Xcodebuildmcp",
    "vendor": "getsentry",
    "githubRepo": "getsentry/XcodeBuildMCP",
    "breakingSummary": "Xcodebuildmcp (xcodebuildmcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "xcodebuildmcp"
    ],
    "migrationBefore": "\"xcodebuildmcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"xcodebuildmcp@latest\"]\n}",
    "migrationAfter": "\"xcodebuildmcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"xcodebuildmcp@2.7.0\"]\n}"
  },
  {
    "slug": "nx-mcp",
    "packageName": "nx-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Nx MCP",
    "vendor": "nrwl",
    "githubRepo": "nrwl/nx-console",
    "breakingSummary": "Nx MCP (nx-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "nx-mcp"
    ],
    "migrationBefore": "\"nx-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"nx-mcp@latest\"]\n}",
    "migrationAfter": "\"nx-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"nx-mcp@0.25.0\"]\n}"
  },
  {
    "slug": "openai-mcp-extensions",
    "packageName": "@openai/mcp-extensions",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Openai MCP Extensions",
    "vendor": "Openai",
    "githubRepo": "openai/mcp-extensions",
    "breakingSummary": "Openai MCP Extensions (@openai/mcp-extensions) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-extensions"
    ],
    "migrationBefore": "\"openai-mcp-extensions\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@openai/mcp-extensions@latest\"]\n}",
    "migrationAfter": "\"openai-mcp-extensions\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@openai/mcp-extensions@0.2.1\"]\n}"
  },
  {
    "slug": "serdnaley-metabase-mcp",
    "packageName": "@serdnaley/metabase-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Serdnaley Metabase MCP",
    "vendor": "Serdnaley",
    "githubRepo": "Serdnaley/metabase-mcp",
    "breakingSummary": "Serdnaley Metabase MCP (@serdnaley/metabase-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "metabase-mcp"
    ],
    "migrationBefore": "\"serdnaley-metabase-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@serdnaley/metabase-mcp@latest\"]\n}",
    "migrationAfter": "\"serdnaley-metabase-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@serdnaley/metabase-mcp@0.2.0\"]\n}"
  },
  {
    "slug": "google-cloud-observability-mcp",
    "packageName": "@google-cloud/observability-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Google-cloud Observability MCP",
    "vendor": "Google Cloud",
    "githubRepo": "googleapis/gcloud-mcp",
    "breakingSummary": "Google-cloud Observability MCP (@google-cloud/observability-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "observability-mcp"
    ],
    "migrationBefore": "\"google-cloud-observability-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@google-cloud/observability-mcp@latest\"]\n}",
    "migrationAfter": "\"google-cloud-observability-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@google-cloud/observability-mcp@0.2.3\"]\n}"
  },
  {
    "slug": "google-cloud-gcloud-mcp",
    "packageName": "@google-cloud/gcloud-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Google-cloud Gcloud MCP",
    "vendor": "Google Cloud",
    "githubRepo": "googleapis/gcloud-mcp",
    "breakingSummary": "Google-cloud Gcloud MCP (@google-cloud/gcloud-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "gcloud-mcp"
    ],
    "migrationBefore": "\"google-cloud-gcloud-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@google-cloud/gcloud-mcp@latest\"]\n}",
    "migrationAfter": "\"google-cloud-gcloud-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@google-cloud/gcloud-mcp@0.5.3\"]\n}"
  },
  {
    "slug": "mcp-framework",
    "packageName": "mcp-framework",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "MCP Framework",
    "vendor": "QuantGeekDev",
    "githubRepo": "QuantGeekDev/mcp-framework",
    "breakingSummary": "MCP Framework (mcp-framework) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-framework"
    ],
    "migrationBefore": "\"mcp-framework\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-framework@latest\"]\n}",
    "migrationAfter": "\"mcp-framework\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-framework@0.2.22\"]\n}"
  },
  {
    "slug": "cap-js-mcp-server",
    "packageName": "@cap-js/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Cap-js MCP Server",
    "vendor": "Cap Js",
    "githubRepo": "cap-js/mcp-server",
    "breakingSummary": "Cap-js MCP Server (@cap-js/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"cap-js-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cap-js/mcp-server@latest\"]\n}",
    "migrationAfter": "\"cap-js-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cap-js/mcp-server@0.0.8\"]\n}"
  },
  {
    "slug": "softeria-ms-365-mcp-server",
    "packageName": "@softeria/ms-365-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Softeria Ms 365 MCP Server",
    "vendor": "Softeria",
    "githubRepo": "Softeria/ms-365-mcp-server",
    "breakingSummary": "Softeria Ms 365 MCP Server (@softeria/ms-365-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "ms-365-mcp-server"
    ],
    "migrationBefore": "\"softeria-ms-365-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@softeria/ms-365-mcp-server@latest\"]\n}",
    "migrationAfter": "\"softeria-ms-365-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@softeria/ms-365-mcp-server@0.171.0\"]\n}"
  },
  {
    "slug": "kubb-mcp",
    "packageName": "@kubb/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Kubb MCP",
    "vendor": "Kubb",
    "githubRepo": "kubb-labs/kubb",
    "breakingSummary": "Kubb MCP (@kubb/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"kubb-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@kubb/mcp@latest\"]\n}",
    "migrationAfter": "\"kubb-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@kubb/mcp@5.12.8\"]\n}"
  },
  {
    "slug": "mcp-evals",
    "packageName": "mcp-evals",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "MCP Evals",
    "vendor": "mclenhard",
    "githubRepo": "mclenhard/mcp-evals",
    "breakingSummary": "MCP Evals (mcp-evals) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-evals"
    ],
    "migrationBefore": "\"mcp-evals\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-evals@latest\"]\n}",
    "migrationAfter": "\"mcp-evals\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-evals@2.0.1\"]\n}"
  },
  {
    "slug": "hostinger-mcp",
    "packageName": "@hostinger/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Hostinger MCP",
    "vendor": "Hostinger",
    "githubRepo": "hostinger/api-mcp-server",
    "breakingSummary": "Hostinger MCP (@hostinger/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"hostinger-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@hostinger/mcp@latest\"]\n}",
    "migrationAfter": "\"hostinger-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@hostinger/mcp@3.8.1\"]\n}"
  },
  {
    "slug": "google-cloud-storage-mcp",
    "packageName": "@google-cloud/storage-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Google-cloud Storage MCP",
    "vendor": "Google Cloud",
    "githubRepo": "googleapis/gcloud-mcp",
    "breakingSummary": "Google-cloud Storage MCP (@google-cloud/storage-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "storage-mcp"
    ],
    "migrationBefore": "\"google-cloud-storage-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@google-cloud/storage-mcp@latest\"]\n}",
    "migrationAfter": "\"google-cloud-storage-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@google-cloud/storage-mcp@0.6.0\"]\n}"
  },
  {
    "slug": "mcp-use-inspector",
    "packageName": "@mcp-use/inspector",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Mcp-use Inspector",
    "vendor": "Mcp Use",
    "githubRepo": "mcp-use/mcp-use",
    "breakingSummary": "Mcp-use Inspector (@mcp-use/inspector) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "inspector"
    ],
    "migrationBefore": "\"mcp-use-inspector\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@mcp-use/inspector@latest\"]\n}",
    "migrationAfter": "\"mcp-use-inspector\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@mcp-use/inspector@20.3.24\"]\n}"
  },
  {
    "slug": "netlify-mcp",
    "packageName": "@netlify/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Netlify MCP",
    "vendor": "Netlify",
    "githubRepo": "netlify/netlify-mcp",
    "breakingSummary": "Netlify MCP (@netlify/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"netlify-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@netlify/mcp@latest\"]\n}",
    "migrationAfter": "\"netlify-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@netlify/mcp@1.20.0\"]\n}"
  },
  {
    "slug": "mastra-mcp-docs-server",
    "packageName": "@mastra/mcp-docs-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Mastra MCP Docs Server",
    "vendor": "Mastra",
    "githubRepo": "mastra-ai/mastra",
    "breakingSummary": "Mastra MCP Docs Server (@mastra/mcp-docs-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-docs-server"
    ],
    "migrationBefore": "\"mastra-mcp-docs-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@mastra/mcp-docs-server@latest\"]\n}",
    "migrationAfter": "\"mastra-mcp-docs-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@mastra/mcp-docs-server@1.3.9\"]\n}"
  },
  {
    "slug": "launchdarkly-mcp-server",
    "packageName": "@launchdarkly/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Launchdarkly MCP Server",
    "vendor": "Launchdarkly",
    "githubRepo": "launchdarkly/mcp-server",
    "breakingSummary": "Launchdarkly MCP Server (@launchdarkly/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"launchdarkly-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@launchdarkly/mcp-server@latest\"]\n}",
    "migrationAfter": "\"launchdarkly-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@launchdarkly/mcp-server@0.7.1\"]\n}"
  },
  {
    "slug": "n8n-mcp-apps",
    "packageName": "@n8n/mcp-apps",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "N8n MCP Apps",
    "vendor": "N8n",
    "githubRepo": "n8n-io/n8n",
    "breakingSummary": "N8n MCP Apps (@n8n/mcp-apps) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-apps"
    ],
    "migrationBefore": "\"n8n-mcp-apps\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@n8n/mcp-apps@latest\"]\n}",
    "migrationAfter": "\"n8n-mcp-apps\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@n8n/mcp-apps@0.21.3\"]\n}"
  },
  {
    "slug": "modelcontextprotocol-fastify",
    "packageName": "@modelcontextprotocol/fastify",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Modelcontextprotocol Fastify",
    "vendor": "Model Context Protocol",
    "githubRepo": "modelcontextprotocol/typescript-sdk",
    "breakingSummary": "Modelcontextprotocol Fastify (@modelcontextprotocol/fastify) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "fastify"
    ],
    "migrationBefore": "\"modelcontextprotocol-fastify\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/fastify@latest\"]\n}",
    "migrationAfter": "\"modelcontextprotocol-fastify\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@modelcontextprotocol/fastify@2.0.1\"]\n}"
  },
  {
    "slug": "traceloop-instrumentation-mcp",
    "packageName": "@traceloop/instrumentation-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Traceloop Instrumentation MCP",
    "vendor": "Traceloop",
    "githubRepo": "traceloop/openllmetry-js",
    "breakingSummary": "Traceloop Instrumentation MCP (@traceloop/instrumentation-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "instrumentation-mcp"
    ],
    "migrationBefore": "\"traceloop-instrumentation-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@traceloop/instrumentation-mcp@latest\"]\n}",
    "migrationAfter": "\"traceloop-instrumentation-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@traceloop/instrumentation-mcp@0.27.0\"]\n}"
  },
  {
    "slug": "mcp-use",
    "packageName": "mcp-use",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "MCP Use",
    "vendor": "mcp-use",
    "githubRepo": "mcp-use/mcp-use",
    "breakingSummary": "MCP Use (mcp-use) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-use"
    ],
    "migrationBefore": "\"mcp-use\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-use@latest\"]\n}",
    "migrationAfter": "\"mcp-use\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-use@2.11.2\"]\n}"
  },
  {
    "slug": "n8n-nodes-mcp",
    "packageName": "n8n-nodes-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "N8n Nodes MCP",
    "vendor": "nerding-io",
    "githubRepo": "nerding-io/n8n-nodes-mcp",
    "breakingSummary": "N8n Nodes MCP (n8n-nodes-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "n8n-nodes-mcp"
    ],
    "migrationBefore": "\"n8n-nodes-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"n8n-nodes-mcp@latest\"]\n}",
    "migrationAfter": "\"n8n-nodes-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"n8n-nodes-mcp@0.1.37\"]\n}"
  },
  {
    "slug": "github-mcp-registry",
    "packageName": "@github/mcp-registry",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Github MCP Registry",
    "vendor": "Github",
    "githubRepo": "github/mcp-registry",
    "breakingSummary": "Github MCP Registry (@github/mcp-registry) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-registry"
    ],
    "migrationBefore": "\"github-mcp-registry\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@github/mcp-registry@latest\"]\n}",
    "migrationAfter": "\"github-mcp-registry\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@github/mcp-registry@0.1.7\"]\n}"
  },
  {
    "slug": "salesforce-mcp",
    "packageName": "@salesforce/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Salesforce MCP",
    "vendor": "Salesforce",
    "githubRepo": "salesforcecli/mcp",
    "breakingSummary": "Salesforce MCP (@salesforce/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"salesforce-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@salesforce/mcp@latest\"]\n}",
    "migrationAfter": "\"salesforce-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@salesforce/mcp@0.30.15\"]\n}"
  },
  {
    "slug": "tacticlaunch-mcp-linear",
    "packageName": "@tacticlaunch/mcp-linear",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Tacticlaunch MCP Linear",
    "vendor": "Tacticlaunch",
    "githubRepo": "tacticlaunch/mcp-linear",
    "breakingSummary": "Tacticlaunch MCP Linear (@tacticlaunch/mcp-linear) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-linear"
    ],
    "migrationBefore": "\"tacticlaunch-mcp-linear\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@tacticlaunch/mcp-linear@latest\"]\n}",
    "migrationAfter": "\"tacticlaunch-mcp-linear\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@tacticlaunch/mcp-linear@1.4.5\"]\n}"
  },
  {
    "slug": "productbrain-mcp",
    "packageName": "@productbrain/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Productbrain MCP",
    "vendor": "Productbrain",
    "githubRepo": "synergyai-os/productbrain",
    "breakingSummary": "Productbrain MCP (@productbrain/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"productbrain-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@productbrain/mcp@latest\"]\n}",
    "migrationAfter": "\"productbrain-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@productbrain/mcp@0.0.1-beta.12386\"]\n}"
  },
  {
    "slug": "mcpjam-sdk",
    "packageName": "@mcpjam/sdk",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Mcpjam SDK",
    "vendor": "Mcpjam",
    "githubRepo": "MCPJam/inspector",
    "breakingSummary": "Mcpjam SDK (@mcpjam/sdk) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "sdk"
    ],
    "migrationBefore": "\"mcpjam-sdk\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@mcpjam/sdk@latest\"]\n}",
    "migrationAfter": "\"mcpjam-sdk\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@mcpjam/sdk@10.0.0\"]\n}"
  },
  {
    "slug": "ericthered926-duckduckgo-mcp-server",
    "packageName": "@ericthered926/duckduckgo-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Ericthered926 Duckduckgo MCP Server",
    "vendor": "Ericthered926",
    "githubRepo": "ericthered926/duckduckgo-mcp-server",
    "breakingSummary": "Ericthered926 Duckduckgo MCP Server (@ericthered926/duckduckgo-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "duckduckgo-mcp-server"
    ],
    "migrationBefore": "\"ericthered926-duckduckgo-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@ericthered926/duckduckgo-mcp-server@latest\"]\n}",
    "migrationAfter": "\"ericthered926-duckduckgo-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@ericthered926/duckduckgo-mcp-server@0.6.0\"]\n}"
  },
  {
    "slug": "metamask-device-mcp",
    "packageName": "@metamask/device-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Metamask Device MCP",
    "vendor": "Metamask",
    "githubRepo": "MetaMask/device-mcp",
    "breakingSummary": "Metamask Device MCP (@metamask/device-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "device-mcp"
    ],
    "migrationBefore": "\"metamask-device-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@metamask/device-mcp@latest\"]\n}",
    "migrationAfter": "\"metamask-device-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@metamask/device-mcp@0.5.0\"]\n}"
  },
  {
    "slug": "mcp-lite",
    "packageName": "mcp-lite",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "MCP Lite",
    "vendor": "fiberplane",
    "githubRepo": "fiberplane/mcp-lite",
    "breakingSummary": "MCP Lite (mcp-lite) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-lite"
    ],
    "migrationBefore": "\"mcp-lite\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-lite@latest\"]\n}",
    "migrationAfter": "\"mcp-lite\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-lite@0.10.0\"]\n}"
  },
  {
    "slug": "comfyui-mcp",
    "packageName": "comfyui-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Comfyui MCP",
    "vendor": "artokun",
    "githubRepo": "artokun/comfyui-mcp",
    "breakingSummary": "Comfyui MCP (comfyui-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "comfyui-mcp"
    ],
    "migrationBefore": "\"comfyui-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"comfyui-mcp@latest\"]\n}",
    "migrationAfter": "\"comfyui-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"comfyui-mcp@0.52.206\"]\n}"
  },
  {
    "slug": "slack-mcp-server",
    "packageName": "slack-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Slack MCP Server",
    "vendor": "korotovsky",
    "githubRepo": "korotovsky/slack-mcp-server",
    "breakingSummary": "Slack MCP Server (slack-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "slack-mcp-server"
    ],
    "migrationBefore": "\"slack-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"slack-mcp-server@latest\"]\n}",
    "migrationAfter": "\"slack-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"slack-mcp-server@1.3.0\"]\n}"
  },
  {
    "slug": "hevy-mcp",
    "packageName": "hevy-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Hevy MCP",
    "vendor": "chrisdoc",
    "githubRepo": "chrisdoc/hevy-mcp",
    "breakingSummary": "Hevy MCP (hevy-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "hevy-mcp"
    ],
    "migrationBefore": "\"hevy-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"hevy-mcp@latest\"]\n}",
    "migrationAfter": "\"hevy-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"hevy-mcp@6.2.1\"]\n}"
  },
  {
    "slug": "winor30-mcp-server-datadog",
    "packageName": "@winor30/mcp-server-datadog",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Winor30 MCP Server Datadog",
    "vendor": "Winor30",
    "githubRepo": "winor30/mcp-server-datadog",
    "breakingSummary": "Winor30 MCP Server Datadog (@winor30/mcp-server-datadog) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server-datadog"
    ],
    "migrationBefore": "\"winor30-mcp-server-datadog\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@winor30/mcp-server-datadog@latest\"]\n}",
    "migrationAfter": "\"winor30-mcp-server-datadog\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@winor30/mcp-server-datadog@1.8.0\"]\n}"
  },
  {
    "slug": "automattic-mcp-wordpress-remote",
    "packageName": "@automattic/mcp-wordpress-remote",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Automattic MCP Wordpress Remote",
    "vendor": "Automattic",
    "githubRepo": "Automattic/mcp-wordpress-remote",
    "breakingSummary": "Automattic MCP Wordpress Remote (@automattic/mcp-wordpress-remote) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-wordpress-remote"
    ],
    "migrationBefore": "\"automattic-mcp-wordpress-remote\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@automattic/mcp-wordpress-remote@latest\"]\n}",
    "migrationAfter": "\"automattic-mcp-wordpress-remote\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@automattic/mcp-wordpress-remote@0.5.4\"]\n}"
  },
  {
    "slug": "drawio-mcp",
    "packageName": "@drawio/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Drawio MCP",
    "vendor": "Drawio",
    "githubRepo": "jgraph/drawio-mcp",
    "breakingSummary": "Drawio MCP (@drawio/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"drawio-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@drawio/mcp@latest\"]\n}",
    "migrationAfter": "\"drawio-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@drawio/mcp@1.10.0\"]\n}"
  },
  {
    "slug": "palisadeemail-mcp",
    "packageName": "@palisadeemail/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Palisadeemail MCP",
    "vendor": "Palisadeemail",
    "githubRepo": "palisadeemail/palisade-mcp",
    "breakingSummary": "Palisadeemail MCP (@palisadeemail/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"palisadeemail-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@palisadeemail/mcp@latest\"]\n}",
    "migrationAfter": "\"palisadeemail-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@palisadeemail/mcp@0.2.1\"]\n}"
  },
  {
    "slug": "xeroapi-xero-mcp-server",
    "packageName": "@xeroapi/xero-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Payments & FinTech MCP",
    "displayName": "Xeroapi Xero MCP Server",
    "vendor": "Xeroapi",
    "githubRepo": "XeroAPI/xero-mcp-server",
    "breakingSummary": "Xeroapi Xero MCP Server (@xeroapi/xero-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "xero-mcp-server"
    ],
    "migrationBefore": "\"xeroapi-xero-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@xeroapi/xero-mcp-server@latest\"]\n}",
    "migrationAfter": "\"xeroapi-xero-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@xeroapi/xero-mcp-server@0.0.17\"]\n}"
  },
  {
    "slug": "cloudbase-cloudbase-mcp",
    "packageName": "@cloudbase/cloudbase-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Cloudbase MCP",
    "vendor": "Cloudbase",
    "githubRepo": "TencentCloudBase/CloudBase-AI-Toolkit",
    "breakingSummary": "Cloudbase MCP (@cloudbase/cloudbase-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "cloudbase-mcp"
    ],
    "migrationBefore": "\"cloudbase-cloudbase-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cloudbase/cloudbase-mcp@latest\"]\n}",
    "migrationAfter": "\"cloudbase-cloudbase-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cloudbase/cloudbase-mcp@2.36.1\"]\n}"
  },
  {
    "slug": "brave-brave-search-mcp-server",
    "packageName": "@brave/brave-search-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Brave Search MCP Server",
    "vendor": "Brave",
    "githubRepo": "brave/brave-search-mcp-server",
    "breakingSummary": "Brave Search MCP Server (@brave/brave-search-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "brave-search-mcp-server"
    ],
    "migrationBefore": "\"brave-brave-search-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@brave/brave-search-mcp-server@latest\"]\n}",
    "migrationAfter": "\"brave-brave-search-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@brave/brave-search-mcp-server@2.1.4\"]\n}"
  },
  {
    "slug": "figma-console-mcp",
    "packageName": "figma-console-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Figma Console MCP",
    "vendor": "southleft",
    "githubRepo": "southleft/figma-console-mcp",
    "breakingSummary": "Figma Console MCP (figma-console-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "figma-console-mcp"
    ],
    "migrationBefore": "\"figma-console-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"figma-console-mcp@latest\"]\n}",
    "migrationAfter": "\"figma-console-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"figma-console-mcp@1.40.9\"]\n}"
  },
  {
    "slug": "argocd-mcp",
    "packageName": "argocd-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Argocd MCP",
    "vendor": "argoproj-labs",
    "githubRepo": "argoproj-labs/mcp-for-argocd",
    "breakingSummary": "Argocd MCP (argocd-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "argocd-mcp"
    ],
    "migrationBefore": "\"argocd-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"argocd-mcp@latest\"]\n}",
    "migrationAfter": "\"argocd-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"argocd-mcp@0.9.0\"]\n}"
  },
  {
    "slug": "goke-mcp",
    "packageName": "@goke/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Goke MCP",
    "vendor": "Goke",
    "githubRepo": "remorses/goke",
    "breakingSummary": "Goke MCP (@goke/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"goke-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@goke/mcp@latest\"]\n}",
    "migrationAfter": "\"goke-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@goke/mcp@0.1.2\"]\n}"
  },
  {
    "slug": "transcend-io-mcp",
    "packageName": "@transcend-io/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Transcend-io MCP",
    "vendor": "Transcend Io",
    "githubRepo": "transcend-io/tools",
    "breakingSummary": "Transcend-io MCP (@transcend-io/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"transcend-io-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@transcend-io/mcp@latest\"]\n}",
    "migrationAfter": "\"transcend-io-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@transcend-io/mcp@1.7.0\"]\n}"
  },
  {
    "slug": "browserstack-mcp-server",
    "packageName": "@browserstack/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Browserstack MCP Server",
    "vendor": "Browserstack",
    "githubRepo": "browserstack/mcp-server",
    "breakingSummary": "Browserstack MCP Server (@browserstack/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"browserstack-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@browserstack/mcp-server@latest\"]\n}",
    "migrationAfter": "\"browserstack-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@browserstack/mcp-server@2.2.7\"]\n}"
  },
  {
    "slug": "tiny-stdio-mcp-server",
    "packageName": "tiny-stdio-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Tiny Stdio MCP Server",
    "vendor": "poe-platform",
    "githubRepo": "poe-platform/poe-code",
    "breakingSummary": "Tiny Stdio MCP Server (tiny-stdio-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "tiny-stdio-mcp-server"
    ],
    "migrationBefore": "\"tiny-stdio-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"tiny-stdio-mcp-server@latest\"]\n}",
    "migrationAfter": "\"tiny-stdio-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"tiny-stdio-mcp-server@0.1.32\"]\n}"
  },
  {
    "slug": "xmcp",
    "packageName": "xmcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Xmcp",
    "vendor": "basementstudio",
    "githubRepo": "basementstudio/xmcp",
    "breakingSummary": "Xmcp (xmcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "xmcp"
    ],
    "migrationBefore": "\"xmcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"xmcp@latest\"]\n}",
    "migrationAfter": "\"xmcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"xmcp@1.9.0\"]\n}"
  },
  {
    "slug": "cyanheads-mcp-ts-core",
    "packageName": "@cyanheads/mcp-ts-core",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Cyanheads MCP Ts Core",
    "vendor": "Cyanheads",
    "githubRepo": "cyanheads/mcp-ts-core",
    "breakingSummary": "Cyanheads MCP Ts Core (@cyanheads/mcp-ts-core) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-ts-core"
    ],
    "migrationBefore": "\"cyanheads-mcp-ts-core\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cyanheads/mcp-ts-core@latest\"]\n}",
    "migrationAfter": "\"cyanheads-mcp-ts-core\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cyanheads/mcp-ts-core@0.13.15\"]\n}"
  },
  {
    "slug": "opencode-mcp",
    "packageName": "opencode-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Opencode MCP",
    "vendor": "AlaeddineMessadi",
    "githubRepo": "AlaeddineMessadi/opencode-mcp",
    "breakingSummary": "Opencode MCP (opencode-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "opencode-mcp"
    ],
    "migrationBefore": "\"opencode-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"opencode-mcp@latest\"]\n}",
    "migrationAfter": "\"opencode-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"opencode-mcp@3.0.0\"]\n}"
  },
  {
    "slug": "shortcut-mcp",
    "packageName": "@shortcut/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Shortcut MCP",
    "vendor": "Shortcut",
    "githubRepo": "useshortcut/mcp-server-shortcut",
    "breakingSummary": "Shortcut MCP (@shortcut/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"shortcut-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@shortcut/mcp@latest\"]\n}",
    "migrationAfter": "\"shortcut-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@shortcut/mcp@0.25.0\"]\n}"
  },
  {
    "slug": "hono-mcp-server-sse-transport",
    "packageName": "hono-mcp-server-sse-transport",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Hono MCP Server Sse Transport",
    "vendor": "NikaBuligini",
    "githubRepo": "NikaBuligini/hono-mcp-server-sse-transport",
    "breakingSummary": "Hono MCP Server Sse Transport (hono-mcp-server-sse-transport) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "hono-mcp-server-sse-transport"
    ],
    "migrationBefore": "\"hono-mcp-server-sse-transport\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"hono-mcp-server-sse-transport@latest\"]\n}",
    "migrationAfter": "\"hono-mcp-server-sse-transport\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"hono-mcp-server-sse-transport@0.0.7\"]\n}"
  },
  {
    "slug": "turbopuffer-turbopuffer-mcp",
    "packageName": "@turbopuffer/turbopuffer-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Turbopuffer MCP",
    "vendor": "Turbopuffer",
    "githubRepo": "turbopuffer/turbopuffer-typescript",
    "breakingSummary": "Turbopuffer MCP (@turbopuffer/turbopuffer-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "turbopuffer-mcp"
    ],
    "migrationBefore": "\"turbopuffer-turbopuffer-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@turbopuffer/turbopuffer-mcp@latest\"]\n}",
    "migrationAfter": "\"turbopuffer-turbopuffer-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@turbopuffer/turbopuffer-mcp@2.7.0\"]\n}"
  },
  {
    "slug": "vantasdk-vanta-mcp-server",
    "packageName": "@vantasdk/vanta-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Vantasdk Vanta MCP Server",
    "vendor": "Vantasdk",
    "githubRepo": "VantaInc/vanta-mcp-server",
    "breakingSummary": "Vantasdk Vanta MCP Server (@vantasdk/vanta-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "vanta-mcp-server"
    ],
    "migrationBefore": "\"vantasdk-vanta-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@vantasdk/vanta-mcp-server@latest\"]\n}",
    "migrationAfter": "\"vantasdk-vanta-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@vantasdk/vanta-mcp-server@1.2.0\"]\n}"
  },
  {
    "slug": "voltagent-mcp-server",
    "packageName": "@voltagent/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Voltagent MCP Server",
    "vendor": "Voltagent",
    "githubRepo": "VoltAgent/voltagent",
    "breakingSummary": "Voltagent MCP Server (@voltagent/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"voltagent-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@voltagent/mcp-server@latest\"]\n}",
    "migrationAfter": "\"voltagent-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@voltagent/mcp-server@2.2.0\"]\n}"
  },
  {
    "slug": "kya-os-mcp",
    "packageName": "@kya-os/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Kya-os MCP",
    "vendor": "Kya Os",
    "githubRepo": "decentralized-identity/kya-os-mcp",
    "breakingSummary": "Kya-os MCP (@kya-os/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"kya-os-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@kya-os/mcp@latest\"]\n}",
    "migrationAfter": "\"kya-os-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@kya-os/mcp@1.21.1\"]\n}"
  },
  {
    "slug": "eslint-mcp",
    "packageName": "@eslint/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Eslint MCP",
    "vendor": "Eslint",
    "githubRepo": "eslint/rewrite",
    "breakingSummary": "Eslint MCP (@eslint/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"eslint-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@eslint/mcp@latest\"]\n}",
    "migrationAfter": "\"eslint-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@eslint/mcp@0.3.15\"]\n}"
  },
  {
    "slug": "elgato-mcp-server",
    "packageName": "@elgato/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Elgato MCP Server",
    "vendor": "Elgato",
    "githubRepo": "elgatosf/elgato-mcp-server",
    "breakingSummary": "Elgato MCP Server (@elgato/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"elgato-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@elgato/mcp-server@latest\"]\n}",
    "migrationAfter": "\"elgato-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@elgato/mcp-server@0.1.8\"]\n}"
  },
  {
    "slug": "gongrzhe-server-gmail-autoauth-mcp",
    "packageName": "@gongrzhe/server-gmail-autoauth-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Gongrzhe Server Gmail Autoauth MCP",
    "vendor": "Gongrzhe",
    "githubRepo": "gongrzhe/server-gmail-autoauth-mcp",
    "breakingSummary": "Gongrzhe Server Gmail Autoauth MCP (@gongrzhe/server-gmail-autoauth-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "server-gmail-autoauth-mcp"
    ],
    "migrationBefore": "\"gongrzhe-server-gmail-autoauth-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@gongrzhe/server-gmail-autoauth-mcp@latest\"]\n}",
    "migrationAfter": "\"gongrzhe-server-gmail-autoauth-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@gongrzhe/server-gmail-autoauth-mcp@1.1.11\"]\n}"
  },
  {
    "slug": "primer-mcp",
    "packageName": "@primer/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Primer MCP",
    "vendor": "Primer",
    "githubRepo": "primer/react",
    "breakingSummary": "Primer MCP (@primer/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"primer-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@primer/mcp@latest\"]\n}",
    "migrationAfter": "\"primer-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@primer/mcp@1.1.2\"]\n}"
  },
  {
    "slug": "microsoft-powerbi-modeling-mcp",
    "packageName": "@microsoft/powerbi-modeling-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Microsoft Powerbi Modeling MCP",
    "vendor": "Microsoft",
    "githubRepo": "microsoft/powerbi-modeling-mcp",
    "breakingSummary": "Microsoft Powerbi Modeling MCP (@microsoft/powerbi-modeling-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "powerbi-modeling-mcp"
    ],
    "migrationBefore": "\"microsoft-powerbi-modeling-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@microsoft/powerbi-modeling-mcp@latest\"]\n}",
    "migrationAfter": "\"microsoft-powerbi-modeling-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@microsoft/powerbi-modeling-mcp@1.0.0\"]\n}"
  },
  {
    "slug": "aashari-mcp-server-atlassian-jira",
    "packageName": "@aashari/mcp-server-atlassian-jira",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Aashari MCP Server Atlassian Jira",
    "vendor": "Aashari",
    "githubRepo": "aashari/mcp-server-atlassian-jira",
    "breakingSummary": "Aashari MCP Server Atlassian Jira (@aashari/mcp-server-atlassian-jira) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server-atlassian-jira"
    ],
    "migrationBefore": "\"aashari-mcp-server-atlassian-jira\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@aashari/mcp-server-atlassian-jira@latest\"]\n}",
    "migrationAfter": "\"aashari-mcp-server-atlassian-jira\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@aashari/mcp-server-atlassian-jira@3.3.0\"]\n}"
  },
  {
    "slug": "pptx-viewer-mcp",
    "packageName": "pptx-viewer-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Pptx Viewer MCP",
    "vendor": "ChristopherVR",
    "githubRepo": "ChristopherVR/ooxml",
    "breakingSummary": "Pptx Viewer MCP (pptx-viewer-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "pptx-viewer-mcp"
    ],
    "migrationBefore": "\"pptx-viewer-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"pptx-viewer-mcp@latest\"]\n}",
    "migrationAfter": "\"pptx-viewer-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"pptx-viewer-mcp@2.8.9\"]\n}"
  },
  {
    "slug": "dataforseo-mcp-server",
    "packageName": "dataforseo-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Dataforseo MCP Server",
    "vendor": "dataforseo",
    "githubRepo": "dataforseo/mcp-server-typescript",
    "breakingSummary": "Dataforseo MCP Server (dataforseo-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "dataforseo-mcp-server"
    ],
    "migrationBefore": "\"dataforseo-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"dataforseo-mcp-server@latest\"]\n}",
    "migrationAfter": "\"dataforseo-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"dataforseo-mcp-server@3.1.3\"]\n}"
  },
  {
    "slug": "nest-openapi-mcp",
    "packageName": "@nest-openapi/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Nest-openapi MCP",
    "vendor": "Nest Openapi",
    "githubRepo": "ts-oas/nest-openapi",
    "breakingSummary": "Nest-openapi MCP (@nest-openapi/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"nest-openapi-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@nest-openapi/mcp@latest\"]\n}",
    "migrationAfter": "\"nest-openapi-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@nest-openapi/mcp@0.1.0\"]\n}"
  },
  {
    "slug": "tpsdev-ai-flair-mcp",
    "packageName": "@tpsdev-ai/flair-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Tpsdev-ai Flair MCP",
    "vendor": "Tpsdev Ai",
    "githubRepo": "tpsdev-ai/flair",
    "breakingSummary": "Tpsdev-ai Flair MCP (@tpsdev-ai/flair-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "flair-mcp"
    ],
    "migrationBefore": "\"tpsdev-ai-flair-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@tpsdev-ai/flair-mcp@latest\"]\n}",
    "migrationAfter": "\"tpsdev-ai-flair-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@tpsdev-ai/flair-mcp@0.62.0\"]\n}"
  },
  {
    "slug": "mcp-from-openapi",
    "packageName": "mcp-from-openapi",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "MCP From Openapi",
    "vendor": "agentfront",
    "githubRepo": "agentfront/mcp-from-openapi",
    "breakingSummary": "MCP From Openapi (mcp-from-openapi) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-from-openapi"
    ],
    "migrationBefore": "\"mcp-from-openapi\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-from-openapi@latest\"]\n}",
    "migrationAfter": "\"mcp-from-openapi\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-from-openapi@2.9.1\"]\n}"
  },
  {
    "slug": "openapi-mcp-generator",
    "packageName": "openapi-mcp-generator",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Openapi MCP Generator",
    "vendor": "harsha-iiiv",
    "githubRepo": "harsha-iiiv/openapi-mcp-generator",
    "breakingSummary": "Openapi MCP Generator (openapi-mcp-generator) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "openapi-mcp-generator"
    ],
    "migrationBefore": "\"openapi-mcp-generator\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"openapi-mcp-generator@latest\"]\n}",
    "migrationAfter": "\"openapi-mcp-generator\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"openapi-mcp-generator@5.0.0\"]\n}"
  },
  {
    "slug": "rate-api-mcp",
    "packageName": "@rate-api/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Payments & FinTech MCP",
    "displayName": "Rate-api MCP",
    "vendor": "Rate Api",
    "githubRepo": "Vilgar/rate-api-mcp",
    "breakingSummary": "Rate-api MCP (@rate-api/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"rate-api-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@rate-api/mcp@latest\"]\n}",
    "migrationAfter": "\"rate-api-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@rate-api/mcp@1.1.1\"]\n}"
  },
  {
    "slug": "benborla29-mcp-server-mysql",
    "packageName": "@benborla29/mcp-server-mysql",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Benborla29 MCP Server Mysql",
    "vendor": "Benborla29",
    "githubRepo": "benborla/mcp-server-mysql",
    "breakingSummary": "Benborla29 MCP Server Mysql (@benborla29/mcp-server-mysql) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server-mysql"
    ],
    "migrationBefore": "\"benborla29-mcp-server-mysql\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@benborla29/mcp-server-mysql@latest\"]\n}",
    "migrationAfter": "\"benborla29-mcp-server-mysql\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@benborla29/mcp-server-mysql@2.0.9\"]\n}"
  },
  {
    "slug": "redocly-mcp-typescript-sdk",
    "packageName": "@redocly/mcp-typescript-sdk",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Redocly MCP Typescript SDK",
    "vendor": "Redocly",
    "githubRepo": "redocly-contrib/mcp-typescript-sdk",
    "breakingSummary": "Redocly MCP Typescript SDK (@redocly/mcp-typescript-sdk) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-typescript-sdk"
    ],
    "migrationBefore": "\"redocly-mcp-typescript-sdk\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@redocly/mcp-typescript-sdk@latest\"]\n}",
    "migrationAfter": "\"redocly-mcp-typescript-sdk\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@redocly/mcp-typescript-sdk@1.18.1\"]\n}"
  },
  {
    "slug": "convex-mcp-gateway",
    "packageName": "convex-mcp-gateway",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Convex MCP Gateway",
    "vendor": "tfohlmeister",
    "githubRepo": "tfohlmeister/convex-mcp-gateway",
    "breakingSummary": "Convex MCP Gateway (convex-mcp-gateway) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "convex-mcp-gateway"
    ],
    "migrationBefore": "\"convex-mcp-gateway\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"convex-mcp-gateway@latest\"]\n}",
    "migrationAfter": "\"convex-mcp-gateway\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"convex-mcp-gateway@2.1.1\"]\n}"
  },
  {
    "slug": "backlog-mcp-server",
    "packageName": "backlog-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Backlog MCP Server",
    "vendor": "nulab",
    "githubRepo": "nulab/backlog-mcp-server",
    "breakingSummary": "Backlog MCP Server (backlog-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "backlog-mcp-server"
    ],
    "migrationBefore": "\"backlog-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"backlog-mcp-server@latest\"]\n}",
    "migrationAfter": "\"backlog-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"backlog-mcp-server@0.23.2\"]\n}"
  },
  {
    "slug": "freee-mcp",
    "packageName": "freee-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Payments & FinTech MCP",
    "displayName": "Freee MCP",
    "vendor": "freee",
    "githubRepo": "freee/freee-mcp",
    "breakingSummary": "Freee MCP (freee-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "freee-mcp"
    ],
    "migrationBefore": "\"freee-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"freee-mcp@latest\"]\n}",
    "migrationAfter": "\"freee-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"freee-mcp@0.37.5\"]\n}"
  },
  {
    "slug": "togglhq-mcp",
    "packageName": "@togglhq/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Togglhq MCP",
    "vendor": "Togglhq",
    "githubRepo": "toggl/toggl-mcp",
    "breakingSummary": "Togglhq MCP (@togglhq/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"togglhq-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@togglhq/mcp@latest\"]\n}",
    "migrationAfter": "\"togglhq-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@togglhq/mcp@1.13.50\"]\n}"
  },
  {
    "slug": "brightdata-mcp",
    "packageName": "@brightdata/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Brightdata MCP",
    "vendor": "Brightdata",
    "githubRepo": "brightdata/brightdata-mcp",
    "breakingSummary": "Brightdata MCP (@brightdata/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"brightdata-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@brightdata/mcp@latest\"]\n}",
    "migrationAfter": "\"brightdata-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@brightdata/mcp@4.1.0\"]\n}"
  },
  {
    "slug": "typia-mcp",
    "packageName": "@typia/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Typia MCP",
    "vendor": "Typia",
    "githubRepo": "samchon/typia",
    "breakingSummary": "Typia MCP (@typia/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"typia-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@typia/mcp@latest\"]\n}",
    "migrationAfter": "\"typia-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@typia/mcp@15.2.0\"]\n}"
  },
  {
    "slug": "kubernetes-mcp-server",
    "packageName": "kubernetes-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Kubernetes MCP Server",
    "vendor": "containers",
    "githubRepo": "containers/kubernetes-mcp-server",
    "breakingSummary": "Kubernetes MCP Server (kubernetes-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "kubernetes-mcp-server"
    ],
    "migrationBefore": "\"kubernetes-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"kubernetes-mcp-server@latest\"]\n}",
    "migrationAfter": "\"kubernetes-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"kubernetes-mcp-server@0.0.69\"]\n}"
  },
  {
    "slug": "mcp-searxng",
    "packageName": "mcp-searxng",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "MCP Searxng",
    "vendor": "ihor-sokoliuk",
    "githubRepo": "ihor-sokoliuk/mcp-searxng",
    "breakingSummary": "MCP Searxng (mcp-searxng) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-searxng"
    ],
    "migrationBefore": "\"mcp-searxng\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-searxng@latest\"]\n}",
    "migrationAfter": "\"mcp-searxng\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-searxng@2.7.0\"]\n}"
  },
  {
    "slug": "mbox-mcp",
    "packageName": "mbox-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Mbox MCP",
    "vendor": "koleharv",
    "githubRepo": "koleharv/mbox-mcp",
    "breakingSummary": "Mbox MCP (mbox-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mbox-mcp"
    ],
    "migrationBefore": "\"mbox-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mbox-mcp@latest\"]\n}",
    "migrationAfter": "\"mbox-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mbox-mcp@0.1.2\"]\n}"
  },
  {
    "slug": "gleanwork-mcp-config-schema",
    "packageName": "@gleanwork/mcp-config-schema",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Gleanwork MCP Config Schema",
    "vendor": "Gleanwork",
    "githubRepo": "gleanwork/mcp-config",
    "breakingSummary": "Gleanwork MCP Config Schema (@gleanwork/mcp-config-schema) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-config-schema"
    ],
    "migrationBefore": "\"gleanwork-mcp-config-schema\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@gleanwork/mcp-config-schema@latest\"]\n}",
    "migrationAfter": "\"gleanwork-mcp-config-schema\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@gleanwork/mcp-config-schema@5.4.1\"]\n}"
  },
  {
    "slug": "alisaitteke-photoshop-mcp",
    "packageName": "@alisaitteke/photoshop-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Alisaitteke Photoshop MCP",
    "vendor": "Alisaitteke",
    "githubRepo": "alisaitteke/photoshop-mcp",
    "breakingSummary": "Alisaitteke Photoshop MCP (@alisaitteke/photoshop-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "photoshop-mcp"
    ],
    "migrationBefore": "\"alisaitteke-photoshop-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@alisaitteke/photoshop-mcp@latest\"]\n}",
    "migrationAfter": "\"alisaitteke-photoshop-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@alisaitteke/photoshop-mcp@1.7.37\"]\n}"
  },
  {
    "slug": "frontmcp-sdk",
    "packageName": "@frontmcp/sdk",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Frontmcp SDK",
    "vendor": "Frontmcp",
    "githubRepo": "agentfront/frontmcp",
    "breakingSummary": "Frontmcp SDK (@frontmcp/sdk) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "sdk"
    ],
    "migrationBefore": "\"frontmcp-sdk\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@frontmcp/sdk@latest\"]\n}",
    "migrationAfter": "\"frontmcp-sdk\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@frontmcp/sdk@1.10.10\"]\n}"
  },
  {
    "slug": "runpod-mcp-server",
    "packageName": "@runpod/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Runpod MCP Server",
    "vendor": "Runpod",
    "githubRepo": "runpod/runpod-mcp",
    "breakingSummary": "Runpod MCP Server (@runpod/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"runpod-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@runpod/mcp-server@latest\"]\n}",
    "migrationAfter": "\"runpod-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@runpod/mcp-server@4.6.0\"]\n}"
  },
  {
    "slug": "foldkit-devtools-mcp",
    "packageName": "@foldkit/devtools-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Foldkit Devtools MCP",
    "vendor": "Foldkit",
    "githubRepo": "foldkit/foldkit",
    "breakingSummary": "Foldkit Devtools MCP (@foldkit/devtools-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "devtools-mcp"
    ],
    "migrationBefore": "\"foldkit-devtools-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@foldkit/devtools-mcp@latest\"]\n}",
    "migrationAfter": "\"foldkit-devtools-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@foldkit/devtools-mcp@0.25.0\"]\n}"
  },
  {
    "slug": "rsbuild-plugin-vue-mcp",
    "packageName": "rsbuild-plugin-vue-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Rsbuild Plugin Vue MCP",
    "vendor": "BrightX",
    "githubRepo": "BrightX/rsbuild-plugin-vue-mcp",
    "breakingSummary": "Rsbuild Plugin Vue MCP (rsbuild-plugin-vue-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "rsbuild-plugin-vue-mcp"
    ],
    "migrationBefore": "\"rsbuild-plugin-vue-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"rsbuild-plugin-vue-mcp@latest\"]\n}",
    "migrationAfter": "\"rsbuild-plugin-vue-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"rsbuild-plugin-vue-mcp@0.1.3\"]\n}"
  },
  {
    "slug": "microsoft-clarity-mcp-server",
    "packageName": "@microsoft/clarity-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Observability MCP",
    "displayName": "Microsoft Clarity MCP Server",
    "vendor": "Microsoft",
    "githubRepo": "microsoft/clarity-mcp-server",
    "breakingSummary": "Microsoft Clarity MCP Server (@microsoft/clarity-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "clarity-mcp-server"
    ],
    "migrationBefore": "\"microsoft-clarity-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@microsoft/clarity-mcp-server@latest\"]\n}",
    "migrationAfter": "\"microsoft-clarity-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@microsoft/clarity-mcp-server@2.0.1\"]\n}"
  },
  {
    "slug": "meshy-ai-meshy-mcp-server",
    "packageName": "@meshy-ai/meshy-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Meshy-ai Meshy MCP Server",
    "vendor": "Meshy Ai",
    "githubRepo": "meshy-dev/meshy-mcp-server",
    "breakingSummary": "Meshy-ai Meshy MCP Server (@meshy-ai/meshy-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "meshy-mcp-server"
    ],
    "migrationBefore": "\"meshy-ai-meshy-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@meshy-ai/meshy-mcp-server@latest\"]\n}",
    "migrationAfter": "\"meshy-ai-meshy-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@meshy-ai/meshy-mcp-server@0.6.5\"]\n}"
  },
  {
    "slug": "next-ai-drawio-mcp-server",
    "packageName": "@next-ai-drawio/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Next-ai-drawio MCP Server",
    "vendor": "Next Ai Drawio",
    "githubRepo": "DayuanJiang/next-ai-draw-io",
    "breakingSummary": "Next-ai-drawio MCP Server (@next-ai-drawio/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"next-ai-drawio-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@next-ai-drawio/mcp-server@latest\"]\n}",
    "migrationAfter": "\"next-ai-drawio-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@next-ai-drawio/mcp-server@0.4.6\"]\n}"
  },
  {
    "slug": "cocal-google-calendar-mcp",
    "packageName": "@cocal/google-calendar-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Cocal Google Calendar MCP",
    "vendor": "Cocal",
    "githubRepo": "nspady/google-calendar-mcp",
    "breakingSummary": "Cocal Google Calendar MCP (@cocal/google-calendar-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "google-calendar-mcp"
    ],
    "migrationBefore": "\"cocal-google-calendar-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cocal/google-calendar-mcp@latest\"]\n}",
    "migrationAfter": "\"cocal-google-calendar-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@cocal/google-calendar-mcp@2.7.0\"]\n}"
  },
  {
    "slug": "imgly-codesign-mcp",
    "packageName": "@imgly/codesign-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Imgly Codesign MCP",
    "vendor": "Imgly",
    "githubRepo": "imgly/imgly-codesign",
    "breakingSummary": "Imgly Codesign MCP (@imgly/codesign-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "codesign-mcp"
    ],
    "migrationBefore": "\"imgly-codesign-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@imgly/codesign-mcp@latest\"]\n}",
    "migrationAfter": "\"imgly-codesign-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@imgly/codesign-mcp@0.5.1\"]\n}"
  },
  {
    "slug": "ssh-mcp",
    "packageName": "ssh-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "SSH MCP",
    "vendor": "tufantunc",
    "githubRepo": "tufantunc/ssh-mcp",
    "breakingSummary": "SSH MCP (ssh-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "ssh-mcp"
    ],
    "migrationBefore": "\"ssh-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"ssh-mcp@latest\"]\n}",
    "migrationAfter": "\"ssh-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"ssh-mcp@2.20.2\"]\n}"
  },
  {
    "slug": "dbx-app-mcp-server",
    "packageName": "@dbx-app/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Dbx-app MCP Server",
    "vendor": "Dbx App",
    "githubRepo": "t8y2/dbx",
    "breakingSummary": "Dbx-app MCP Server (@dbx-app/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"dbx-app-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@dbx-app/mcp-server@latest\"]\n}",
    "migrationAfter": "\"dbx-app-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@dbx-app/mcp-server@0.4.129\"]\n}"
  },
  {
    "slug": "smartbear-mcp",
    "packageName": "@smartbear/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Smartbear MCP",
    "vendor": "Smartbear",
    "githubRepo": "SmartBear/smartbear-mcp",
    "breakingSummary": "Smartbear MCP (@smartbear/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"smartbear-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@smartbear/mcp@latest\"]\n}",
    "migrationAfter": "\"smartbear-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@smartbear/mcp@0.42.0\"]\n}"
  },
  {
    "slug": "sap-mdk-mcp-server",
    "packageName": "@sap/mdk-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Sap Mdk MCP Server",
    "vendor": "Sap",
    "githubRepo": "SAP/mdk-mcp-server",
    "breakingSummary": "Sap Mdk MCP Server (@sap/mdk-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mdk-mcp-server"
    ],
    "migrationBefore": "\"sap-mdk-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@sap/mdk-mcp-server@latest\"]\n}",
    "migrationAfter": "\"sap-mdk-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@sap/mdk-mcp-server@0.4.2\"]\n}"
  },
  {
    "slug": "heroku-mcp-server",
    "packageName": "@heroku/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Cloud & Infra MCP",
    "displayName": "Heroku MCP Server",
    "vendor": "Heroku",
    "githubRepo": "heroku/heroku-mcp-server",
    "breakingSummary": "Heroku MCP Server (@heroku/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"heroku-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@heroku/mcp-server@latest\"]\n}",
    "migrationAfter": "\"heroku-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@heroku/mcp-server@1.2.12\"]\n}"
  },
  {
    "slug": "appium-mcp",
    "packageName": "appium-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Appium MCP",
    "vendor": "appium",
    "githubRepo": "appium/appium-mcp",
    "breakingSummary": "Appium MCP (appium-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "appium-mcp"
    ],
    "migrationBefore": "\"appium-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"appium-mcp@latest\"]\n}",
    "migrationAfter": "\"appium-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"appium-mcp@1.97.1\"]\n}"
  },
  {
    "slug": "vite-plugin-mcp",
    "packageName": "vite-plugin-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Vite Plugin MCP",
    "vendor": "antfu",
    "githubRepo": "antfu/nuxt-mcp-dev",
    "breakingSummary": "Vite Plugin MCP (vite-plugin-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "vite-plugin-mcp"
    ],
    "migrationBefore": "\"vite-plugin-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"vite-plugin-mcp@latest\"]\n}",
    "migrationAfter": "\"vite-plugin-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"vite-plugin-mcp@0.3.2\"]\n}"
  },
  {
    "slug": "davinci-resolve-mcp",
    "packageName": "davinci-resolve-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Davinci Resolve MCP",
    "vendor": "samuelgursky",
    "githubRepo": "samuelgursky/davinci-resolve-mcp",
    "breakingSummary": "Davinci Resolve MCP (davinci-resolve-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "davinci-resolve-mcp"
    ],
    "migrationBefore": "\"davinci-resolve-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"davinci-resolve-mcp@latest\"]\n}",
    "migrationAfter": "\"davinci-resolve-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"davinci-resolve-mcp@4.15.3\"]\n}"
  },
  {
    "slug": "contentful-mcp-server",
    "packageName": "@contentful/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Contentful MCP Server",
    "vendor": "Contentful",
    "githubRepo": "contentful/contentful-mcp-server",
    "breakingSummary": "Contentful MCP Server (@contentful/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"contentful-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@contentful/mcp-server@latest\"]\n}",
    "migrationAfter": "\"contentful-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@contentful/mcp-server@1.23.22\"]\n}"
  },
  {
    "slug": "auth0-auth0-mcp-server",
    "packageName": "@auth0/auth0-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Auth0 MCP Server",
    "vendor": "Auth0",
    "githubRepo": "auth0/auth0-mcp-server",
    "breakingSummary": "Auth0 MCP Server (@auth0/auth0-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "auth0-mcp-server"
    ],
    "migrationBefore": "\"auth0-auth0-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@auth0/auth0-mcp-server@latest\"]\n}",
    "migrationAfter": "\"auth0-auth0-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@auth0/auth0-mcp-server@0.1.0-beta.19\"]\n}"
  },
  {
    "slug": "agentistics-mcp",
    "packageName": "@agentistics/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Agentistics MCP",
    "vendor": "Agentistics",
    "githubRepo": "agentistics/agentistics",
    "breakingSummary": "Agentistics MCP (@agentistics/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"agentistics-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@agentistics/mcp@latest\"]\n}",
    "migrationAfter": "\"agentistics-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@agentistics/mcp@2.143.1\"]\n}"
  },
  {
    "slug": "nexus2520-bitbucket-mcp-server",
    "packageName": "@nexus2520/bitbucket-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Nexus2520 Bitbucket MCP Server",
    "vendor": "Nexus2520",
    "githubRepo": "pdogra1299/bitbucket-mcp-server",
    "breakingSummary": "Nexus2520 Bitbucket MCP Server (@nexus2520/bitbucket-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "bitbucket-mcp-server"
    ],
    "migrationBefore": "\"nexus2520-bitbucket-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@nexus2520/bitbucket-mcp-server@latest\"]\n}",
    "migrationAfter": "\"nexus2520-bitbucket-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@nexus2520/bitbucket-mcp-server@3.0.1\"]\n}"
  },
  {
    "slug": "ivotoby-openapi-mcp-server",
    "packageName": "@ivotoby/openapi-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Ivotoby Openapi MCP Server",
    "vendor": "Ivotoby",
    "githubRepo": "ivo-toby/mcp-openapi-server",
    "breakingSummary": "Ivotoby Openapi MCP Server (@ivotoby/openapi-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "openapi-mcp-server"
    ],
    "migrationBefore": "\"ivotoby-openapi-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@ivotoby/openapi-mcp-server@latest\"]\n}",
    "migrationAfter": "\"ivotoby-openapi-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@ivotoby/openapi-mcp-server@1.16.1\"]\n}"
  },
  {
    "slug": "aashari-mcp-server-atlassian-confluence",
    "packageName": "@aashari/mcp-server-atlassian-confluence",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Aashari MCP Server Atlassian Confluence",
    "vendor": "Aashari",
    "githubRepo": "aashari/mcp-server-atlassian-confluence",
    "breakingSummary": "Aashari MCP Server Atlassian Confluence (@aashari/mcp-server-atlassian-confluence) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server-atlassian-confluence"
    ],
    "migrationBefore": "\"aashari-mcp-server-atlassian-confluence\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@aashari/mcp-server-atlassian-confluence@latest\"]\n}",
    "migrationAfter": "\"aashari-mcp-server-atlassian-confluence\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@aashari/mcp-server-atlassian-confluence@3.3.0\"]\n}"
  },
  {
    "slug": "kenwea-mcp",
    "packageName": "@kenwea/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Kenwea MCP",
    "vendor": "Kenwea",
    "githubRepo": "kenwea-protocol/kenwea",
    "breakingSummary": "Kenwea MCP (@kenwea/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"kenwea-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@kenwea/mcp@latest\"]\n}",
    "migrationAfter": "\"kenwea-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@kenwea/mcp@0.7.1\"]\n}"
  },
  {
    "slug": "phantom-mcp-server",
    "packageName": "@phantom/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Payments & FinTech MCP",
    "displayName": "Phantom MCP Server",
    "vendor": "Phantom",
    "githubRepo": "phantom/phantom-connect-sdk",
    "breakingSummary": "Phantom MCP Server (@phantom/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"phantom-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@phantom/mcp-server@latest\"]\n}",
    "migrationAfter": "\"phantom-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@phantom/mcp-server@1.2.9\"]\n}"
  },
  {
    "slug": "apple-notes-mcp",
    "packageName": "apple-notes-mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Apple Notes MCP",
    "vendor": "sweetrb",
    "githubRepo": "sweetrb/apple-notes-mcp",
    "breakingSummary": "Apple Notes MCP (apple-notes-mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "apple-notes-mcp"
    ],
    "migrationBefore": "\"apple-notes-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"apple-notes-mcp@latest\"]\n}",
    "migrationAfter": "\"apple-notes-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"apple-notes-mcp@2.15.11\"]\n}"
  },
  {
    "slug": "mcp-auth",
    "packageName": "mcp-auth",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "MCP Auth",
    "vendor": "mcp-auth",
    "githubRepo": "mcp-auth/js",
    "breakingSummary": "MCP Auth (mcp-auth) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-auth"
    ],
    "migrationBefore": "\"mcp-auth\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-auth@latest\"]\n}",
    "migrationAfter": "\"mcp-auth\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-auth@1.0.0-beta.1\"]\n}"
  },
  {
    "slug": "taazkareem-clickup-mcp-server",
    "packageName": "@taazkareem/clickup-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Taazkareem Clickup MCP Server",
    "vendor": "Taazkareem",
    "githubRepo": "taazkareem/clickup-mcp-server",
    "breakingSummary": "Taazkareem Clickup MCP Server (@taazkareem/clickup-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "clickup-mcp-server"
    ],
    "migrationBefore": "\"taazkareem-clickup-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@taazkareem/clickup-mcp-server@latest\"]\n}",
    "migrationAfter": "\"taazkareem-clickup-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@taazkareem/clickup-mcp-server@0.14.6\"]\n}"
  },
  {
    "slug": "qase-mcp-server",
    "packageName": "@qase/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Qase MCP Server",
    "vendor": "Qase",
    "githubRepo": "qase-tms/qase-mcp-server",
    "breakingSummary": "Qase MCP Server (@qase/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"qase-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@qase/mcp-server@latest\"]\n}",
    "migrationAfter": "\"qase-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@qase/mcp-server@3.0.1\"]\n}"
  },
  {
    "slug": "growthbook-mcp",
    "packageName": "@growthbook/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Growthbook MCP",
    "vendor": "Growthbook",
    "githubRepo": "growthbook/growthbook-mcp",
    "breakingSummary": "Growthbook MCP (@growthbook/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"growthbook-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@growthbook/mcp@latest\"]\n}",
    "migrationAfter": "\"growthbook-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@growthbook/mcp@2.2.0\"]\n}"
  },
  {
    "slug": "rigour-labs-mcp",
    "packageName": "@rigour-labs/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Rigour-labs MCP",
    "vendor": "Rigour Labs",
    "githubRepo": "rigour-labs/rigour",
    "breakingSummary": "Rigour-labs MCP (@rigour-labs/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"rigour-labs-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@rigour-labs/mcp@latest\"]\n}",
    "migrationAfter": "\"rigour-labs-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@rigour-labs/mcp@7.0.14\"]\n}"
  },
  {
    "slug": "postman-postman-mcp-server",
    "packageName": "@postman/postman-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Postman MCP Server",
    "vendor": "Postman",
    "githubRepo": "postmanlabs/postman-mcp-server",
    "breakingSummary": "Postman MCP Server (@postman/postman-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "postman-mcp-server"
    ],
    "migrationBefore": "\"postman-postman-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@postman/postman-mcp-server@latest\"]\n}",
    "migrationAfter": "\"postman-postman-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@postman/postman-mcp-server@2.14.0\"]\n}"
  },
  {
    "slug": "atlassian-dc-mcp-jira",
    "packageName": "@atlassian-dc-mcp/jira",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Productivity & Docs MCP",
    "displayName": "Atlassian-dc-mcp Jira",
    "vendor": "Atlassian Dc Mcp",
    "githubRepo": "b1ff/atlassian-dc-mcp",
    "breakingSummary": "Atlassian-dc-mcp Jira (@atlassian-dc-mcp/jira) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "jira"
    ],
    "migrationBefore": "\"atlassian-dc-mcp-jira\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@atlassian-dc-mcp/jira@latest\"]\n}",
    "migrationAfter": "\"atlassian-dc-mcp-jira\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@atlassian-dc-mcp/jira@0.38.0\"]\n}"
  },
  {
    "slug": "wdio-mcp",
    "packageName": "@wdio/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Browser Automation MCP",
    "displayName": "Wdio MCP",
    "vendor": "Wdio",
    "githubRepo": "webdriverio/mcp",
    "breakingSummary": "Wdio MCP (@wdio/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"wdio-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@wdio/mcp@latest\"]\n}",
    "migrationAfter": "\"wdio-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@wdio/mcp@4.0.0\"]\n}"
  },
  {
    "slug": "fluttersdk-mcp",
    "packageName": "@fluttersdk/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP Bridge & Transport",
    "displayName": "Fluttersdk MCP",
    "vendor": "Fluttersdk",
    "githubRepo": "fluttersdk/ai",
    "breakingSummary": "Fluttersdk MCP (@fluttersdk/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"fluttersdk-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@fluttersdk/mcp@latest\"]\n}",
    "migrationAfter": "\"fluttersdk-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@fluttersdk/mcp@1.1.3\"]\n}"
  },
  {
    "slug": "aventurevc-mcp-server",
    "packageName": "@aventurevc/mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Aventurevc MCP Server",
    "vendor": "Aventurevc",
    "githubRepo": "aventurevc/aventure-mcp",
    "breakingSummary": "Aventurevc MCP Server (@aventurevc/mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-server"
    ],
    "migrationBefore": "\"aventurevc-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@aventurevc/mcp-server@latest\"]\n}",
    "migrationAfter": "\"aventurevc-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@aventurevc/mcp-server@0.8.241\"]\n}"
  },
  {
    "slug": "knip-mcp",
    "packageName": "@knip/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "MCP DevTool / Inspector",
    "displayName": "Knip MCP",
    "vendor": "Knip",
    "githubRepo": "webpro-nl/knip",
    "breakingSummary": "Knip MCP (@knip/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"knip-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@knip/mcp@latest\"]\n}",
    "migrationAfter": "\"knip-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@knip/mcp@0.0.36\"]\n}"
  },
  {
    "slug": "hypequery-mcp",
    "packageName": "@hypequery/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Database & Backend MCP",
    "displayName": "Hypequery MCP",
    "vendor": "Hypequery",
    "githubRepo": "hypequery/hypequery",
    "breakingSummary": "Hypequery MCP (@hypequery/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"hypequery-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@hypequery/mcp@latest\"]\n}",
    "migrationAfter": "\"hypequery-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@hypequery/mcp@0.9.0\"]\n}"
  },
  {
    "slug": "primeuix-mcp",
    "packageName": "@primeuix/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Design & UI MCP",
    "displayName": "Primeuix MCP",
    "vendor": "Primeuix",
    "githubRepo": "primefaces/primeuix",
    "breakingSummary": "Primeuix MCP (@primeuix/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"primeuix-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@primeuix/mcp@latest\"]\n}",
    "migrationAfter": "\"primeuix-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@primeuix/mcp@2.0.0\"]\n}"
  },
  {
    "slug": "obsidian-mcp-server",
    "packageName": "obsidian-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "Obsidian MCP Server",
    "vendor": "cyanheads",
    "githubRepo": "cyanheads/obsidian-mcp-server",
    "breakingSummary": "Obsidian MCP Server (obsidian-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "obsidian-mcp-server"
    ],
    "migrationBefore": "\"obsidian-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"obsidian-mcp-server@latest\"]\n}",
    "migrationAfter": "\"obsidian-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"obsidian-mcp-server@3.7.0\"]\n}"
  },
  {
    "slug": "mcp-local-rag",
    "packageName": "mcp-local-rag",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Search & Research MCP",
    "displayName": "MCP Local Rag",
    "vendor": "shinpr",
    "githubRepo": "shinpr/mcp-local-rag",
    "breakingSummary": "MCP Local Rag (mcp-local-rag) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "high",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp-local-rag"
    ],
    "migrationBefore": "\"mcp-local-rag\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-local-rag@latest\"]\n}",
    "migrationAfter": "\"mcp-local-rag\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"mcp-local-rag@0.23.1\"]\n}"
  },
  {
    "slug": "brightspace-mcp-server",
    "packageName": "brightspace-mcp-server",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "Brightspace MCP Server",
    "vendor": "RohanMuppa",
    "githubRepo": "RohanMuppa/brightspace-mcp-server",
    "breakingSummary": "Brightspace MCP Server (brightspace-mcp-server) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "brightspace-mcp-server"
    ],
    "migrationBefore": "\"brightspace-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"brightspace-mcp-server@latest\"]\n}",
    "migrationAfter": "\"brightspace-mcp-server\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"brightspace-mcp-server@5.1.6\"]\n}"
  },
  {
    "slug": "react-aria-mcp",
    "packageName": "@react-aria/mcp",
    "registry": "npm",
    "kind": "mcp",
    "subcategory": "Developer Tools MCP",
    "displayName": "React-aria MCP",
    "vendor": "React Aria",
    "githubRepo": "adobe/react-spectrum",
    "breakingSummary": "React-aria MCP (@react-aria/mcp) tracks MCP protocol and tools/list JSON Schema updates; pin exact version in .mcp.json to prevent breaking tool argument shifts.",
    "schemaDriftRisk": "medium",
    "affectedSymbols": [
      "tools/list",
      "tools/call",
      "mcp"
    ],
    "migrationBefore": "\"react-aria-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@react-aria/mcp@latest\"]\n}",
    "migrationAfter": "\"react-aria-mcp\": {\n  \"command\": \"npx\",\n  \"args\": [\"-y\", \"@react-aria/mcp@1.2.1\"]\n}"
  }
];

function sanitizeText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/\[![^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isStableVersion(v) {
  return !v.includes("-alpha") && !v.includes("-beta") && !v.includes("-rc") && !v.includes("-next") && !v.includes("-canary") && !v.includes("-dev") && !v.includes("a") && !v.includes("b") && !v.includes("rc");
}

function computeStabilityScore(recentReleasesCount90d, driftRisk, latestVersion) {
  let score = 92;
  if (driftRisk === "high") score -= 14;
  else if (driftRisk === "medium") score -= 6;
  if (recentReleasesCount90d > 25) score -= 8;
  else if (recentReleasesCount90d > 10) score -= 4;
  if (String(latestVersion).startsWith("0.")) score -= 5;
  return Math.max(62, Math.min(98, score));
}

function getStabilityGrade(score) {
  if (score >= 90) return "A";
  if (score >= 82) return "B+";
  if (score >= 75) return "B";
  return "C+";
}

async function fetchNpmMetadata(target) {
  const encoded = encodeURIComponent(target.packageName).replace("%40", "@");
  const url = `https://registry.npmjs.org/${encoded}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NPM fetch failed for ${target.packageName}: ${res.status}`);
  const data = await res.json();

  const latest = data["dist-tags"]?.latest || Object.keys(data.versions || {}).pop();
  if (!latest) throw new Error(`No latest version for ${target.packageName}`);
  const times = data.time || {};
  const latestPublishedAt = times[latest] || new Date().toISOString();

  let versionEntries = Object.entries(times)
    .filter(([k]) => k !== "created" && k !== "modified" && data.versions?.[k] && isStableVersion(k))
    .map(([version, publishedAt]) => ({ version, publishedAt }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (versionEntries.length === 0) {
    versionEntries = Object.entries(times)
      .filter(([k]) => k !== "created" && k !== "modified" && data.versions?.[k])
      .map(([version, publishedAt]) => ({ version, publishedAt }))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  const recentVersions = versionEntries.slice(0, 6);
  const cutoff90d = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const releasesLast90d = versionEntries.filter((v) => new Date(v.publishedAt).getTime() >= cutoff90d).length;

  const latestManifest = data.versions?.[latest] || {};
  const depsObj = latestManifest.dependencies || {};
  const depsCount = Object.keys(depsObj).length;
  const rawLicense = typeof latestManifest.license === "string"
    ? latestManifest.license
    : (typeof data.license === "string" ? data.license : "MIT");
  const license = sanitizeText(rawLicense.length > 24 ? rawLicense.slice(0, 24) : rawLicense);
  const description = sanitizeText(latestManifest.description || data.description || `${target.displayName} package.`);

  // Enrich affectedSymbols with bin entrypoints or key MCP dependencies if generic
  let affectedSymbols = target.affectedSymbols || [];
  const binKeys = typeof latestManifest.bin === "object" && latestManifest.bin ? Object.keys(latestManifest.bin) : [];
  if (affectedSymbols.includes("tools/list") && binKeys.length > 0) {
    affectedSymbols = [...new Set([...binKeys.slice(0, 2), "tools/list", "tools/call"])];
  }

  // Enrich breakingSummary with live version and MCP SDK dependency info if generic
  let breakingSummary = sanitizeText(target.breakingSummary);
  const mcpSdkRange = depsObj["@modelcontextprotocol/sdk"] || depsObj["fastmcp"] || depsObj["mcp-framework"];
  if (breakingSummary.includes("tracks MCP protocol and tools/list JSON Schema updates")) {
    const sdkNote = mcpSdkRange ? `Built on MCP SDK (${mcpSdkRange}); ` : "";
    const prevVer = recentVersions[1]?.version;
    const deltaNote = prevVer ? `recent release v${latest} (up from v${prevVer}) ` : `live release v${latest} `;
    breakingSummary = sanitizeText(
      `${sdkNote}${deltaNote}updates ${target.subcategory} tool schemas and transport handling (${releasesLast90d} releases in last 90d). Pin exact version v${latest} in .mcp.json to avoid silent parameter drift.`
    );
  }

  // Ensure migrationAfter uses the exact live version
  let migrationAfter = sanitizeText(target.migrationAfter) ? target.migrationAfter.replace(/[\u2014\u2013]/g, "-") : "";
  if (target.kind === "mcp" && migrationAfter.includes(`"${target.packageName}@`)) {
    migrationAfter = `"${target.slug}": {\n  "command": "npx",\n  "args": ["-y", "${target.packageName}@${latest}"]\n}`;
  }

  const score = computeStabilityScore(releasesLast90d, target.schemaDriftRisk, latest);

  return {
    ...target,
    displayName: sanitizeText(target.displayName),
    vendor: sanitizeText(target.vendor),
    description,
    breakingSummary,
    affectedSymbols,
    migrationBefore: target.migrationBefore.replace(/[\u2014\u2013]/g, "-"),
    migrationAfter,
    latestVersion: latest,
    latestPublishedAt,
    recentVersions,
    releasesLast90d,
    dependenciesCount: depsCount,
    license: license || "MIT",
    registryUrl: `https://www.npmjs.com/package/${target.packageName}`,
    githubUrl: `https://github.com/${target.githubRepo}`,
    installCommand: target.kind === "mcp"
      ? `npx -y ${target.packageName}@${latest}`
      : `npm install ${target.packageName}@${latest}`,
    stabilityScore: score,
    stabilityGrade: getStabilityGrade(score)
  };
}

async function fetchPypiMetadata(target) {
  const url = `https://pypi.org/pypi/${target.packageName}/json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PyPI fetch failed for ${target.packageName}: ${res.status}`);
  const data = await res.json();

  const latest = data.info?.version;
  const releasesObj = data.releases || {};

  let versionEntries = [];
  for (const [ver, files] of Object.entries(releasesObj)) {
    if (!Array.isArray(files) || files.length === 0) continue;
    if (!isStableVersion(ver)) continue;
    const uploadTime = files[0]?.upload_time_iso_8601;
    if (uploadTime) {
      versionEntries.push({ version: ver, publishedAt: uploadTime });
    }
  }
  if (versionEntries.length === 0) {
    for (const [ver, files] of Object.entries(releasesObj)) {
      if (!Array.isArray(files) || files.length === 0) continue;
      const uploadTime = files[0]?.upload_time_iso_8601;
      if (uploadTime) {
        versionEntries.push({ version: ver, publishedAt: uploadTime });
      }
    }
  }
  versionEntries.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const latestPublishedAt = versionEntries[0]?.publishedAt || new Date().toISOString();
  const recentVersions = versionEntries.slice(0, 6);
  const cutoff90d = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const releasesLast90d = versionEntries.filter((v) => new Date(v.publishedAt).getTime() >= cutoff90d).length;

  const requiresDist = Array.isArray(data.info?.requires_dist) ? data.info.requires_dist.length : 0;
  const rawLicense = data.info?.license || data.info?.license_expression || "MIT";
  const license = sanitizeText(rawLicense.length > 24 ? rawLicense.slice(0, 24) : rawLicense);
  const description = sanitizeText(data.info?.summary || `${target.displayName} Python package.`);

  let migrationAfter = target.migrationAfter.replace(/[\u2014\u2013]/g, "-");
  if (target.kind === "mcp" && migrationAfter.includes(`"${target.packageName}@latest"`)) {
    migrationAfter = `"${target.slug}": {\n  "command": "uvx",\n  "args": ["${target.packageName}@${latest}"],\n  "env": { "FASTMCP_LOG_LEVEL": "ERROR" }\n}`;
  }

  const score = computeStabilityScore(releasesLast90d, target.schemaDriftRisk, latest);

  return {
    ...target,
    displayName: sanitizeText(target.displayName),
    vendor: sanitizeText(target.vendor),
    description,
    breakingSummary: sanitizeText(target.breakingSummary),
    migrationBefore: target.migrationBefore.replace(/[\u2014\u2013]/g, "-"),
    migrationAfter,
    latestVersion: latest,
    latestPublishedAt,
    recentVersions,
    releasesLast90d,
    dependenciesCount: requiresDist,
    license: license || "MIT",
    registryUrl: `https://pypi.org/project/${target.packageName}/`,
    githubUrl: `https://github.com/${target.githubRepo}`,
    installCommand: target.kind === "mcp"
      ? `uvx ${target.packageName}@${latest}`
      : `pip install "${target.packageName}==${latest}"`,
    stabilityScore: score,
    stabilityGrade: getStabilityGrade(score)
  };
}

async function main() {
  console.log(`Fetching live registry metadata for ${TARGETS.length} Agent SDKs and MCP servers...`);
  const results = new Array(TARGETS.length);
  const concurrency = 16;
  let index = 0;

  async function worker() {
    while (index < TARGETS.length) {
      const i = index++;
      const target = TARGETS[i];
      try {
        const item = target.registry === "npm"
          ? await fetchNpmMetadata(target)
          : await fetchPypiMetadata(target);
        results[i] = item;
      } catch (err) {
        console.error(`[ERR] ${target.packageName}:`, err.message);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const validResults = results.filter(Boolean);
  const sdks = validResults.filter((r) => r.kind === "sdk");
  const mcps = validResults.filter((r) => r.kind === "mcp");

  const payload = {
    generatedAt: new Date().toISOString(),
    totalTracked: validResults.length,
    sdkCount: sdks.length,
    mcpCount: mcps.length,
    items: validResults
  };

  const outPath = path.resolve("/workspace/agentbreakwatch/data/catalog.json");
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Saved ${validResults.length} live items (${sdks.length} SDKs, ${mcps.length} MCP servers) to ${outPath}`);
}

main();
