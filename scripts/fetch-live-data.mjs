import fs from "node:fs/promises";
import path from "node:path";

const TARGETS = [
  // === 25 Core Agent SDKs ===
  {
    slug: "openai-node",
    packageName: "openai",
    registry: "npm",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "OpenAI Node SDK",
    vendor: "OpenAI",
    githubRepo: "openai/openai-node",
    breakingSummary: "Responses API and realtime event payloads updated; Chat Completions tool_choice strict schema enforcement tightened in v7.x.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["client.responses.create", "client.chat.completions.create", "RealtimeClient"],
    migrationBefore: `const res = await client.chat.completions.create({\n  model: "gpt-4o",\n  functions: [{ name: "lookup", parameters: schema }],\n  function_call: "auto"\n});`,
    migrationAfter: `const res = await client.responses.create({\n  model: "gpt-5",\n  tools: [{ type: "function", name: "lookup", parameters: schema, strict: true }],\n  tool_choice: "auto"\n});`
  },
  {
    slug: "anthropic-sdk-ts",
    packageName: "@anthropic-ai/sdk",
    registry: "npm",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "Anthropic TypeScript SDK",
    vendor: "Anthropic",
    githubRepo: "anthropics/anthropic-sdk-typescript",
    breakingSummary: "Major v1.x transition drops legacy completions helpers and enforces typed beta headers for computer-use, code-execution, and MCP connector blocks.",
    schemaDriftRisk: "high",
    affectedSymbols: ["anthropic.messages.create", "ToolUseBlock", "BetaMcpToolConfig"],
    migrationBefore: `const msg = await anthropic.beta.messages.create({\n  model: "claude-3-7-sonnet-20250219",\n  betas: ["token-efficient-tools-2025-02-19"],\n  messages\n});`,
    migrationAfter: `const msg = await anthropic.messages.create({\n  model: "claude-sonnet-4-5",\n  thinking: { type: "enabled", budget_tokens: 4096 },\n  messages\n});`
  },
  {
    slug: "mcp-sdk-ts",
    packageName: "@modelcontextprotocol/sdk",
    registry: "npm",
    kind: "sdk",
    subcategory: "MCP Core SDK",
    displayName: "Model Context Protocol TypeScript SDK",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/typescript-sdk",
    breakingSummary: "Streamable HTTP transport replaces legacy SSEClientTransport defaults; McpServer.registerTool inputSchema requires Zod object shape or JSON Schema draft-2020-12.",
    schemaDriftRisk: "high",
    affectedSymbols: ["McpServer", "StreamableHTTPServerTransport", "SSEClientTransport", "registerTool"],
    migrationBefore: `import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";\nconst transport = new SSEServerTransport("/messages", res);\nawait server.connect(transport);`,
    migrationAfter: `import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";\nconst transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });\nawait server.connect(transport);`
  },
  {
    slug: "vercel-ai-sdk",
    packageName: "ai",
    registry: "npm",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "Vercel AI SDK Core",
    vendor: "Vercel",
    githubRepo: "vercel/ai",
    breakingSummary: "AI SDK v7 unifies LanguageModelV3 provider specifications, replaces maxSteps with stopWhen(stepCountIs(n)), and restructures UIMessage stream parts.",
    schemaDriftRisk: "high",
    affectedSymbols: ["generateText", "streamText", "tool", "stopWhen", "UIMessage"],
    migrationBefore: `const result = await generateText({\n  model: openai("gpt-4o"),\n  maxSteps: 5,\n  tools: { weather: tool({ parameters: z.object({ city: z.string() }), execute }) }\n});`,
    migrationAfter: `const result = await generateText({\n  model: openai("gpt-5"),\n  stopWhen: stepCountIs(5),\n  tools: { weather: tool({ inputSchema: z.object({ city: z.string() }), execute }) }\n});`
  },
  {
    slug: "ai-sdk-openai",
    packageName: "@ai-sdk/openai",
    registry: "npm",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "Vercel AI SDK OpenAI Provider",
    vendor: "Vercel",
    githubRepo: "vercel/ai",
    breakingSummary: "v4 provider targets LanguageModelV3 spec and defaults to OpenAI Responses API for reasoning and built-in web/file search tools.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["openai", "openai.responses", "providerOptions.openai"],
    migrationBefore: `const model = openai("gpt-4o", { structuredOutputs: true });`,
    migrationAfter: `const model = openai.responses("gpt-5");`
  },
  {
    slug: "ai-sdk-anthropic",
    packageName: "@ai-sdk/anthropic",
    registry: "npm",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "Vercel AI SDK Anthropic Provider",
    vendor: "Vercel",
    githubRepo: "vercel/ai",
    breakingSummary: "v4 provider requires AI SDK 7+ and moves thinking budget configuration under providerOptions.anthropic.thinking.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["anthropic", "providerOptions.anthropic.thinking"],
    migrationBefore: `const model = anthropic("claude-3-7-sonnet-20250219", { sendReasoning: true });`,
    migrationAfter: `const result = await generateText({\n  model: anthropic("claude-sonnet-4-5"),\n  providerOptions: { anthropic: { thinking: { type: "enabled", budgetTokens: 4000 } } }\n});`
  },
  {
    slug: "langchain-core-js",
    packageName: "@langchain/core",
    registry: "npm",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "LangChain Core JS",
    vendor: "LangChain",
    githubRepo: "langchain-ai/langchainjs",
    breakingSummary: "v1.x removes deprecated RunnableBinding legacy call signatures and standardizes ToolMessage artifact and content_blocks metadata.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["StructuredTool", "RunnableSequence", "AIMessage", "bindTools"],
    migrationBefore: `const res = await model.call(messages, { functions: toolDefs });`,
    migrationAfter: `const modelWithTools = model.bindTools(toolDefs);\nconst res = await modelWithTools.invoke(messages);`
  },
  {
    slug: "langgraph-js",
    packageName: "@langchain/langgraph",
    registry: "npm",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "LangGraph.js",
    vendor: "LangChain",
    githubRepo: "langchain-ai/langgraphjs",
    breakingSummary: "v1.x StateGraph Annotation reducer syntax and interrupt() resume semantics updated; createReactAgent moved to @langchain/langgraph/prebuilt.",
    schemaDriftRisk: "high",
    affectedSymbols: ["StateGraph", "Annotation", "interrupt", "Command"],
    migrationBefore: `const workflow = new StateGraph({ channels: { messages: { value: (a, b) => a.concat(b) } } });`,
    migrationAfter: `const State = Annotation.Root({ messages: Annotation({ reducer: (a, b) => a.concat(b) }) });\nconst workflow = new StateGraph(State);`
  },
  {
    slug: "langchain-mcp-adapters",
    packageName: "@langchain/mcp-adapters",
    registry: "npm",
    kind: "sdk",
    subcategory: "MCP Core SDK",
    displayName: "LangChain MCP Adapters",
    vendor: "LangChain",
    githubRepo: "langchain-ai/langchainjs",
    breakingSummary: "v2.0 requires @langchain/core >= 1.0 and @modelcontextprotocol/sdk >= 1.20; MultiServerMCPClient transport config enforces explicit transport type.",
    schemaDriftRisk: "high",
    affectedSymbols: ["MultiServerMCPClient", "loadMcpTools"],
    migrationBefore: `const client = new MultiServerMCPClient({ math: { command: "node", args: ["server.js"] } });\nawait client.initializeConnections();`,
    migrationAfter: `const client = new MultiServerMCPClient({\n  mcpServers: { math: { transport: "stdio", command: "node", args: ["server.js"] } }\n});\nconst tools = await client.getTools();`
  },
  {
    slug: "mastra-core",
    packageName: "@mastra/core",
    registry: "npm",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "Mastra Core Framework",
    vendor: "Mastra",
    githubRepo: "mastra-ai/mastra",
    breakingSummary: "Rapid v1.x cadence updates Agent memory thread scoping, createTool inputSchema validation, and workflow step execution context.",
    schemaDriftRisk: "high",
    affectedSymbols: ["Mastra", "Agent", "createTool", "createWorkflow"],
    migrationBefore: `const agent = new Agent({ name: "helper", llm: { provider: "OPEN_AI", name: "gpt-4o" } });`,
    migrationAfter: `const agent = new Agent({ id: "helper", name: "helper", model: openai("gpt-5") });`
  },
  {
    slug: "openai-agents-js",
    packageName: "@openai/agents",
    registry: "npm",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "OpenAI Agents SDK (JS/TS)",
    vendor: "OpenAI",
    githubRepo: "openai/openai-agents-js",
    breakingSummary: "0.x minor releases regularly refine handoff filter signatures, hosted MCP tool definitions, and RealtimeAgent voice session events.",
    schemaDriftRisk: "high",
    affectedSymbols: ["Agent", "run", "tool", "handoff", "hostedMcpTool"],
    migrationBefore: `const myTool = tool({ name: "search", parameters: z.object({ q: z.string() }), execute: async ({ q }) => q });`,
    migrationAfter: `const myTool = tool({\n  name: "search",\n  description: "Search docs",\n  parameters: z.object({ q: z.string() }),\n  strict: true,\n  execute: async ({ q }) => q\n});`
  },
  {
    slug: "google-genai-js",
    packageName: "@google/genai",
    registry: "npm",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "Google Gen AI SDK (JS/TS)",
    vendor: "Google",
    githubRepo: "googleapis/js-genai",
    breakingSummary: "Replaces deprecated @google/generative-ai package; v2.x standardizes ai.models.generateContent and functionDeclarations schema typing.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["GoogleGenAI", "ai.models.generateContent", "FunctionDeclaration"],
    migrationBefore: `import { GoogleGenerativeAI } from "@google/generative-ai";\nconst genAI = new GoogleGenerativeAI(API_KEY);\nconst model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });`,
    migrationAfter: `import { GoogleGenAI } from "@google/genai";\nconst ai = new GoogleGenAI({ apiKey: API_KEY });\nconst response = await ai.models.generateContent({ model: "gemini-2.5-pro", contents: "Hello" });`
  },
  {
    slug: "stagehand",
    packageName: "@browserbasehq/stagehand",
    registry: "npm",
    kind: "sdk",
    subcategory: "Browser Agent SDK",
    displayName: "Stagehand Browser Agent SDK",
    vendor: "Browserbase",
    githubRepo: "browserbase/stagehand",
    breakingSummary: "v4.x overhauls stagehand.act() and stagehand.extract() options object, separating modelClient configuration from Playwright page lifecycle.",
    schemaDriftRisk: "high",
    affectedSymbols: ["Stagehand", "page.act", "page.extract", "page.observe"],
    migrationBefore: `await stagehand.page.act({ action: "click sign in", modelName: "gpt-4o" });`,
    migrationAfter: `await stagehand.act("click sign in");`
  },
  {
    slug: "mistralai-sdk",
    packageName: "@mistralai/mistralai",
    registry: "npm",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "Mistral AI TypeScript SDK",
    vendor: "Mistral AI",
    githubRepo: "mistralai/client-ts",
    breakingSummary: "v3.x generated via Speakeasy updates camelCase request fields and agents.complete tool call response union types.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["Mistral", "client.chat.complete", "client.agents.complete"],
    migrationBefore: `import MistralClient from "@mistralai/mistralai";\nconst client = new MistralClient(apiKey);`,
    migrationAfter: `import { Mistral } from "@mistralai/mistralai";\nconst client = new Mistral({ apiKey });`
  },
  {
    slug: "cohere-ai-js",
    packageName: "cohere-ai",
    registry: "npm",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "Cohere TypeScript SDK",
    vendor: "Cohere",
    githubRepo: "cohere-ai/cohere-typescript",
    breakingSummary: "v8.x defaults to Cohere Chat v2 endpoint (CohereClientV2) with OpenAI-style messages and strict tool parameter schemas.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["CohereClientV2", "cohere.chat"],
    migrationBefore: `const cohere = new CohereClient({ token });\nawait cohere.chat({ message: "hi", connectors: [{ id: "web-search" }] });`,
    migrationAfter: `const cohere = new CohereClientV2({ token });\nawait cohere.chat({ model: "command-a-03-2025", messages: [{ role: "user", content: "hi" }] });`
  },
  {
    slug: "openai-python",
    packageName: "openai",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "OpenAI Python SDK",
    vendor: "OpenAI",
    githubRepo: "openai/openai-python",
    breakingSummary: "v3.x Python SDK enforces Pydantic v2 strict models on client.responses.parse and removes legacy beta.threads assistants helpers.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["OpenAI", "AsyncOpenAI", "client.responses.parse"],
    migrationBefore: `completion = client.beta.chat.completions.parse(\n    model="gpt-4o",\n    messages=messages,\n    response_format=CalendarEvent,\n)`,
    migrationAfter: `response = client.responses.parse(\n    model="gpt-5",\n    input=messages,\n    text_format=CalendarEvent,\n)`
  },
  {
    slug: "anthropic-python",
    packageName: "anthropic",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Model Provider SDK",
    displayName: "Anthropic Python SDK",
    vendor: "Anthropic",
    githubRepo: "anthropics/anthropic-sdk-python",
    breakingSummary: "v2.x drops Python 3.9 support, requires typed thinking blocks on multi-turn tool loops, and updates streaming citation events.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["Anthropic", "AsyncAnthropic", "messages.stream"],
    migrationBefore: `client.beta.prompt_caching.messages.create(model="claude-3-5-sonnet-20241022", messages=msgs)`,
    migrationAfter: `client.messages.create(model="claude-sonnet-4-5", max_tokens=4096, messages=msgs)`
  },
  {
    slug: "mcp-python",
    packageName: "mcp",
    registry: "pypi",
    kind: "sdk",
    subcategory: "MCP Core SDK",
    displayName: "Model Context Protocol Python SDK",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/python-sdk",
    breakingSummary: "v2.x restructures FastMCP lifespan context, StreamableHTTP session handling, and CallToolResult structuredContent validation.",
    schemaDriftRisk: "high",
    affectedSymbols: ["FastMCP", "ClientSession", "streamablehttp_client", "CallToolResult"],
    migrationBefore: `from mcp.client.sse import sse_client\nasync with sse_client("http://localhost:8000/sse") as (read, write):\n    async with ClientSession(read, write) as session:\n        await session.initialize()`,
    migrationAfter: `from mcp.client.streamable_http import streamablehttp_client\nasync with streamablehttp_client("http://localhost:8000/mcp") as (read, write, _):\n    async with ClientSession(read, write) as session:\n        await session.initialize()`
  },
  {
    slug: "fastmcp-python",
    packageName: "fastmcp",
    registry: "pypi",
    kind: "sdk",
    subcategory: "MCP Core SDK",
    displayName: "FastMCP (Python)",
    vendor: "Prefect / Jlowin",
    githubRepo: "jlowin/fastmcp",
    breakingSummary: "FastMCP v4.x introduces OpenAPI/MCP composition mounts, OAuth proxy providers, and strict output_schema serialization.",
    schemaDriftRisk: "high",
    affectedSymbols: ["FastMCP", "Context", "Client", "mount"],
    migrationBefore: `mcp.mount("sub", sub_server)`,
    migrationAfter: `mcp.mount(sub_server, prefix="sub")`
  },
  {
    slug: "langgraph-python",
    packageName: "langgraph",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "LangGraph (Python)",
    vendor: "LangChain",
    githubRepo: "langchain-ai/langgraph",
    breakingSummary: "v1.x standardizes human-in-the-loop interrupt() and Command(resume=...) primitives and moves prebuilt agents to langgraph.prebuilt.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["StateGraph", "interrupt", "Command", " InMemorySaver"],
    migrationBefore: `from langgraph.checkpoint.sqlite import SqliteSaver\nmemory = SqliteSaver.from_conn_string(":memory:")`,
    migrationAfter: `from langgraph.checkpoint.memory import InMemorySaver\ncheckpointer = InMemorySaver()`
  },
  {
    slug: "crewai-python",
    packageName: "crewai",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "CrewAI",
    vendor: "CrewAI",
    githubRepo: "crewAIInc/crewAI",
    breakingSummary: "v1.x Flows and Crew memory backends use native LiteLLM / provider clients and enforce BaseTool args_schema Pydantic v2 classes.",
    schemaDriftRisk: "high",
    affectedSymbols: ["Agent", "Task", "Crew", "Flow", "BaseTool"],
    migrationBefore: `from crewai_tools import tool\n@tool("search")\ndef search(q: str) -> str: ...`,
    migrationAfter: `from crewai.tools import tool\n@tool("search")\ndef search(q: str) -> str:\n    """Search query"""\n    return q`
  },
  {
    slug: "pydantic-ai",
    packageName: "pydantic-ai",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "PydanticAI",
    vendor: "Pydantic",
    githubRepo: "pydantic/pydantic-ai",
    breakingSummary: "v2.x replaces result_type with output_type on Agent(), and renames result.data to result.output across all run methods.",
    schemaDriftRisk: "high",
    affectedSymbols: ["Agent", "RunContext", "MCPServerStdio", "MCPServerStreamableHTTP"],
    migrationBefore: `agent = Agent("openai:gpt-4o", result_type=MyModel)\nresult = await agent.run("hello")\nprint(result.data)`,
    migrationAfter: `agent = Agent("openai:gpt-5", output_type=MyModel)\nresult = await agent.run("hello")\nprint(result.output)`
  },
  {
    slug: "litellm-python",
    packageName: "litellm",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Model Router / Gateway",
    displayName: "LiteLLM",
    vendor: "BerriAI",
    githubRepo: "BerriAI/litellm",
    breakingSummary: "High-frequency releases update model cost maps, Anthropic/Bedrock tool call argument normalization, and MCP gateway bridge routes.",
    schemaDriftRisk: "high",
    affectedSymbols: ["completion", "acompletion", "responses", "experimental_mcp_client"],
    migrationBefore: `res = litellm.completion(model="claude-3-sonnet", messages=msgs, functions=fns)`,
    migrationAfter: `res = litellm.completion(model="anthropic/claude-sonnet-4-5", messages=msgs, tools=tools)`
  },
  {
    slug: "dspy-python",
    packageName: "dspy",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "DSPy",
    vendor: "Stanford NLP",
    githubRepo: "stanfordnlp/dspy",
    breakingSummary: "DSPy v3.x unifies dspy.LM() with LiteLLM identifiers, removes legacy dspy.OpenAI classes, and updates dspy.ReAct tool wrapping.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["dspy.LM", "dspy.ReAct", "dspy.Tool", "dspy.MIPROv2"],
    migrationBefore: `lm = dspy.OpenAI(model="gpt-4o")\ndspy.settings.configure(lm=lm)`,
    migrationAfter: `lm = dspy.LM("openai/gpt-5")\ndspy.configure(lm=lm)`
  },
  {
    slug: "openai-agents-python",
    packageName: "openai-agents",
    registry: "pypi",
    kind: "sdk",
    subcategory: "Agent Framework",
    displayName: "OpenAI Agents SDK (Python)",
    vendor: "OpenAI",
    githubRepo: "openai/openai-agents-python",
    breakingSummary: "Updates MCPServerStreamableHttp params, RunConfig tracing processors, and strict JSON Schema validation for @function_tool.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["Agent", "Runner", "function_tool", "MCPServerStreamableHttp"],
    migrationBefore: `@function_tool\ndef fetch_weather(city: str, units: str = "c") -> str: ...`,
    migrationAfter: `@function_tool(strict_mode=True)\ndef fetch_weather(city: str, units: str) -> str: ...`
  },

  // === 38 Real MCP Servers & Tooling Packages ===
  {
    slug: "mcp-server-filesystem",
    packageName: "@modelcontextprotocol/server-filesystem",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Filesystem Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers",
    breakingSummary: "Major v2.0.0 release enforces roots protocol capabilities, tightens symlink path traversal validation, and updates edit_file dryRun diff schema.",
    schemaDriftRisk: "high",
    affectedSymbols: ["read_text_file", "read_multiple_files", "edit_file", "list_allowed_directories"],
    migrationBefore: `// tools/call: read_file (legacy alias)\n{ "name": "read_file", "arguments": { "path": "/workspace/app.ts" } }`,
    migrationAfter: `// tools/call: read_text_file (v2.0.0+)\n{ "name": "read_text_file", "arguments": { "path": "/workspace/app.ts", "head": 200 } }`
  },
  {
    slug: "mcp-server-memory",
    packageName: "@modelcontextprotocol/server-memory",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Knowledge Graph Memory Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers",
    breakingSummary: "Major v2.0.0 release updates MEMORY_FILE_PATH env handling and enforces strict entityType and observations array validation in create_entities.",
    schemaDriftRisk: "high",
    affectedSymbols: ["create_entities", "create_relations", "add_observations", "search_nodes"],
    migrationBefore: `{ "name": "create_entities", "arguments": { "entities": [{ "name": "User", "type": "person" }] } }`,
    migrationAfter: `{ "name": "create_entities", "arguments": { "entities": [{ "name": "User", "entityType": "person", "observations": [] }] } }`
  },
  {
    slug: "mcp-server-sequential-thinking",
    packageName: "@modelcontextprotocol/server-sequential-thinking",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Sequential Thinking Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers",
    breakingSummary: "Major v2.0.0 release adds structured outputSchema validation to sequentialthinking tool responses and requires strict boolean nextThoughtNeeded.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["sequentialthinking"],
    migrationBefore: `{ "thought": "Step 1", "thoughtNumber": 1, "totalThoughts": 3, "nextThoughtNeeded": "true" }`,
    migrationAfter: `{ "thought": "Step 1", "thoughtNumber": 1, "totalThoughts": 3, "nextThoughtNeeded": true }`
  },
  {
    slug: "mcp-server-everything",
    packageName: "@modelcontextprotocol/server-everything",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Everything Conformance Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers",
    breakingSummary: "Major v2.0.0 release aligns test tools, prompts, and resources with MCP 2025-11-25 / 2026 spec features including elicitation and audio blocks.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["echo", "annotatedMessage", "getResourceReference", "startElicitation"],
    migrationBefore: `npx -y @modelcontextprotocol/server-everything sse`,
    migrationAfter: `npx -y @modelcontextprotocol/server-everything streamableHttp`
  },
  {
    slug: "mcp-server-github",
    packageName: "@modelcontextprotocol/server-github",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP GitHub Server (Legacy NPM)",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "Archived on npm at v2025.4.8 in favor of GitHub's official remote/Docker ghcr.io/github/github-mcp-server; tool names and pagination parameters differ.",
    schemaDriftRisk: "high",
    affectedSymbols: ["create_or_update_file", "search_repositories", "create_pull_request"],
    migrationBefore: `"github": {\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-github"]\n}`,
    migrationAfter: `"github": {\n  "url": "https://api.githubcopilot.com/mcp/",\n  "headers": { "Authorization": "Bearer \${GITHUB_PERSONAL_ACCESS_TOKEN}" }\n}`
  },
  {
    slug: "mcp-server-postgres",
    packageName: "@modelcontextprotocol/server-postgres",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP PostgreSQL Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "Frozen at v0.6.2 in archived reference servers; lacks MCP 2025+ Streamable HTTP and parameterized query tools.",
    schemaDriftRisk: "high",
    affectedSymbols: ["query"],
    migrationBefore: `npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb`,
    migrationAfter: `npx -y @zeddotdev/postgres-context-server postgresql://localhost/mydb`
  },
  {
    slug: "mcp-server-slack",
    packageName: "@modelcontextprotocol/server-slack",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Slack Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "v2025.4.25 requires SLACK_TEAM_ID and SLACK_BOT_TOKEN env vars; legacy workspace token auth fails.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["slack_list_channels", "slack_post_message", "slack_get_channel_history"],
    migrationBefore: `"env": { "SLACK_TOKEN": "xoxb-..." }`,
    migrationAfter: `"env": { "SLACK_BOT_TOKEN": "xoxb-...", "SLACK_TEAM_ID": "T01234567" }`
  },
  {
    slug: "mcp-server-brave-search",
    packageName: "@modelcontextprotocol/server-brave-search",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Brave Search Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "v0.6.2 reference server superseded by Brave's official @brave/brave-search-mcp-server with news/video/image tools.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["brave_web_search", "brave_local_search"],
    migrationBefore: `npx -y @modelcontextprotocol/server-brave-search`,
    migrationAfter: `npx -y @brave/brave-search-mcp-server`
  },
  {
    slug: "mcp-server-puppeteer",
    packageName: "@modelcontextprotocol/server-puppeteer",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Puppeteer Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "Archived at v2025.5.12; teams migrating to @playwright/mcp or chrome-devtools-mcp for accessibility snapshots.",
    schemaDriftRisk: "high",
    affectedSymbols: ["puppeteer_navigate", "puppeteer_screenshot", "puppeteer_evaluate"],
    migrationBefore: `"puppeteer": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-puppeteer"] }`,
    migrationAfter: `"playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }`
  },
  {
    slug: "mcp-server-gdrive",
    packageName: "@modelcontextprotocol/server-gdrive",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Google Drive Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "v2025.1.14 requires local OAuth credentials file path via GDRIVE_CREDENTIALS_PATH.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["search", "gdrive_read_file"],
    migrationBefore: `npx -y @modelcontextprotocol/server-gdrive`,
    migrationAfter: `GDRIVE_CREDENTIALS_PATH=/path/creds.json npx -y @modelcontextprotocol/server-gdrive`
  },
  {
    slug: "mcp-server-google-maps",
    packageName: "@modelcontextprotocol/server-google-maps",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Google Maps Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "v0.6.2 requires GOOGLE_MAPS_API_KEY with Places API (New) and Directions API enabled.",
    schemaDriftRisk: "low",
    affectedSymbols: ["maps_geocode", "maps_search_places", "maps_directions"],
    migrationBefore: `{ "name": "maps_search_places", "arguments": { "query": "coffee", "location": "40.7,-74.0" } }`,
    migrationAfter: `{ "name": "maps_search_places", "arguments": { "query": "coffee", "location": { "latitude": 40.7, "longitude": -74.0 } } }`
  },
  {
    slug: "mcp-server-redis",
    packageName: "@modelcontextprotocol/server-redis",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Redis Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "v2025.4.25 transitions to official @redis/mcp-server for Redis Streams, hashes, and vector index tools.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["set", "get", "delete", "list"],
    migrationBefore: `npx -y @modelcontextprotocol/server-redis redis://localhost:6379`,
    migrationAfter: `npx -y @upstash/mcp-server run`
  },
  {
    slug: "mcp-server-aws-kb",
    packageName: "@modelcontextprotocol/server-aws-kb-retrieval",
    registry: "npm",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP AWS KB Retrieval Server",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "Superseded by awslabs.bedrock-kb-retrieval-mcp-server with reranking and metadata filters.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["retrieve_from_aws_kb"],
    migrationBefore: `npx -y @modelcontextprotocol/server-aws-kb-retrieval`,
    migrationAfter: `uvx awslabs.bedrock-kb-retrieval-mcp-server@latest`
  },
  {
    slug: "mcp-inspector",
    packageName: "@modelcontextprotocol/inspector",
    registry: "npm",
    kind: "mcp",
    subcategory: "MCP DevTool / Inspector",
    displayName: "MCP Inspector",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/inspector",
    breakingSummary: "v2.x requires session token authentication by default on proxy server port 6277 to prevent DNS rebinding / local RCE.",
    schemaDriftRisk: "high",
    affectedSymbols: ["mcp-inspector", "MCP_PROXY_AUTH_TOKEN"],
    migrationBefore: `npx @modelcontextprotocol/inspector node build/index.js`,
    migrationAfter: `DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector node build/index.js\n# Or use the printed MCP_PROXY_AUTH_TOKEN URL`
  },
  {
    slug: "stripe-mcp",
    packageName: "@stripe/mcp",
    registry: "npm",
    kind: "mcp",
    subcategory: "Payments & FinTech MCP",
    displayName: "Stripe Official MCP Server",
    vendor: "Stripe",
    githubRepo: "stripe/agent-toolkit",
    breakingSummary: "v0.3.x scopes tools by resource permission flags (--tools=all or granular resource.action) and recommends remote https://mcp.stripe.com.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["create_customer", "create_payment_link", "list_invoices", "search_documentation"],
    migrationBefore: `npx -y @stripe/mcp --api-key=$STRIPE_SECRET_KEY`,
    migrationAfter: `npx -y @stripe/mcp --tools=all --api-key=$STRIPE_SECRET_KEY`
  },
  {
    slug: "playwright-mcp",
    packageName: "@playwright/mcp",
    registry: "npm",
    kind: "mcp",
    subcategory: "Browser Automation MCP",
    displayName: "Playwright Official MCP Server",
    vendor: "Microsoft",
    githubRepo: "microsoft/playwright-mcp",
    breakingSummary: "Rapid 0.0.x releases rename vision mode flags (--caps=vision,pdf) and update browser_snapshot element ref identifiers.",
    schemaDriftRisk: "high",
    affectedSymbols: ["browser_navigate", "browser_click", "browser_snapshot", "browser_type"],
    migrationBefore: `npx @playwright/mcp@latest --vision`,
    migrationAfter: `npx @playwright/mcp@latest --caps=vision,pdf`
  },
  {
    slug: "supabase-mcp",
    packageName: "@supabase/mcp-server-supabase",
    registry: "npm",
    kind: "mcp",
    subcategory: "Database & Backend MCP",
    displayName: "Supabase Official MCP Server",
    vendor: "Supabase",
    githubRepo: "supabase-community/supabase-mcp",
    breakingSummary: "v0.14.x supports --read-only and --project-ref scoping; execute_sql and apply_migration split DDL vs DML operations.",
    schemaDriftRisk: "high",
    affectedSymbols: ["execute_sql", "apply_migration", "list_tables", "get_advisors"],
    migrationBefore: `npx -y @supabase/mcp-server-supabase --access-token=$SUPABASE_PAT`,
    migrationAfter: `npx -y @supabase/mcp-server-supabase@latest --access-token=$SUPABASE_PAT --project-ref=$PROJECT_REF --read-only`
  },
  {
    slug: "cloudflare-mcp",
    packageName: "@cloudflare/mcp-server-cloudflare",
    registry: "npm",
    kind: "mcp",
    subcategory: "Cloud & Infra MCP",
    displayName: "Cloudflare Official MCP Server",
    vendor: "Cloudflare",
    githubRepo: "cloudflare/mcp-server-cloudflare",
    breakingSummary: "Local CLI server supplemented by dedicated remote OAuth MCP servers (workers-bindings, observability, radar).",
    schemaDriftRisk: "medium",
    affectedSymbols: ["kv_list", "r2_list_buckets", "d1_query", "worker_put"],
    migrationBefore: `npx @cloudflare/mcp-server-cloudflare run`,
    migrationAfter: `npx mcp-remote https://bindings.mcp.cloudflare.com/sse`
  },
  {
    slug: "notion-mcp",
    packageName: "@notionhq/notion-mcp-server",
    registry: "npm",
    kind: "mcp",
    subcategory: "Productivity & Docs MCP",
    displayName: "Notion Official MCP Server",
    vendor: "Notion",
    githubRepo: "makenotion/notion-mcp-server",
    breakingSummary: "v2.x replaces raw Notion-Version header config with simplified markdown block append payloads and OPENAPI_MCP_HEADERS env format.",
    schemaDriftRisk: "high",
    affectedSymbols: ["API-post-search", "API-patch-block-children", "API-retrieve-a-page"],
    migrationBefore: `"env": { "NOTION_API_TOKEN": "ntn_..." }`,
    migrationAfter: `"env": { "NOTION_TOKEN": "ntn_..." }`
  },
  {
    slug: "sentry-mcp",
    packageName: "@sentry/mcp-server",
    registry: "npm",
    kind: "mcp",
    subcategory: "Observability MCP",
    displayName: "Sentry Official MCP Server",
    vendor: "Sentry",
    githubRepo: "getsentry/sentry-mcp",
    breakingSummary: "v0.42.x consolidates search_issues and get_issue_details parameters, requiring organizationSlug on all multi-org tokens.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["find_issues", "get_issue_details", "analyze_issue_with_seer"],
    migrationBefore: `{ "name": "get_issue", "arguments": { "issue_id": "PROJ-123" } }`,
    migrationAfter: `{ "name": "get_issue_details", "arguments": { "organizationSlug": "my-org", "issueId": "PROJ-123" } }`
  },
  {
    slug: "apify-mcp",
    packageName: "@apify/actors-mcp-server",
    registry: "npm",
    kind: "mcp",
    subcategory: "Web Scraping & Data MCP",
    displayName: "Apify Actors MCP Server",
    vendor: "Apify",
    githubRepo: "apify/actors-mcp-server",
    breakingSummary: "v0.19.x adds dynamic actor discovery tools (search-actors, add-actor) instead of preloading all actor schemas at startup.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["search-actors", "call-actor", "get-actor-details"],
    migrationBefore: `npx -y @apify/actors-mcp-server --actors "apify/web-scraper"`,
    migrationAfter: `npx -y @apify/actors-mcp-server --tools actors,docs,apify/rag-web-browser`
  },
  {
    slug: "firecrawl-mcp",
    packageName: "firecrawl-mcp",
    registry: "npm",
    kind: "mcp",
    subcategory: "Web Scraping & Data MCP",
    displayName: "Firecrawl MCP Server",
    vendor: "Firecrawl",
    githubRepo: "mendableai/firecrawl-mcp-server",
    breakingSummary: "v3.x upgrades to Firecrawl v2 API: firecrawl_extract requires schema or prompt, and firecrawl_scrape removes deprecated pageOptions.",
    schemaDriftRisk: "high",
    affectedSymbols: ["firecrawl_scrape", "firecrawl_crawl", "firecrawl_search", "firecrawl_extract"],
    migrationBefore: `{ "name": "firecrawl_scrape", "arguments": { "url": "https://example.com", "pageOptions": { "onlyMainContent": true } } }`,
    migrationAfter: `{ "name": "firecrawl_scrape", "arguments": { "url": "https://example.com", "formats": ["markdown"], "onlyMainContent": true } }`
  },
  {
    slug: "exa-mcp",
    packageName: "exa-mcp-server",
    registry: "npm",
    kind: "mcp",
    subcategory: "Search & Research MCP",
    displayName: "Exa Search MCP Server",
    vendor: "Exa",
    githubRepo: "exa-labs/exa-mcp-server",
    breakingSummary: "v3.x enables remote hosted MCP by default and renames tool identifiers to web_search_exa and deep_researcher_start.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["web_search_exa", "company_research_exa", "crawling_exa"],
    migrationBefore: `{ "name": "search", "arguments": { "query": "AI agents" } }`,
    migrationAfter: `{ "name": "web_search_exa", "arguments": { "query": "AI agents", "numResults": 5 } }`
  },
  {
    slug: "tavily-mcp",
    packageName: "tavily-mcp",
    registry: "npm",
    kind: "mcp",
    subcategory: "Search & Research MCP",
    displayName: "Tavily Search MCP Server",
    vendor: "Tavily",
    githubRepo: "tavily-ai/tavily-mcp",
    breakingSummary: "v0.2.x adds tavily-crawl and tavily-map tools and enforces enum validation on search_depth and topic parameters.",
    schemaDriftRisk: "low",
    affectedSymbols: ["tavily-search", "tavily-extract", "tavily-crawl", "tavily-map"],
    migrationBefore: `{ "name": "tavily-search", "arguments": { "query": "news", "days": "3" } }`,
    migrationAfter: `{ "name": "tavily-search", "arguments": { "query": "news", "topic": "news", "days": 3 } }`
  },
  {
    slug: "browserbase-mcp",
    packageName: "@browserbasehq/mcp-server-browserbase",
    registry: "npm",
    kind: "mcp",
    subcategory: "Browser Automation MCP",
    displayName: "Browserbase Stagehand MCP Server",
    vendor: "Browserbase",
    githubRepo: "browserbase/mcp-server-browserbase",
    breakingSummary: "v2.x consolidates raw Puppeteer tools into Stagehand-powered browserbase_stagehand_act, observe, and extract tools.",
    schemaDriftRisk: "high",
    affectedSymbols: ["browserbase_session_create", "browserbase_stagehand_navigate", "browserbase_stagehand_act", "browserbase_stagehand_extract"],
    migrationBefore: `{ "name": "browserbase_click", "arguments": { "selector": "#login" } }`,
    migrationAfter: `{ "name": "browserbase_stagehand_act", "arguments": { "action": "Click the login button" } }`
  },
  {
    slug: "neon-mcp",
    packageName: "@neondatabase/mcp-server-neon",
    registry: "npm",
    kind: "mcp",
    subcategory: "Database & Backend MCP",
    displayName: "Neon Serverless Postgres MCP Server",
    vendor: "Neon",
    githubRepo: "neondatabase/mcp-server-neon",
    breakingSummary: "v0.6.x introduces safe database branch migration workflow (prepare_database_migration + complete_database_migration).",
    schemaDriftRisk: "medium",
    affectedSymbols: ["run_sql", "run_sql_transaction", "prepare_database_migration", "complete_database_migration"],
    migrationBefore: `npx -y @neondatabase/mcp-server-neon $NEON_API_KEY`,
    migrationAfter: `npx -y @neondatabase/mcp-server-neon start $NEON_API_KEY`
  },
  {
    slug: "upstash-mcp",
    packageName: "@upstash/mcp-server",
    registry: "npm",
    kind: "mcp",
    subcategory: "Database & Backend MCP",
    displayName: "Upstash Redis & QStash MCP Server",
    vendor: "Upstash",
    githubRepo: "upstash/mcp-server",
    breakingSummary: "v0.4.0 updates Redis command execution tool schemas and adds QStash schedule management endpoints.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["redis_database_run_single_redis_command", "redis_database_list_databases"],
    migrationBefore: `npx @upstash/mcp-server init $EMAIL $KEY`,
    migrationAfter: `npx -y @upstash/mcp-server run $EMAIL $KEY`
  },
  {
    slug: "context7-mcp",
    packageName: "@upstash/context7-mcp",
    registry: "npm",
    kind: "mcp",
    subcategory: "Developer Docs MCP",
    displayName: "Context7 Live Docs MCP Server",
    vendor: "Upstash",
    githubRepo: "upstash/context7",
    breakingSummary: "v4.x requires calling resolve-library-id before get-library-docs (or query-docs) and addsCONTEXT7_API_KEY rate-limit headers.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["resolve-library-id", "get-library-docs"],
    migrationBefore: `{ "name": "get-library-docs", "arguments": { "library": "next.js" } }`,
    migrationAfter: `{ "name": "get-library-docs", "arguments": { "context7CompatibleLibraryID": "/vercel/next.js", "topic": "routing" } }`
  },
  {
    slug: "raygun-mcp",
    packageName: "@raygun.io/mcp-server-raygun",
    registry: "npm",
    kind: "mcp",
    subcategory: "Observability MCP",
    displayName: "Raygun Crash Reporting MCP Server",
    vendor: "Raygun",
    githubRepo: "MindscapeHQ/mcp-server-raygun",
    breakingSummary: "Requires RAYGUN_PAT_TOKEN with V3 API read scopes for error group and deployment inspection.",
    schemaDriftRisk: "low",
    affectedSymbols: ["list_applications", "list_error_groups", "get_error_group"],
    migrationBefore: `"env": { "RAYGUN_API_KEY": "..." }`,
    migrationAfter: `"env": { "RAYGUN_PAT_TOKEN": "..." }`
  },
  {
    slug: "kubernetes-mcp",
    packageName: "mcp-server-kubernetes",
    registry: "npm",
    kind: "mcp",
    subcategory: "Cloud & Infra MCP",
    displayName: "Kubernetes MCP Server",
    vendor: "Flux159",
    githubRepo: "Flux159/mcp-server-kubernetes",
    breakingSummary: "v4.x consolidates kubectl_* tools into unified kubectl_get, kubectl_apply, kubectl_describe with non-destructive mode flags.",
    schemaDriftRisk: "high",
    affectedSymbols: ["kubectl_get", "kubectl_describe", "kubectl_apply", "helm_install"],
    migrationBefore: `{ "name": "get_pods", "arguments": { "namespace": "default" } }`,
    migrationAfter: `{ "name": "kubectl_get", "arguments": { "resourceType": "pods", "namespace": "default" } }`
  },
  {
    slug: "figma-developer-mcp",
    packageName: "figma-developer-mcp",
    registry: "npm",
    kind: "mcp",
    subcategory: "Design & UI MCP",
    displayName: "Framelink Figma MCP Server",
    vendor: "Framelink",
    githubRepo: "GLips/Figma-Context-MCP",
    breakingSummary: "v0.13.x renames --figma-api-key CLI flag and simplifies get_figma_data nodeId format (123:456 or 123-456).",
    schemaDriftRisk: "medium",
    affectedSymbols: ["get_figma_data", "download_figma_images"],
    migrationBefore: `{ "name": "get_file", "arguments": { "file_key": "abc" } }`,
    migrationAfter: `{ "name": "get_figma_data", "arguments": { "fileKey": "abc", "nodeId": "1:2" } }`
  },
  {
    slug: "e2b-mcp",
    packageName: "@e2b/mcp-server",
    registry: "npm",
    kind: "mcp",
    subcategory: "Code Sandbox MCP",
    displayName: "E2B Code Interpreter MCP Server",
    vendor: "E2B",
    githubRepo: "e2b-dev/mcp-server",
    breakingSummary: "v0.2.x updates sandbox timeout lifecycle and run_code stdout/stderr structured return format.",
    schemaDriftRisk: "low",
    affectedSymbols: ["run_code"],
    migrationBefore: `{ "name": "execute_python", "arguments": { "code": "print(1)" } }`,
    migrationAfter: `{ "name": "run_code", "arguments": { "code": "print(1)" } }`
  },
  {
    slug: "perplexity-mcp",
    packageName: "@perplexity-ai/mcp-server",
    registry: "npm",
    kind: "mcp",
    subcategory: "Search & Research MCP",
    displayName: "Perplexity Official MCP Server",
    vendor: "Perplexity",
    githubRepo: "ppl-ai/modelcontextprotocol",
    breakingSummary: "v1.3.x splits sonar-pro and sonar-deep-research into perplexity_ask, perplexity_research, and perplexity_reason tools.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["perplexity_ask", "perplexity_research", "perplexity_reason"],
    migrationBefore: `npx -y server-perplexity-ask`,
    migrationAfter: `npx -y @perplexity-ai/mcp-server`
  },
  {
    slug: "chrome-devtools-mcp",
    packageName: "chrome-devtools-mcp",
    registry: "npm",
    kind: "mcp",
    subcategory: "Browser Automation MCP",
    displayName: "Chrome DevTools Official MCP Server",
    vendor: "Chrome DevTools",
    githubRepo: "ChromeDevTools/chrome-devtools-mcp",
    breakingSummary: "v1.12.x updates performance trace recording tools and network request inspection UID parameters.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["navigate_page", "take_snapshot", "list_network_requests", "performance_start_trace"],
    migrationBefore: `{ "name": "get_network_request", "arguments": { "url": "https://api.example.com" } }`,
    migrationAfter: `{ "name": "get_network_request", "arguments": { "reqid": 42 } }`
  },
  {
    slug: "mcp-remote",
    packageName: "mcp-remote",
    registry: "npm",
    kind: "mcp",
    subcategory: "MCP Bridge & Transport",
    displayName: "mcp-remote (Stdio-to-Remote OAuth Bridge)",
    vendor: "Cloudflare / Geelen",
    githubRepo: "geelen/mcp-remote",
    breakingSummary: "v0.15.x defaults to http-first (Streamable HTTP with SSE fallback) and updates OAuth callback port selection.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["mcp-remote"],
    migrationBefore: `npx mcp-remote https://example.com/sse`,
    migrationAfter: `npx -y mcp-remote https://example.com/mcp --transport http-first`
  },
  {
    slug: "supergateway",
    packageName: "supergateway",
    registry: "npm",
    kind: "mcp",
    subcategory: "MCP Bridge & Transport",
    displayName: "Supergateway MCP Transport Proxy",
    vendor: "Supercorp",
    githubRepo: "supercorp-ai/supergateway",
    breakingSummary: "v4.x adds stateful/stateless Streamable HTTP output flags (--outputTransport streamableHttp) alongside SSE and WS.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["supergateway"],
    migrationBefore: `npx -y supergateway --stdio "npx -y @modelcontextprotocol/server-filesystem ." --port 8000`,
    migrationAfter: `npx -y supergateway --stdio "npx -y @modelcontextprotocol/server-filesystem ." --outputTransport streamableHttp --port 8000`
  },
  {
    slug: "mcp-server-git",
    packageName: "mcp-server-git",
    registry: "pypi",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Git Server (Python)",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers",
    breakingSummary: "CalVer 2026.10.19 release hardens git_diff and git_checkout argument validation against flag injection (CVE-2025/2026).",
    schemaDriftRisk: "high",
    affectedSymbols: ["git_status", "git_diff_unstaged", "git_commit", "git_log"],
    migrationBefore: `{ "name": "git_diff", "arguments": { "repo_path": ".", "target": "--output=/tmp/pwn" } }`,
    migrationAfter: `{ "name": "git_diff", "arguments": { "repo_path": "/abs/path/to/repo", "target": "main" } }`
  },
  {
    slug: "mcp-server-fetch",
    packageName: "mcp-server-fetch",
    registry: "pypi",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Fetch Server (Python)",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers",
    breakingSummary: "CalVer 2026.10.19 release enforces robots.txt checking by default unless --ignore-robots-txt is passed and caps max_length.",
    schemaDriftRisk: "low",
    affectedSymbols: ["fetch"],
    migrationBefore: `uvx mcp-server-fetch`,
    migrationAfter: `uvx mcp-server-fetch --user-agent="MyAgent/1.0"`
  },
  {
    slug: "mcp-server-time",
    packageName: "mcp-server-time",
    registry: "pypi",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP Time & Timezone Server (Python)",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers",
    breakingSummary: "CalVer 2026.10.19 requires valid IANA timezone strings in get_current_time and convert_time.",
    schemaDriftRisk: "low",
    affectedSymbols: ["get_current_time", "convert_time"],
    migrationBefore: `{ "name": "get_current_time", "arguments": { "timezone": "EST" } }`,
    migrationAfter: `{ "name": "get_current_time", "arguments": { "timezone": "America/New_York" } }`
  },
  {
    slug: "mcp-server-sqlite",
    packageName: "mcp-server-sqlite",
    registry: "pypi",
    kind: "mcp",
    subcategory: "Official Reference MCP",
    displayName: "MCP SQLite Server (Python)",
    vendor: "Model Context Protocol",
    githubRepo: "modelcontextprotocol/servers-archived",
    breakingSummary: "v2025.4.25 separates read_query (SELECT only) from write_query and create_table.",
    schemaDriftRisk: "low",
    affectedSymbols: ["read_query", "write_query", "create_table", "list_tables"],
    migrationBefore: `{ "name": "query", "arguments": { "sql": "SELECT * FROM users" } }`,
    migrationAfter: `{ "name": "read_query", "arguments": { "query": "SELECT * FROM users" } }`
  },
  {
    slug: "mcp-server-qdrant",
    packageName: "mcp-server-qdrant",
    registry: "pypi",
    kind: "mcp",
    subcategory: "Vector DB MCP",
    displayName: "Qdrant Official MCP Server",
    vendor: "Qdrant",
    githubRepo: "qdrant/mcp-server-qdrant",
    breakingSummary: "v0.8.x requires explicit QDRANT_COLLECTION_NAME or per-call collection_name parameter in qdrant-find and qdrant-store.",
    schemaDriftRisk: "medium",
    affectedSymbols: ["qdrant-store", "qdrant-find"],
    migrationBefore: `{ "name": "qdrant-find", "arguments": { "query": "auth logic" } }`,
    migrationAfter: `{ "name": "qdrant-find", "arguments": { "query": "auth logic", "collection_name": "codebase" } }`
  },
  {
    slug: "awslabs-core-mcp",
    packageName: "awslabs.core-mcp-server",
    registry: "pypi",
    kind: "mcp",
    subcategory: "Cloud & Infra MCP",
    displayName: "AWS Labs Core MCP Server",
    vendor: "AWS Labs",
    githubRepo: "awslabs/mcp",
    breakingSummary: "v1.0.x modularizes AWS MCP role profiles (AWS_API_MCP_PROFILE_NAME) and prompt_understanding routing.",
    schemaDriftRisk: "low",
    affectedSymbols: ["prompt_understanding"],
    migrationBefore: `uvx awslabs.core-mcp-server`,
    migrationAfter: `FASTMCP_LOG_LEVEL=ERROR uvx awslabs.core-mcp-server@latest`
  },
  {
    slug: "claude-code-cli",
    packageName: "@anthropic-ai/claude-code",
    registry: "npm",
    kind: "mcp",
    subcategory: "Agent CLI & MCP Host",
    displayName: "Claude Code CLI & MCP Server",
    vendor: "Anthropic",
    githubRepo: "anthropics/claude-code",
    breakingSummary: "v2.1.x updates `claude mcp serve` tool schemas and `.mcp.json` project-scoped server approval rules.",
    schemaDriftRisk: "high",
    affectedSymbols: ["claude mcp add", "claude mcp serve", "Bash", "Edit"],
    migrationBefore: `claude mcp add my-server -e KEY=val -- npx server`,
    migrationAfter: `claude mcp add --transport stdio my-server -e KEY=val -- npx server`
  },
  {
    slug: "openai-codex-cli",
    packageName: "@openai/codex",
    registry: "npm",
    kind: "mcp",
    subcategory: "Agent CLI & MCP Host",
    displayName: "OpenAI Codex CLI & MCP Host",
    vendor: "OpenAI",
    githubRepo: "openai/codex",
    breakingSummary: "v0.164.x configures MCP servers in ~/.codex/config.toml under [mcp_servers.<name>] and supports running Codex itself as an MCP server.",
    schemaDriftRisk: "high",
    affectedSymbols: ["codex mcp", "mcp_servers"],
    migrationBefore: `codex --ApprovalMode full-auto "fix tests"`,
    migrationAfter: `codex --full-auto "fix tests"`
  }
];

