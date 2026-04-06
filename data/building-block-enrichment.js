const CATEGORY_LENS = {
  Agent: {
    positioning:
      "这类积木更像任务执行层或协作层。重点不在单次回答有多聪明，而在它怎么规划、怎么调工具、怎么把长任务推进下去。",
    entryPath:
      "先看 agent 抽象、工具接入、状态管理和任务推进方式，再看它是否真的能稳定闭环，而不是只会演示。",
    evaluationFocus:
      "重点看任务拆解是否清晰、工具调用是否可控、失败后能否恢复，以及多步任务里有没有清楚的状态边界。",
    watchouts:
      "不要只被 demo 吸引。Agent 项目最容易高估的地方，是把模型能力误当成系统能力；真正效果往往取决于工具层、记忆层和防护栏。",
  },
  "Browser Automation": {
    positioning:
      "这类积木处在网页执行层，价值在于把浏览器动作、页面理解和任务流程编排成可复用的自动化能力。",
    entryPath:
      "先用真实网页任务去看：能不能定位元素、跨页面推进、失败后重试、回到上一步，以及如何处理网站变化。",
    evaluationFocus:
      "重点看元素定位稳定性、动作抽象层、错误恢复、跨页面记忆和工程化程度，而不是只看能不能点几下按钮。",
    watchouts:
      "网页自动化最容易被误判成“已经可替代人工”。实际上一旦页面改版、权限变复杂或链路变长，可靠性就会迅速下滑。",
  },
  "GUI Agent": {
    positioning:
      "这类积木更靠近屏幕级执行层，核心不是聊天，而是让模型理解界面、识别控件并在真实环境里完成操作。",
    entryPath:
      "先看它依赖视觉模型还是系统 API，再看操作粒度、延迟、对环境变化的适应性，以及是否具备产品化所需的稳定性。",
    evaluationFocus:
      "重点看视觉理解准确度、动作执行成功率、延迟、可恢复性和安全边界，尤其要看真实桌面而不是录屏 demo。",
    watchouts:
      "GUI Agent 特别容易出现“演示很惊艳、日常很脆弱”的情况。屏幕变化、权限弹窗和时序波动都会迅速放大问题。",
  },
  Workflow: {
    positioning:
      "这类积木处在流程编排层，适合把模型、外部系统和业务动作接成稳定链路，是从“会用模型”走向“能跑业务”的关键层。",
    entryPath:
      "研究时先不要只看节点数量，要看流程表达力、状态持久化、重试、调试体验和与外部系统的集成深度。",
    evaluationFocus:
      "重点看是否支持长任务、失败恢复、排队调度、可观测性，以及 AI 能力是插件式点缀，还是已经真正进入主流程。",
    watchouts:
      "工作流平台最容易出现“搭得出来但养不起”。流程一多，维护成本、版本管理和调试复杂度会迅速上升。",
  },
  Knowledge: {
    positioning:
      "这类积木位于知识接入与检索层，决定你给模型的上下文质量，往往直接影响回答的可靠度和可引用性。",
    entryPath:
      "先顺着“接入什么数据、如何解析、怎么切片、怎样检索、如何引用”这条链路去看，不要只看问答效果截图。",
    evaluationFocus:
      "重点看解析质量、召回质量、引用链条、索引策略和复杂文档处理能力，因为这些才是知识系统是否能长期使用的核心。",
    watchouts:
      "RAG 和知识库项目最容易被误判成“接上模型就行”。实际上大部分问题都发生在前处理、索引设计和召回质量上。",
  },
  Coding: {
    positioning:
      "这类积木位于开发增强层，核心价值是缩短从需求到代码变更的链路，并尽量把模型带进真实工程环境。",
    entryPath:
      "先用真实仓库试它：能否读上下文、改多文件、运行命令、修错误，以及如何与开发者工作流协同。",
    evaluationFocus:
      "重点看仓库理解、跨文件修改、执行反馈闭环、与 IDE 或 CLI 的融合，以及对现有团队习惯的侵入程度。",
    watchouts:
      "编码类积木最容易出现“看起来会写，实际上不敢落库”。真正差异往往不在补全，而在能否稳定进入工程闭环。",
  },
  Multimodal: {
    positioning:
      "这类积木位于视觉、语音、图像或视频的理解与生成层，是把模型能力从文本扩展到真实感知世界的关键入口。",
    entryPath:
      "先看输入输出链条是否完整，再看实时性、成本、工程化接口以及它和其他系统结合时是否容易落地。",
    evaluationFocus:
      "重点看模型能力边界、延迟、输入质量依赖、生成或识别效果稳定性，以及能不能进入真实产品链路。",
    watchouts:
      "多模态项目最容易被炫技 demo 带偏。实际落地时，数据质量、延迟、设备要求和调用成本比单次效果更重要。",
  },
  Infra: {
    positioning:
      "这类积木处在模型服务、网关、协议或底座层，平时不一定最显眼，但往往决定整个系统的稳定性、成本和扩展空间。",
    entryPath:
      "先把它放回架构里看：它解决的是部署、路由、接口、协议还是运维问题，再判断是不是你当前最缺的那一层。",
    evaluationFocus:
      "重点看兼容性、吞吐、部署复杂度、可观测性、协议适配能力和后续维护成本，而不只是功能列表。",
    watchouts:
      "基础设施最容易掉进“全都想要”的陷阱。它的价值常常不是功能最多，而是最适合当前系统边界和团队能力。",
  },
  Robotics: {
    positioning:
      "这类积木处在具身智能和动作执行层，关注的是模型如何把感知、决策和动作真正串起来，而不只是停留在屏幕内。",
    entryPath:
      "先看数据、策略、执行闭环和硬件依赖，再看它是研究验证平台、模型方向，还是偏工程化的机器人底座。",
    evaluationFocus:
      "重点看感知到动作的链路是否清晰、数据和评测是否扎实、现实世界约束是否被认真处理。",
    watchouts:
      "机器人类项目最容易被概念放大。很多看起来相似的仓库，真实差别可能在数据质量、评测方式和硬件耦合度。",
  },
};

