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
    summary:
      "OpenHands 已经不是单一形态的代码助手，而是一套 AI-driven development 产品族，覆盖 SDK、CLI、本地 GUI、云端与企业自托管形态。",
    positioning:
      "OpenHands 更接近“面向真实软件任务的工程执行层”。官方把它定义成 AI-driven development：核心不是补全代码，而是把读仓库、改文件、跑命令、持续修复和多轮推进串成统一执行面。",
    solves:
      "它解决的不是“回答一个编程问题”，而是把真实开发任务往前推进的问题。包括读代码库、理解上下文、执行命令、修复错误、持续迭代，以及在本地或云端运行代理。",
    bestFor:
      "最适合先拿来做中小型真实仓库任务，比如修 bug、补功能、改多文件、跑命令和验证结果。这样最能看出它是不是工程代理，而不只是会说代码的聊天工具。",
    entryPath:
      "最适合用一个真实但边界清楚的小仓库验证：看它如何读上下文、提出计划、修改多文件、运行命令并根据报错继续推进。",
    evaluationFocus:
      "重点看它在真实仓库里的稳定性，而不是 benchmark。尤其要看命令执行、文件修改范围控制、失败恢复和上下文管理。",
  },
  autogen: {
    summary:
      "AutoGen 是微软的 agentic AI 编程框架，重点是多智能体工作流，而不是单个助手体验。",
    positioning:
      "AutoGen 更适合作为多智能体编程框架来理解。官方强调它提供框架、开发者工具和应用生态，并采用分层、可扩展设计，支持从高层 API 到底层组件的不同抽象层级。",
    solves:
      "它主要解决多角色 agent 的消息传递、任务分工、工具接入和工作流编排问题，让你不必从零搭一个多智能体运行框架。",
    bestFor:
      "最适合先拿来做多智能体实验和工作流原型，比如专家代理协作、MCP 工具调用、浏览器辅助代理，或者需要多人分工式 agent 的任务链路。",
  },
  "semantic-kernel": {
    summary:
      "Semantic Kernel 是微软面向应用集成的 AI orchestration SDK，主轴是把模型、插件、流程、记忆和企业系统接到一起。",
    positioning:
      "Semantic Kernel 更像企业应用接入层。官方强调插件生态、向量数据库支持、多模态、本地部署、流程框架和企业级可观测性/稳定 API，明显是面向应用和业务流程接入。",
    solves:
      "它解决的是“如何把模型能力真正接入现有应用和业务系统”这个问题，包括插件调用、结构化流程、记忆、向量检索以及企业级部署与运维要求。",
    bestFor:
      "最适合先拿来做企业 Copilot、业务助手、插件化 Agent 或需要把模型能力嵌进现有系统的场景，而不是纯研究型聊天演示。",
  },
  "qwen-agent": {
    summary:
      "Qwen-Agent 是建立在 Qwen 模型之上的 Agent 框架与应用集合，官方重点放在 Function Calling、MCP、Code Interpreter、RAG 和可快速部署的 GUI。",
    positioning:
      "Qwen-Agent 更像面向任务执行的实用框架。它不是只做聊天，而是围绕工具调用、文件读取、代码解释器、MCP 和 WebUI，搭建可运行的 Agent 应用骨架。",
    solves:
      "它解决的是如何更快搭出“会调工具、会读文件、会执行代码、还能接 MCP/RAG”的任务型 Agent，而不必自己拼底层能力。",
    bestFor:
      "最适合先拿来做中文任务代理、带工具的问答助手、文件处理 Agent，或需要快速验证 MCP 与代码执行链路的原型。",
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
    summary:
      "browser-use 的官方定位非常明确：让网站对 AI agents 可用，并把在线任务自动化做得更容易。",
    positioning:
      "browser-use 是典型 Browser Agent 积木。官方把它做成开源库、CLI 和 Cloud 组合，核心是让代理直接驱动浏览器完成真实网页任务，而不是只返回网页文本。",
    solves:
      "它解决的是“代理如何真正操作网站”这个问题，包括浏览器控制、表单填写、跨页面操作、在线购物、网页助理等真实任务，而不只是网页抓取。",
    bestFor:
      "最适合先拿来做表单填写、网页办事、网页助理、账号内流程自动化这类真实在线任务，尤其适合验证 Browser Agent 是否真能替代部分手工网页操作。",
    entryPath:
      "建议直接用真实网页任务试，不要只看视频。比如登录、检索、跳转、填表、抓结果，才能看出它是实验玩具还是可复用积木。",
  },
  skyvern: {
    summary:
      "Skyvern 官方把自己定义为用 LLM 和计算机视觉自动化浏览器工作流的平台，同时提供 Playwright 兼容 SDK 和 no-code 工作流构建器。",
    positioning:
      "Skyvern 更偏产品化网页执行平台。它的切入点不是单个动作，而是“浏览器工作流自动化”，并明确对比传统依赖 DOM/XPath 的脆弱自动化方案。",
    solves:
      "它解决的是网页自动化在页面变化后容易失效的问题。Skyvern 用视觉理解替代固定 XPath，目标是在没见过的网站上也能执行工作流，并更抗页面改版。",
    bestFor:
      "最适合先拿来做跨页面流程、重复运营动作、复杂网站任务和需要 no-code/低代码交付给业务方的浏览器自动化场景。",
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
    summary:
      "Dify 官方定位是 production-ready 的开源 LLM 应用开发平台，把 AI workflow、RAG pipeline、agent、model management 和 observability 放在同一界面里。",
    positioning:
      "Dify 更像 AI 应用平台，而不是单一能力库。官方强调从 prototype 到 production，说明它的重点不是 demo，而是把 AI 应用真正组织成可上线、可观察、可管理的平台。",
    solves:
      "它解决的是团队搭建 LLM 应用时能力分散的问题，把工作流、RAG、Agent、模型支持、日志与性能分析，以及 API 接入统一到一个平台。",
    bestFor:
      "最适合先拿来做内部 AI 平台、知识问答应用、流程型 Agent 应用，或者需要让产品、运营、开发在同一平台协作的场景。",
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
    summary:
      "n8n 官方定位是面向技术团队的安全工作流自动化平台，强调 400+ 集成、原生 AI 能力、可视化搭建和必要时写代码。",
    positioning:
      "n8n 更像连接器和执行底座。它不是以模型为中心，而是以业务流程为中心，把可视化搭建、JavaScript/Python、自托管和 AI 工作流放在同一套系统里。",
    solves:
      "它解决的是跨系统自动化的问题，包括把 SaaS、数据库、消息系统和 AI 能力接进一条工作流，同时保留技术团队对代码、数据和部署的控制权。",
    bestFor:
      "最适合先拿来做跨系统流程自动化、通知流、内部运营流，以及需要把 AI 步骤嵌进既有业务工作流的场景。",
  },
  langgraph: {
    summary:
      "LangGraph 官方定位是为构建、管理和部署长时运行、有状态 agent 的低层编排框架。",
    positioning:
      "LangGraph 更像复杂 agent 的控制骨架。官方重点是 durable execution、human-in-the-loop、comprehensive memory 和 production-ready deployment，明显针对长流程和状态管理。",
    solves:
      "它解决的是长时运行、有状态、可中断、可恢复的 agent 工作流问题，让复杂代理不只是线性步骤，而是能在失败后恢复、插入人工干预并保持记忆。",
    bestFor:
      "最适合先拿来做长任务代理、复杂审批/人工介入流程、需要状态恢复的研究代理，或者任何比普通链路复杂得多的 agent 系统。",
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
    summary:
      "Open WebUI 官方定位是可扩展、功能完整、用户友好的自托管 AI 平台，可完全离线运行，支持 Ollama、OpenAI 兼容 API，并内置 RAG 推理引擎。",
    positioning:
      "Open WebUI 更像多模型工作台和统一入口层。它的重点不是模型本身，而是把模型接入、角色/权限、文档知识、网页接入、图像生成、语音视频和可观测性整合成一个可用前端。",
    solves:
      "它解决的是团队或个人缺少统一 AI 门户的问题，让本地模型、远程 API、RAG、工具、角色和权限能在一个界面里长期使用，而不是散落在多个小工具里。",
    bestFor:
      "最适合先拿来做私有 AI 门户、多模型工作台、团队内部知识问答入口，或者需要自托管且可扩展的统一交互层。",
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
    summary:
      "LiteLLM 官方把自己定义为开源 AI Gateway，可用 OpenAI 格式统一调用 100+ LLM，并提供成本跟踪、guardrails、负载均衡和日志能力。",
    positioning:
      "LiteLLM 更像模型路由与统一网关层。官方强调 Python SDK 和 Proxy Server 两种形态，说明它的核心价值是统一入口、统一协议和统一治理，而不是某个单模型能力。",
    solves:
      "它解决的是多模型系统接入分散、接口不统一、成本和日志难管理的问题，让你能用一套 OpenAI 风格接口去接多家模型与代理服务。",
    bestFor:
      "最适合先拿来做模型网关、多模型路由层、统一代理出口，或者需要成本统计、权限控制、回退与负载均衡的生产环境。",
  },
  chroma: {
    positioning:
      "Chroma 更适合轻量原型和早期验证，价值在于简单直观，适合快速试知识检索链路。",
  },
  qdrant: {
    summary:
      "Qdrant 官方定位是高性能、大规模向量数据库与向量搜索引擎，服务下一代 AI 场景。",
    positioning:
      "Qdrant 更偏生产级检索底座。官方重点放在 payload filtering、hybrid search、量化、分布式部署、gRPC 和硬件优化，明显面向长期运行和大规模检索。",
    solves:
      "它解决的是语义检索从原型走向生产的问题，不只是存向量，还包括过滤、混合检索、成本优化、扩缩容和生产级查询性能。",
    bestFor:
      "最适合先拿来做企业知识检索底座、语义搜索服务、推荐/相似搜索，或者需要把 RAG 检索做成长期稳定服务的场景。",
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

const OFFICIAL_DESCRIPTION_OVERRIDES = {
  crewai: {
    summary:
      "crewAI 官方强调的是 Crews 与 Flows 两套核心抽象：前者处理角色化团队协作，后者处理事件驱动、可审计的生产工作流，所以它不只是“多 agent 聊天框架”。",
    solves:
      "它解决的是多智能体系统既要有角色分工，又要有可落地流程控制的问题，把 agent 协作和 production workflows 放到同一套 Python 框架里。",
    bestFor:
      "最适合先拿来做需要角色协作加流程编排一起出现的任务，比如研究团队、内容链路、分析协作流，以及从实验直接走向生产编排的多 agent 系统。",
  },
  openmanus: {
    summary:
      "OpenManus 官方定位很克制，核心就是开源版 Manus 路线探索，强调开放实现与通用任务执行能力，而不是一个已经完全产品化的现成系统。",
    solves:
      "它尝试解决通用代理如何把规划、工具使用、网页/环境操作和长任务推进整合成一个开放可研究框架的问题。",
    bestFor:
      "最适合先拿来研究通用执行型 agent 的系统结构，尤其是任务拆解、环境交互和多步推进这条链路，而不是期待它像成熟 SaaS 一样开箱即用。",
  },
  stagehand: {
    summary:
      "Stagehand 官方直接把自己定义为 AI Browser Automation Framework，目标是让浏览器自动化以 AI 原生方式进入开发者工作流。",
    solves:
      "它解决的是浏览器控制过于底层、脚本脆弱的问题，把页面理解、动作执行和自动化接口包装成更适合工程团队复用的框架层。",
    bestFor:
      "最适合先拿来做开发者可控的浏览器自动化底座，比如把 Playwright 式自动化升级成带语义理解的网页执行层，或给产品里的 browser agent 提供工程接口。",
  },
  crawl4ai: {
    summary:
      "Crawl4AI 官方定位是开源、LLM-friendly 的 Web Crawler & Scraper，核心不是传统爬虫规模，而是让网页内容更适合后续 Agent 与 RAG 消费。",
    solves:
      "它解决的是原始网页抓下来后并不适合模型使用的问题，把抓取、清洗、结构化和面向 LLM 的输出组织到同一采集链路里。",
    bestFor:
      "最适合先拿来做知识采集前置层，把网站、文档站和内容页转成更适合切片、索引和检索的材料，再接 RAG 或 agent 系统。",
  },
  firecrawl: {
    summary:
      "Firecrawl 官方定位是给 AI 提供干净网页数据的 Web Data API，支持 search、scrape、interact，并强调大规模、实时、LLM-ready 输出。",
    solves:
      "它解决的是网页数据采集又脏又碎的问题，把 JS 重页面、代理、限流、结构化输出和网页交互都封成统一 API，让 agent 直接拿到可用网页数据。",
    bestFor:
      "最适合先拿来做网站到知识库的采集层、实时网页搜索/抓取服务，或者给 agent 提供稳定的网页数据与页面动作能力。",
  },
  "ui-tars": {
    summary:
      "UI-TARS 官方定位是原生 GUI Agent 模型路线，重点在于用统一代理模型处理图形界面理解、操作，甚至延展到游戏、代码和工具使用。",
    solves:
      "它解决的是模型如何真正读懂屏幕、定位控件并执行图形界面动作，而不是只在文本接口里调用 API。",
    bestFor:
      "最适合先拿来研究 GUI Agent 的原生模型能力边界，比如桌面操作、复杂界面控制、跨应用任务，以及视觉 grounding 的可靠性。",
  },
  "ui-tars-desktop": {
    summary:
      "UI-TARS Desktop 官方把自己定义成开源多模态 AI Agent 栈，目标是把前沿模型能力、Agent infra 与本地设备执行体验连接起来。",
    solves:
      "它解决的是 GUI Agent 只停留在论文或脚本层的问题，进一步提供面向本地个人设备的桌面化运行栈和更完整的代理执行环境。",
    bestFor:
      "最适合先拿来验证本地桌面 agent 体验，尤其是个人设备上的操作链路、模型接入、代理运行框架和实际可用性。",
  },
  "open-interpreter": {
    summary:
      "Open Interpreter 官方定义非常清楚，就是给电脑提供自然语言接口，让 LLM 能在本地运行 Python、JavaScript、Shell 等代码。",
    solves:
      "它解决的是模型只能停在文本建议层的问题，把代码执行权接到本地计算环境，让代理能真正操作文件、数据、浏览器和系统能力。",
    bestFor:
      "最适合先拿来做个人电脑上的执行型助手，比如数据分析、批量处理、文件转换、脚本自动化和本地研究任务。",
  },
  flowise: {
    summary:
      "Flowise 官方定位很直接，就是可视化构建 AI Agents 的平台，强调用图形方式搭建 agent 与 LLM 应用。",
    solves:
      "它解决的是 AI 工作流原型搭建门槛偏高的问题，让节点式编排、调试和组装 agent 逻辑变得更直接。",
    bestFor:
      "最适合先拿来做 AI agent 原型、演示流和快速验证链路，尤其适合需要让非深度工程化用户也能看懂和参与搭建的场景。",
  },
  langflow: {
    summary:
      "Langflow 官方把自己定义成构建与部署 AI-powered agents and workflows 的强力工具，重点是可视化、可部署，而不只是画流程图。",
    solves:
      "它解决的是复杂 agent/workflow 难以表达和调试的问题，把组件连接、运行结果和部署出口统一在一个可视化开发环境里。",
    bestFor:
      "最适合先拿来做需要边搭边调的 agent 流程、教学演示、团队沟通原型，或者把 LangChain 生态链路可视化落地。",
  },
  haystack: {
    summary:
      "Haystack 官方现在的定位是开源 AI orchestration framework，强调构建 context-engineered、production-ready 的 LLM 应用，覆盖 RAG、agents、multimodal 与 search。",
    solves:
      "它解决的是生产级 LLM 应用需要显式控制检索、路由、记忆和生成的问题，而不是把这些步骤混在一条黑盒链里。",
    bestFor:
      "最适合先拿来做生产级 RAG、搜索问答、模块化 agent pipeline，或者需要对 retrieval 和 routing 保持明确控制的系统。",
  },
  "llama-index": {
    summary:
      "LlamaIndex 官方现在把自己同时定义成开源 agentic application framework，以及面向 OCR、parsing、extraction、indexing 的企业平台入口。",
    solves:
      "它解决的是非结构化数据如何进入 agent 系统的问题，把解析、抽取、索引和后续代理访问衔接成一整套文档到 agent 的链路。",
    bestFor:
      "最适合先拿来做文档 agent、知识系统和数据接入中间层，尤其适合文档解析与 agent 检索需要一起设计的场景。",
  },
  hayhooks: {
    summary:
      "Mem0 官方直接把自己定位成 AI Agents 的 universal memory layer，并强调长时记忆的准确率、速度和 token 效率。",
    solves:
      "它解决的是 agent 无法在长期交互里稳定记住用户、偏好和历史决策的问题，把记忆抽取、存储和召回独立成一层。",
    bestFor:
      "最适合先拿来给个性化助手、长期研究代理和多轮协作系统补长期记忆，而不是把所有历史都硬塞进上下文窗口。",
  },
  "anything-llm": {
    summary:
      "AnythingLLM 官方定位是 all-in-one AI productivity accelerator，强调本地优先、隐私优先、多用户、Agent 与文档问答的一体化体验。",
    solves:
      "它解决的是团队或个人想要一套现成 AI 工作台时，需要自己拼知识库、模型接入、代理和权限体验的问题。",
    bestFor:
      "最适合先拿来搭内部 AI 工作台、文档问答空间和本地隐私优先的知识助手，而不是从底层框架慢慢拼。",
  },
  graphrag: {
    summary:
      "GraphRAG 官方定位是 modular、graph-based 的 RAG 系统，本质上是一套从非结构化文本提取结构化图信息的数据管线与转换框架。",
    solves:
      "它解决的是普通向量检索难处理复杂实体关系和全局总结的问题，让私有数据先被整理成图式结构，再服务后续推理。",
    bestFor:
      "最适合先拿来做复杂关系型知识库、多实体多跳问答和需要全局主题归纳的私有数据检索场景。",
  },
  mcpo: {
    summary:
      "mcpo 官方定位是 simple、secure 的 MCP-to-OpenAPI proxy server，作用就是把任意 MCP 工具瞬间暴露成 OpenAPI 兼容 HTTP 服务。",
    solves:
      "它解决的是 MCP 工具天然跑在 stdio/raw protocol 上，不方便和现有 OpenAPI 工具链、鉴权、文档和 HTTP 系统集成的问题。",
    bestFor:
      "最适合先拿来把 MCP 工具接入现有 REST/OpenAPI 世界，比如给 agent 平台、网关、内部服务或前端系统提供标准 HTTP 入口。",
  },
  ollama: {
    summary:
      "Ollama 官方主轴很稳定，就是在本地快速拉起并运行各类开源模型，围绕本地推理提供统一的下载、管理、运行和 API 体验。",
    solves:
      "它解决的是本地模型运行需要自己处理模型格式、服务封装和调用接口的问题，把“把模型跑起来”这一步压成极低门槛的本地入口。",
    bestFor:
      "最适合先拿来做本地模型工作台、隐私优先演示、个人设备实验和给自托管 AI 前端提供统一模型运行后端。",
  },
  vllm: {
    summary:
      "vLLM 官方定位是高吞吐、内存高效的 LLM inference and serving engine，核心价值是把大模型服务性能做上去。",
    solves:
      "它解决的是 LLM 推理服务在吞吐、显存利用和并发场景下成本过高的问题，为生产部署提供更强的 serving 底座。",
    bestFor:
      "最适合先拿来做高并发模型服务、统一推理集群和面向生产的开源模型部署，而不是单机试玩。",
  },
  sglang: {
    summary:
      "SGLang 官方定位是面向大模型与多模态模型的高性能 serving framework，强调推理性能、模型支持与程序化生成控制。",
    solves:
      "它解决的是高性能推理和可控生成逻辑往往分离的问题，把 serving、调度和更程序化的生成表达整合在一套框架里。",
    bestFor:
      "最适合先拿来做对推理吞吐和输出控制都要求高的服务，比如结构化生成、多模态推理服务和高性能在线推理。",
  },
  chroma: {
    summary:
      "Chroma 官方给自己的定位很基础但准确，就是面向 AI 的数据基础设施，用来承接向量检索和语义记忆这类核心数据能力。",
    solves:
      "它解决的是早期 AI 应用需要一个上手快、接口简单、能直接接 embeddings 与检索链路的数据底座的问题。",
    bestFor:
      "最适合先拿来做语义检索原型、轻量知识库和本地 RAG 验证，尤其适合先把检索链路跑通。",
  },
  markitdown: {
    summary:
      "MarkItDown 官方定位是把文件和 Office 文档转换成 Markdown 的 Python 工具，现在还提供 MCP server 形态供 LLM 应用直接接入。",
    solves:
      "它解决的是各类文档格式在进入模型前难以统一清洗的问题，把文档先尽量标准化为 Markdown，便于后续切片、索引和引用。",
    bestFor:
      "最适合先拿来做文档预处理和格式归一化，把 PDF、Office、网页附件等先转成 AI 友好的中间文本层。",
  },
  aider: {
    summary:
      "Aider 官方定位非常明确，就是终端里的 AI pair programming 工具，既能从零起项目，也能直接在现有代码库里协作改代码。",
    solves:
      "它解决的是开发者想在终端里直接让模型改真实仓库代码的问题，尤其强调代码库映射、文件修改和与 git 工作流配合。",
    bestFor:
      "最适合先拿来做个人高频编码协作，在真实仓库里做多文件修改、重构和快速迭代，而不是只拿它聊天。",
  },
  continue: {
    summary:
      "Continue 的官方定位已经明显从“IDE 插件”转向 Continuous AI：既有可在 TUI 中运行的 coding agent，也有 Headless 模式的后台 agent，并把重点放到 source-controlled AI checks。",
    solves:
      "它解决的是团队使用 AI 编码时能力分散、规则无法落仓库的问题，让 AI 检查、后台代理和代码库约束进入同一条工程链路，而不只是补全或聊天。",
    bestFor:
      "最适合先拿来做代码库级 AI 检查、CI 中的规则化验证，以及需要 TUI/Headless agent 持续跑任务的团队工作流。",
  },
  "bolt-diy": {
    summary:
      "bolt.diy 官方定位是用任意 LLM 去 prompt、run、edit、deploy 全栈 Web 应用的开源环境，主轴是生成式建站/造应用。",
    solves:
      "它解决的是从一句需求到可运行全栈应用之间链路太长的问题，把生成、运行、编辑和部署都收进一个交互式开发面板。",
    bestFor:
      "最适合先拿来做生成式网页和全栈原型，尤其适合验证『一句话到应用』这种交互路线是否足够顺手。",
  },
  cline: {
    summary:
      "Cline 官方定位是 IDE 里的 autonomous coding agent，在你授权下能创建/编辑文件、执行命令、用浏览器并持续推进任务。",
    solves:
      "它解决的是 IDE 内代码助手只能说建议、很难真推进任务的问题，把文件、终端、浏览器和审批式执行闭环串起来。",
    bestFor:
      "最适合先拿来做 IDE 内的执行型开发任务，比如修 bug、改多文件、跑命令和浏览器辅助调试。",
  },
  comfyui: {
    summary:
      "ComfyUI 官方定位是最强大、最模块化的 diffusion model GUI / API / backend，核心是图节点式工作流而不是单一界面。",
    solves:
      "它解决的是图像生成链路复杂、参数多、流程难复用的问题，把扩散模型的推理过程拆成可组合、可保存、可复用的节点图。",
    bestFor:
      "最适合先拿来做图像/视频生成工作流、复杂提示链和多模型组合实验，尤其适合需要重复复用生成流程的场景。",
  },
  llava: {
    summary:
      "LLaVA 官方定位是 Large Language and Vision Assistant，核心贡献是 visual instruction tuning，把视觉理解推进到更接近 GPT-4V 风格的交互能力。",
    solves:
      "它解决的是开源模型在图文联合理解上的能力构建问题，为视觉问答、图像理解和多模态 agent 提供代表性基础模型路线。",
    bestFor:
      "最适合先拿来研究开源视觉语言模型能力边界，或给多模态问答、GUI 感知与视觉代理提供底层模型参考。",
  },
  lerobot: {
    summary:
      "LeRobot 官方定位是让机器人 AI 更易进入的开源库，提供真实世界机器人所需的模型、数据集与工具，并强调硬件无关接口。",
    solves:
      "它解决的是机器人学习缺少统一数据、控制接口和可复用工具的问题，把数据集、预训练模型、控制接口和训练工具组织成一套库。",
    bestFor:
      "最适合先拿来做机器人学习实验底座，尤其是数据集组织、策略训练与跨硬件控制接口标准化。",
  },
  openvla: {
    summary:
      "OpenVLA 官方定位是开源 vision-language-action 模型与训练/微调代码库，目标是服务通用机器人操作任务。",
    solves:
      "它解决的是机器人从视觉与语言输入直接映射到动作输出的统一建模问题，并给出可扩展训练与微调代码路径。",
    bestFor:
      "最适合先拿来研究 VLA 路线在通用机器人操作中的可行性，或做面向 manipulation 的训练与微调实验。",
  },
  langchain: {
    summary:
      "LangChain 官方现在直接把自己写成 reliable agents 平台的核心框架层，强调 agents、LLM-powered applications、标准接口和大量可互操作集成。",
    solves:
      "它解决的是模型、embedding、vector stores、tools 和外部系统集成各自分裂的问题，让开发者能用统一抽象去组织 AI 应用。",
    bestFor:
      "最适合先拿来做需要大量组件拼装和第三方集成的 Python LLM 应用，尤其适合想先用标准接口快速把模型、工具和检索链拼起来的场景。",
  },
  deepagents: {
    summary:
      "Deep Agents 官方定位是 batteries-included agent harness，主打开箱即用的 planning、filesystem、shell access、sub-agents 和上下文管理。",
    solves:
      "它解决的是自己从零拼执行型 agent 太繁琐的问题，直接给出一个 ready-to-run 的深执行代理骨架。",
    bestFor:
      "最适合先拿来做复杂任务代理原型，尤其是需要规划、读写文件、跑命令和拆分子代理的场景。",
  },
  "pydantic-ai": {
    summary:
      "PydanticAI 官方定位是 Pydantic 风格的 GenAI Agent Framework，强调类型、安全感和生产级工作流，而不是随意脚本式 agent。",
    solves:
      "它解决的是生成式 AI 应用在结构化输入输出、验证、可维护性和生产化上的工程问题。",
    bestFor:
      "最适合先拿来做对类型约束、结构化结果和生产级稳定性有要求的 Python agent 与 workflow 系统。",
  },
  mastra: {
    summary:
      "Mastra 官方定位是面向现代 TypeScript 栈的 AI-powered applications and agents framework，而且不止 agents，还内置 model routing、workflows、memory、MCP、evals 和 observability。",
    solves:
      "它解决的是 TS 团队搭 AI 应用时要在 agents、workflow、memory、MCP 与生产治理间自己拼装的问题，提供更完整的一体化框架。",
    bestFor:
      "最适合先拿来做 TypeScript/Next.js 团队的 agent 应用底座，尤其适合既要 agents 又要 workflow、观测和 MCP 的项目。",
  },
  activepieces: {
    summary:
      "Activepieces 官方现在强调 AI Agents、MCPs 与 AI Workflow Automation，正在把连接器、MCP 服务和自动化流程收进一个开源平台。",
    solves:
      "它解决的是业务自动化平台和 agent 工具体系割裂的问题，把连接器、AI 步骤与 MCP 工具统一进自动化平台。",
    bestFor:
      "最适合先拿来做面向业务方的自动化平台，尤其是需要连接器、MCP 和 AI 流程一起出现的场景。",
  },
  "trigger-dev": {
    summary:
      "Trigger.dev 官方定位已非常明确，就是 build and deploy fully-managed AI agents and workflows，底层强调可管理的后台执行系统。",
    solves:
      "它解决的是长任务、重试、排队、恢复和后台可观测性这些生产执行问题，让 AI workflow 不必靠脆弱脚本硬撑。",
    bestFor:
      "最适合先拿来做需要后台持久执行的 agent/workflow，比如异步处理、批量任务、长链路自动化与可重试任务系统。",
  },
  "lobe-chat": {
    summary:
      "Lobe Chat 官方产品叙事已经从聊天前端扩展成 AI Agent Workspace，核心不是单轮问答，而是把 agent teammates、Agent Builder、知识与模型入口做成高完成度工作空间。",
    solves:
      "它解决的是 AI 使用入口分散的问题，试图把模型接入、知识、插件/技能和多 agent 协作统一在一个长期可用的前端工作台里。",
    bestFor:
      "最适合先拿来做团队级 AI 工作台和多 agent 交互入口，尤其适合研究“什么样的 AI 前端值得用户每天打开”这类问题。",
  },
  ragflow: {
    summary:
      "RAGFlow 官方定位是融合前沿 RAG 与 Agent 能力的开源 RAG engine，目标是给 LLM 提供更强的 context layer。",
    solves:
      "它解决的是企业 RAG 不只是检索，还要文档解析、索引、上下文编排和代理能力协同的问题。",
    bestFor:
      "最适合先拿来做企业级知识问答和上下文引擎，尤其适合对文档解析与 RAG 整体闭环要求较高的场景。",
  },
  "mcp-servers": {
    summary:
      "MCP Servers 官方仓库定位很清楚，就是 MCP 的参考实现集合，而不是生产服务市场本身。",
    solves:
      "它解决的是开发者学习 MCP 时缺少权威样板的问题，提供由 steering group 维护的 reference servers 和相关资源入口。",
    bestFor:
      "最适合先拿来学习 MCP 协议落地方式、对照官方参考实现，或作为自建 MCP server 的起点样板。",
  },
  "mcp-typescript-sdk": {
    summary:
      "MCP TypeScript SDK 官方定位是 Model Context Protocol 的官方 TypeScript SDK，用于编写 MCP clients 和 servers。",
    solves:
      "它解决的是 TS 开发者实现 MCP 协议需要从规范层自己抠细节的问题，提供官方支持的协议实现与开发接口。",
    bestFor:
      "最适合先拿来做自定义 MCP server/client、协议接入层和 TypeScript 生态下的 MCP 工具开发。",
  },
  "firecrawl-mcp": {
    summary:
      "Firecrawl MCP 官方定位是 Firecrawl 的 MCP server，把网页抓取、搜索、研究和浏览器能力直接暴露给 Claude、Cursor 等 LLM 客户端。",
    solves:
      "它解决的是 Firecrawl 网页能力难以直接进入 MCP 工具链的问题，让 agent 通过标准 MCP 协议获得网页抓取与搜索能力。",
    bestFor:
      "最适合先拿来给 Claude Desktop、Cursor 或自建 MCP agent 增加网页抓取、深度研究和批量采集能力。",
  },
  langchainjs: {
    summary:
      "LangChain.js 官方与 Python 版一致，定位仍是 agent engineering platform 的 JS/TS 框架层，用统一组件构建 LLM 应用。",
    solves:
      "它解决的是 JS/TS 团队在模型、工具、检索与集成方面缺少统一抽象的问题，让 Web 技术栈也能顺手搭 agent 应用。",
    bestFor:
      "最适合先拿来做 Node/TypeScript 侧的 agent、RAG 与工具链应用，尤其是前后端统一技术栈的项目。",
  },
  maxun: {
    summary:
      "Maxun 官方定位是开源 no-code 平台，可把任意网站快速转成结构化 API，强调 scraping、crawling、search 与 AI data extraction。",
    solves:
      "它解决的是网页数据采集和结构化提取过于工程化的问题，把网站转 API 这件事降到更配置化、更产品化的层级。",
    bestFor:
      "最适合先拿来做无代码网页数据采集、网站到 API 转换和业务侧可操作的数据提取平台。",
  },
  composio: {
    summary:
      "Composio 官方最近的核心表述很集中：一方面是让 AI agents 和 LLM 通过 function calling 接入 100+ 高质量集成，另一方面用 SDK 和 Rube 这种 MCP server 形态把这些工具真正送进 agent 生态。",
    solves:
      "它解决的是 agent 接第三方工具时集成、认证、上下文管理和跨客户端复用都很分散的问题，把 SaaS/API 能力收束成统一工具接入层。",
    bestFor:
      "最适合先拿来做需要大规模第三方工具接入的 agent 系统，尤其适合既要 function calling，又要 MCP 兼容和统一鉴权体验的场景。",
  },
  "simular-ai-agent-s": {
    summary:
      "Agent S 官方定位是 open agentic framework that uses computers like a human，并持续围绕 OSWorld 这类基准推进 GUI/computer-use 能力。",
    solves:
      "它解决的是代理如何像人一样在真实计算机环境中感知并操作界面的难题，重点是 computer-use 路线的系统化实现。",
    bestFor:
      "最适合先拿来研究 computer-use agent 的通用桌面操作能力，以及对 GUI Agent 路线做横向对比。",
  },
  "open-evolve": {
    summary:
      "OpenEvolve 官方直接把自己定义成最先进的开源 evolutionary coding agent，目标是把 LLM 变成 autonomous code optimizer。",
    solves:
      "它解决的是代码优化往往依赖人工试错的问题，让模型围绕目标指标持续生成、评估和演化候选方案。",
    bestFor:
      "最适合先拿来做算法优化、性能优化和研究型代码搜索，尤其适合有明确评价函数的任务。",
  },
  docling: {
    summary:
      "Docling 官方定位是让文档为 GenAI 做好准备，重点在于多格式解析、先进 PDF 理解和统一文档表示。",
    solves:
      "它解决的是复杂文档进入 AI 系统前解析质量不足的问题，尤其擅长版面、阅读顺序、表格、公式和代码结构理解。",
    bestFor:
      "最适合先拿来做高质量文档解析和知识接入前处理，特别适合 PDF、报告和复杂版面材料。",
  },
  mineru: {
    summary:
      "MinerU 官方定位是高精度文档解析引擎，面向 LLM、RAG 与 Agent 工作流，把 PDF、Word、PPT、图片、网页等转成结构化 Markdown/JSON。",
    solves:
      "它解决的是复杂文档难以高质量进入 RAG/Agent 系统的问题，尤其强调 VLM+OCR 双引擎、多语言和面向工作流集成。",
    bestFor:
      "最适合先拿来做复杂文档解析、学术资料清洗和需要高精度结构化输出的知识接入任务。",
  },
  supervision: {
    summary:
      "Supervision 官方定位很实在，就是一套可复用 computer vision tools，用来做数据集加载、检测结果可视化、区域计数等视觉后处理。",
    solves:
      "它解决的是视觉项目里大量重复但必要的工程工具问题，把标注后处理、可视化、评估和视频/图像操作做成统一工具层。",
    bestFor:
      "最适合先拿来做 CV 项目的工程辅助层，比如检测结果可视化、区域统计、数据集处理和评估管线。",
  },
  smolagents: {
    summary:
      "smolagents 官方定位是 barebones library for agents that think in code，主打极简抽象、少量代码和一等公民的 Code Agents。",
    solves:
      "它解决的是很多 agent 框架过重的问题，用最轻的抽象先把工具型 agent 跑起来，并支持安全沙箱执行代码动作。",
    bestFor:
      "最适合先拿来做轻量 agent 原型、教学实验和代码型代理验证，尤其适合想低心智负担上手 agent 的场景。",
  },
  "openai-agents-python": {
    summary:
      "OpenAI Agents SDK Python 官方定位是轻量但强大的 multi-agent workflow 框架，支持 provider-agnostic 模型接入，并明确提供 agents、handoffs、tools、guardrails 与 tracing。",
    solves:
      "它解决的是多代理工作流从对话脚本走向工程系统时，缺少清晰 handoff、guardrails 和 tracing 结构的问题。",
    bestFor:
      "最适合先拿来做需要多代理协作、工具调用、安全护栏和追踪能力的 Python agent 系统。",
  },
  "openai-agents-js": {
    summary:
      "OpenAI Agents SDK JS 官方定位是面向 JavaScript/TypeScript 的轻量多代理工作流框架，并进一步覆盖 voice agents 场景。",
    solves:
      "它解决的是 JS/TS 团队在多代理、工具调用和实时语音代理方面缺少统一框架的问题。",
    bestFor:
      "最适合先拿来做 Web/Node 里的多代理应用和语音代理，尤其适合前后端统一用 TypeScript 的项目。",
  },
  "livekit-agents": {
    summary:
      "LiveKit Agents 官方定位是用于构建 realtime voice AI agents 的框架，强调服务器端可编程参与者、WebRTC 生态和多模态实时交互。",
    solves:
      "它解决的是实时语音 agent 需要把 STT、LLM、TTS、调度和终端接入统一起来的问题。",
    bestFor:
      "最适合先拿来做电话/语音助手、实时多模态客服和需要低延迟音视频交互的 agent 产品。",
  },
  pipecat: {
    summary:
      "Pipecat 官方定位是实时语音与多模态对话 AI 的开源框架，强调把音视频、AI 服务、传输层和 conversation pipelines 编排起来。",
    solves:
      "它解决的是实时会话系统中语音、视频、STT、TTS、LLM 与 transport 难以顺畅编成一个低延迟管线的问题。",
    bestFor:
      "最适合先拿来做实时语音代理、多模态会话系统和需要灵活替换音视频/模型组件的产品原型。",
  },
  moshi: {
    summary:
      "Moshi 官方定位是面向实时对话的 speech-text foundation model 与全双工 spoken dialogue framework，并提供研究、端侧与生产三套推理栈。",
    solves:
      "它解决的是实时语音对话需要可打断、低延迟、自然双向交流的问题，目标不是语音转文本，而是更接近真人对话的语音模型体验。",
    bestFor:
      "最适合先拿来研究全双工语音对话和实时 spoken dialogue 的体验边界，或为语音 agent 提供底层模型路线参考。",
  },
  inngest: {
    summary:
      "Inngest 官方定位是 workflow orchestration platform，可在 serverless、servers 或 edge 上运行有状态 step functions 与 AI workflows。",
    solves:
      "它解决的是后台长任务、状态恢复、调度与 AI workflow 执行缺少统一编排的问题。",
    bestFor:
      "最适合先拿来做耐久任务系统、后端 AI workflow 和需要可重试可恢复的生产执行引擎。",
  },
  "agent-kit": {
    summary:
      "AgentKit 官方定位是用 TypeScript 构建 multi-agent networks 的工具，强调 deterministic routing、typed state、MCP 与 Inngest 编排结合。",
    solves:
      "它解决的是 TS 多代理系统难以在可控路由、共享状态和容错执行之间兼得的问题。",
    bestFor:
      "最适合先拿来做需要确定性路由和工作流编排的 TS 多代理系统，尤其适合和 Inngest 一起落地。",
  },
  "llama-factory": {
    summary:
      "LLaMA-Factory 官方定位是统一、高效微调 100+ LLM 与 VLM 的训练平台，覆盖 LoRA、QLoRA、DPO 等主流路线。",
    solves:
      "它解决的是开源模型训练与微调流程过于分散的问题，把数据、方法、训练、对齐和实验管理统一进一套平台。",
    bestFor:
      "最适合先拿来做开源模型微调、对齐实验和训练工作流标准化，尤其适合多模型多方法并行验证。",
  },
  "openvino-genai": {
    summary:
      "OpenVINO GenAI 官方定位是运行主流生成式 AI 模型的库，提供简单 C++/Python API，并在 OpenVINO Runtime 上做 PC/端侧资源优化。",
    solves:
      "它解决的是生成式模型在 PC、CPU、GPU、NPU 等端侧环境运行复杂且资源开销高的问题。",
    bestFor:
      "最适合先拿来做本地 PC、边缘设备和资源受限环境下的生成式 AI 推理与应用部署。",
  },
  "roboflow-inference": {
    summary:
      "Roboflow Inference 官方定位是把任意电脑或边缘设备变成 CV 项目指挥中心的部署/运行框架，强调边缘与实时视觉工作流。",
    solves:
      "它解决的是视觉模型从训练结果到实际摄像头、设备和工作流部署之间的工程落地问题。",
    bestFor:
      "最适合先拿来做边缘视觉部署、摄像头接入和实时 CV workflow，把模型真正接进设备侧场景。",
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
  const override = {
    ...(BLOCK_OVERRIDES[block.id] ?? {}),
    ...(OFFICIAL_DESCRIPTION_OVERRIDES[block.id] ?? {}),
  };

  return {
    ...block,
    summary: override.summary ?? block.summary,
    solves: override.solves ?? block.solves,
    positioning: override.positioning ?? lens.positioning,
    bestFor: override.bestFor ?? deriveBestFor(block),
    entryPath: override.entryPath ?? lens.entryPath,
    evaluationFocus: override.evaluationFocus ?? lens.evaluationFocus,
    watchouts: override.watchouts ?? lens.watchouts,
  };
}

export { enrichBlock };