function sanitizeText(str) {
  if (!str) return "";
  // Strictly replace any em-dash or en-dash with standard hyphen/comma per rule
  return String(str).replace(/[\u2014\u2013]/g, "-").trim();
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
  if (latestVersion.startsWith("0.")) score -= 5;
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

  const latest = data["dist-tags"]?.latest;
  const times = data.time || {};
  const latestPublishedAt = times[latest] || new Date().toISOString();

  // Gather all stable versions with timestamps
  const versionEntries = Object.entries(times)
    .filter(([k, v]) => k !== "created" && k !== "modified" && data.versions?.[k] && isStableVersion(k))
    .map(([version, publishedAt]) => ({ version, publishedAt }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const recentVersions = versionEntries.slice(0, 6);
  const cutoff90d = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const releasesLast90d = versionEntries.filter((v) => new Date(v.publishedAt).getTime() >= cutoff90d).length;

  const latestManifest = data.versions?.[latest] || {};
  const depsCount = Object.keys(latestManifest.dependencies || {}).length;
  const license = typeof latestManifest.license === "string" ? latestManifest.license : (data.license || "MIT");
  const description = sanitizeText(latestManifest.description || data.description || `${target.displayName} package.`);

  const score = computeStabilityScore(releasesLast90d, target.schemaDriftRisk, latest);

  return {
    ...target,
    description,
    breakingSummary: sanitizeText(target.breakingSummary),
    latestVersion: latest,
    latestPublishedAt,
    recentVersions,
    releasesLast90d,
    dependenciesCount: depsCount,
    license: sanitizeText(license),
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

  const versionEntries = [];
  for (const [ver, files] of Object.entries(releasesObj)) {
    if (!Array.isArray(files) || files.length === 0) continue;
    if (!isStableVersion(ver)) continue;
    const uploadTime = files[0]?.upload_time_iso_8601;
    if (uploadTime) {
      versionEntries.push({ version: ver, publishedAt: uploadTime });
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

  const score = computeStabilityScore(releasesLast90d, target.schemaDriftRisk, latest);

  return {
    ...target,
    description,
    breakingSummary: sanitizeText(target.breakingSummary),
    latestVersion: latest,
    latestPublishedAt,
    recentVersions,
    releasesLast90d,
    dependenciesCount: requiresDist,
    license,
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
  const results = [];
  for (const target of TARGETS) {
    try {
      const item = target.registry === "npm"
        ? await fetchNpmMetadata(target)
        : await fetchPypiMetadata(target);
      results.push(item);
      console.log(`[OK] ${item.packageName} (${item.registry}) -> v${item.latestVersion} (${item.latestPublishedAt.slice(0, 10)})`);
    } catch (err) {
      console.error(`[ERR] ${target.packageName}:`, err.message);
    }
  }

  const sdks = results.filter((r) => r.kind === "sdk");
  const mcps = results.filter((r) => r.kind === "mcp");

  const payload = {
    generatedAt: new Date().toISOString(),
    totalTracked: results.length,
    sdkCount: sdks.length,
    mcpCount: mcps.length,
    items: results
  };

  const outPath = path.resolve("/workspace/agentbreakwatch/data/catalog.json");
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`\nSaved ${results.length} live items (${sdks.length} SDKs, ${mcps.length} MCP servers) to ${outPath}`);
}

main();