const BLOCK_OVERRIDES = {
  openhands: {
    positioning:
      "OpenHands 更像“面向真实代码仓库的执行型工程代理”，不是单纯聊天式代码助手。它的价值在于把读仓库、改文件、跑命令和迭代修复串成了一个统一执行面。",
    entryPath:
      "最适合用一个真实但边界清楚的小仓库验证：看它如何读上下文、提出计划、修改多文件、运行命令并根据报错继续推进。",
    evaluationFocus:
      "重点看它在真实仓库里的稳定性，而不是 benchmark。尤其要看命令执行、文件修改范围控制、失败恢复和上下文管理。",
  },
  autogen: {
    positioning:
      "AutoGen 更适合作为多智能体协作框架去理解，而不是拿来当现成产品。它的重要性在于把 agent 之间的消息、角色和协作模式抽象出来了。",
  },
  "semantic-kernel": {
    positioning:
      "Semantic Kernel 更像企业应用接入层，适合把模型能力嵌进既有业务系统，而不是从零做一个纯研究型 agent。",
  },
  "qwen-agent": {
    positioning:
      "Qwen-Agent 更像偏中文生态和任务型代理的实用框架，重点不是炫技，而是把工具调用、规划和代理式执行做成可接业务的结构。",
  },
  crewai: {
    positioning:
      "crewAI 更适合当“角色分工型多代理框架”来理解。它的核心亮点不是工具层，而是怎样把一个任务拆成多个角色和责任边界。",
  },
  openmanus: {
    positioning:
      "OpenManus 更像通用执行代理方向的探索型积木，适合研究“如何把更泛化的任务交给代理去推进”。",
    watchouts:
      "这类通用代理最容易让人期待过高。研究时要区分概念方向是否成立，和系统是否已经足够稳定可用，是两回事。",
  },
  "browser-use": {
    positioning:
      "browser-use 是理解 Browser Agent 路线的核心代表。它把网页结构、动作和模型推理连在一起，适合拿来判断网页代理这条路线到底值不值得深挖。",
    entryPath:
      "建议直接用真实网页任务试，不要只看视频。比如登录、检索、跳转、填表、抓结果，才能看出它是实验玩具还是可复用积木。",
  },
  skyvern: {
    positioning:
      "Skyvern 更偏产品化网页执行平台，而不是单纯研究性质的 browser agent。它更强调可靠执行、流程化和面向业务动作的稳定度。",
  },
  stagehand: {
    positioning:
      "Stagehand 更像工程团队研究浏览器代理时会选的“开发者层积木”，重点是把浏览器控制整理成更适合产品化和二次开发的接口。",
  },
  crawl4ai: {
    positioning:
      "Crawl4AI 更适合作为知识采集前置层来理解。它不是问答系统本身，而是决定你喂给后面 RAG 的原料质量。",
  },
  firecrawl: {
    positioning:
      "Firecrawl 更偏网站到知识材料的产品化转换层，适合拿来缩短‘网页内容进入 AI 系统’这一步。",
  },
  "ui-tars": {
    positioning:
      "UI-TARS 是理解 GUI Agent 路线的重要代表项目，价值在于它把视觉理解和界面操作放到同一条链上来看。",
  },
  "ui-tars-desktop": {
    positioning:
      "UI-TARS Desktop 更接近桌面产品形态，适合你判断 GUI Agent 从研究走向可用产品时，会遇到哪些真实交互问题。",
  },
  "open-interpreter": {
    positioning:
      "Open Interpreter 更像‘把模型直接接到本地系统能力’的个人代理路线。它强调的是执行权下放，而不是完整的流程编排。",
  },
  dify: {
    positioning:
      "Dify 更像 AI 应用平台，而不是单一积木。它适合放在“团队怎样把模型、知识库、工作流和发布纳入同一套系统”这个角度去研究。",
    entryPath:
      "研究时不要只盯着 workflow 编辑器，最好同时看知识库、工具接入、应用发布和运营面板，因为它的价值在于整个平台闭环。",
  },
  flowise: {
    positioning:
      "Flowise 更偏低门槛原型与可视化试验场，适合快速试思路，不一定是最终生产中台。",
  },
  langflow: {
    positioning:
      "Langflow 更适合当教学、演示和快速解释复杂链路的积木。它的优势在于可视化表达，而不是比所有工作流平台都更适合生产。",
  },
  n8n: {
    positioning:
      "n8n 更像把 AI 接进既有 SaaS 和业务动作的大号连接器底座。它的价值在于连接和执行，而不是模型本身。",
  },
  langgraph: {
    positioning:
      "LangGraph 更像复杂 agent 流程的控制骨架。它适合解决‘流程很长、状态很多、需要可恢复’这类问题，而不是简单串几个节点。",
  },
  haystack: {
    positioning:
      "Haystack 更偏工程化知识系统框架，适合用来理解成熟 RAG 系统在解析、检索、流水线和服务化上的完整结构。",
  },
  "llama-index": {
    positioning:
      "LlamaIndex 更像知识中间层，擅长把杂乱数据转成模型能用的上下文，而不是只做一个简单问答界面。",
  },
  hayhooks: {
    positioning:
      "Mem0 更适合被当成 Agent 的长期记忆层积木，而不是完整应用。它解决的是“记住谁、记住什么、何时提取”的问题。",
  },
  "anything-llm": {
    positioning:
      "AnythingLLM 更偏产品态知识助手，适合快速搭一个可用界面，不一定适合做最底层、最灵活的知识系统骨架。",
  },
  graphrag: {
    positioning:
      "GraphRAG 更适合在复杂关系、多跳问题和结构化知识场景里发力，不是所有 RAG 都有必要一上来就图谱化。",
    watchouts:
      "GraphRAG 的研究成本和建模成本都更高。只有当普通检索确实解释不了复杂关系时，它的投入才更值得。",
  },
  "open-webui": {
    positioning:
      "Open WebUI 更像多模型工作台和统一入口层。它不是模型能力本身，但常常决定团队实际会不会长期使用这些能力。",
  },
  mcpo: {
    positioning:
      "mcpo 是很典型的协议桥接积木。它的价值不在于单独好不好看，而在于能否把 MCP 能力更顺手地接入你现有的 HTTP/OpenAPI 世界。",
  },
  ollama: {
    positioning:
      "Ollama 更像本地模型运行入口，而不是推理引擎终局。它的价值是把本地实验、个人设备和轻量部署门槛压低。",
  },
  vllm: {
    positioning:
      "vLLM 更偏生产级推理底座，适合解决吞吐、并发和服务成本问题，而不是提供一层完整产品体验。",
  },
  sglang: {
    positioning:
      "SGLang 更像把推理性能和程序化生成控制结合起来的引擎层积木，适合对输出结构和服务性能都有要求的场景。",
  },
  litellm: {
    positioning:
      "LiteLLM 更像模型路由与统一网关层。它的重要性通常不是“生成更聪明”，而是让多模型系统更好接、更好管、更好降级。",
  },
  chroma: {
    positioning:
      "Chroma 更适合轻量原型和早期验证，价值在于简单直观，适合快速试知识检索链路。",
  },
  qdrant: {
    positioning:
      "Qdrant 更偏生产级检索底座，适合把语义检索从“能跑”推进到“能长期稳定服务”。",
  },
  markitdown: {
    positioning:
      "MarkItDown 更像知识预处理小积木，体量不大，但经常直接影响后续索引、切片和引用质量。",
  },
  aider: {
    positioning:
      "Aider 更像终端里的高效结对编程工具，擅长直接进真实仓库改代码，适合开发者个人高频使用。",
  },
  continue: {
    positioning:
      "Continue 更偏 IDE 增强层，重点是把模型能力更自然地嵌进开发者已有工作流，而不是让人换一种开发方式。",
  },
  "bolt-diy": {
    positioning:
      "bolt.diy 更适合作为生成式建站或应用原型路线的研究样本，价值在于研究“语言到可运行界面”的交互和系统组织方式。",
  },
  cline: {
    positioning:
      "Cline 更像 IDE 内的执行型编码代理，重点在执行任务链，而不只是补全文本。",
  },
  comfyui: {
    positioning:
      "ComfyUI 更像视觉生成工作流底座。它的重要性不止在图像生成，而在于它把复杂多模型链路可视化和模块化了。",
  },
  llava: {
    positioning:
      "LLaVA 是理解开源视觉语言模型能力边界的代表项目，适合拿来判断视觉理解在真实任务里到底能走到哪一步。",
  },
  lerobot: {
    positioning:
      "LeRobot 更像机器人实验与数据、策略组织平台，适合研究具身方向怎样搭实验基础设施。",
  },
  openvla: {
    positioning:
      "OpenVLA 更偏视觉-语言-动作一体化模型方向，适合研究从感知到动作的统一建模路径。",
  },
  langchain: {
    positioning:
      "LangChain 更像通用拼装层和生态枢纽，它的价值常在‘连接一切’而不是某一项能力特别深。",
  },
  deepagents: {
    positioning:
      "Deep Agents 更适合用来研究长任务、子代理和文件系统结合后的代理结构，是偏“深执行”的积木。",
  },
  "pydantic-ai": {
    positioning:
      "PydanticAI 更像结构化和类型安全取向的 Agent 工程框架，适合对稳定输入输出有要求的团队。",
  },
  mastra: {
    positioning:
      "Mastra 更适合 TS 团队，它把现代 Web 开发习惯和 Agent 应用框架结合得比较紧。",
  },
  activepieces: {
    positioning:
      "Activepieces 更像把连接器、工作流和 AI/MCP 接到一起的自动化平台，适合看‘AI 如何进入业务自动化骨架’。",
  },
  "trigger-dev": {
    positioning:
      "Trigger.dev 更偏长任务可靠执行层。它不像传统低代码平台那样强调节点拼装，而更强调后台执行的稳定性和工程控制感。",
  },
  "lobe-chat": {
    positioning:
      "Lobe Chat 更像高完成度 AI 工作台前端，适合研究“一个团队真正愿意天天用的 AI 门户应该长什么样”。",
  },
  ragflow: {
    positioning:
      "RAGFlow 更偏完整上下文引擎，适合研究企业级 RAG 怎样把解析、索引、检索和代理模板串成统一系统。",
  },
  "mcp-servers": {
    positioning:
      "MCP Servers 更像官方参考样板库，是理解 MCP 协议如何真实落地的重要入口，而不是单一成品。",
  },
  "mcp-typescript-sdk": {
    positioning:
      "MCP TypeScript SDK 更像协议接入工具层，适合你自己做 MCP client/server 或二次封装时使用。",
  },
  "firecrawl-mcp": {
    positioning:
      "Firecrawl MCP 是典型“把单点能力暴露成工具协议”的积木，适合研究 MCP 如何把数据采集接进代理工具链。",
  },
  langchainjs: {
    positioning:
      "LangChain.js 更像 JS/TS 生态的通用 AI 开发底座，适合前后端统一语言栈时使用。",
  },
  maxun: {
    positioning:
      "Maxun 更偏产品化网页采集平台，适合研究非工程用户也能配置和复用的网页自动化形态。",
  },
  composio: {
    positioning:
      "Composio 更像 Agent 工具连接中台，价值在于把大量第三方系统变成可被代理调用的标准接口。",
  },
  "simular-ai-agent-s": {
    positioning:
      "Agent S 更适合作为 GUI Agent 路线的对照样本，适合横向比较不同桌面代理方案的抽象和取舍。",
  },
  "open-evolve": {
    positioning:
      "OpenEvolve 更偏反馈驱动、自改进路线的研究积木，适合探索代理如何围绕结果持续试错和优化。",
  },
  docling: {
    positioning:
      "Docling 更像高质量文档解析层，适合把复杂 PDF、报告和 Office 材料送入知识系统前做精细清洗。",
  },
  mineru: {
    positioning:
      "MinerU 更偏复杂学术与 PDF 材料解析，适合研究困难文档场景里的精度问题，而不是通用轻量文本清洗。",
  },
  supervision: {
    positioning:
      "Supervision 更像视觉任务工具层，不是大模型本身，却常常决定视觉项目的评估、可视化和后处理体验。",
  },
  smolagents: {
    positioning:
      "smolagents 更适合快速试工具代理想法，轻量、直接，适合低心智成本地验证一条 agent 思路。",
  },
  "openai-agents-python": {
    positioning:
      "OpenAI Agents SDK Python 更像工程骨架型多代理框架，重点在 handoff、guardrails、tracing 这些真正让系统可控的部分。",
  },
  "openai-agents-js": {
    positioning:
      "OpenAI Agents SDK JS 更适合前后端统一和实时交互类产品，尤其适合需要把 agent、语音和 Web 产品结合的场景。",
  },
  "livekit-agents": {
    positioning:
      "LiveKit Agents 更偏实时语音与多模态产品框架，适合研究“能上线的实时代理”而不只是异步问答。",
  },
  pipecat: {
    positioning:
      "Pipecat 更像实时会话流水线积木，适合把语音、视频、STT/TTS、LLM 这些组件串成一条低延迟会话链。",
  },
  moshi: {
    positioning:
      "Moshi 更偏实时语音模型路线研究，适合看全双工对话和可打断交互的体验边界。",
  },
  inngest: {
    positioning:
      "Inngest 更像长期后台任务与可靠执行引擎，适合把 AI 代理接进真正长期运行的后端系统。",
  },
  "agent-kit": {
    positioning:
      "Inngest AgentKit 更像 TS 生态里的多代理网络与工作流结合层，适合研究‘代理如何进入耐久任务系统’。",
  },
  "llama-factory": {
    positioning:
      "LLaMA-Factory 更像模型训练与微调工程台，适合把“训练一把”从实验命令变成更可管理的流程。",
  },
  "openvino-genai": {
    positioning:
      "OpenVINO GenAI 更偏端侧与边缘推理路线，适合研究生成式模型如何进入 PC、CPU、GPU、NPU 场景。",
  },
  "roboflow-inference": {
    positioning:
      "Roboflow Inference 更像视觉模型部署与视频工作流平台，适合把视觉模型从实验推进到摄像头和实时系统。",
  },
};

function joinList(items) {
  return items.filter(Boolean).join("、");
}

function deriveBestFor(block) {
  const items = (block.outputs ?? []).slice(0, 3);
  if (!items.length) {
    return `适合用来验证 ${block.name} 在 ${block.category} 方向里的真实落地边界。`;
  }

  return `最适合先拿来做 ${joinList(items)} 这类可见结果，因为这些最能快速暴露它的真实能力边界。`;
}

function enrichBlock(block) {
  const lens = CATEGORY_LENS[block.category] ?? CATEGORY_LENS.Agent;
  const override = BLOCK_OVERRIDES[block.id] ?? {};

  return {
    ...block,
    positioning: override.positioning ?? lens.positioning,
    bestFor: override.bestFor ?? deriveBestFor(block),
    entryPath: override.entryPath ?? lens.entryPath,
    evaluationFocus: override.evaluationFocus ?? lens.evaluationFocus,
    watchouts: override.watchouts ?? lens.watchouts,
  };
}

export { enrichBlock };
