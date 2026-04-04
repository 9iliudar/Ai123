export const conceptEntries = [
  {
    id: "prompt-engineering",
    name: "提示词工程",
    summary: "围绕输入设计、约束与示例组织，提升模型输出质量的一套方法。",
    detail:
      "它关注你如何提问、如何给边界、如何给示例，以及如何把目标拆成模型容易理解的任务。很多早期 AI 产品的可用性，核心都来自提示词工程。",
    importance: 5,
    links: ["上下文工程", "工作流编排", "结构化输出"],
    color: "violet",
  },
  {
    id: "context-engineering",
    name: "上下文工程",
    summary: "通过记忆、检索、工具结果和历史状态，构建模型运行所需上下文。",
    detail:
      "相比提示词工程，上下文工程更强调模型在执行时真正看到了什么信息。它涉及 RAG、会话记忆、用户资料、工具返回结果、系统状态等，是构建长期可用 AI 产品的关键层。",
    importance: 5,
    links: ["提示词工程", "RAG", "记忆系统"],
    color: "cyan",
  },
  {
    id: "steering-engineering",
    name: "驾驭工程",
    summary: "通过规则、状态、反馈与工具链约束，让模型行为稳定可控。",
    detail:
      "它不是单纯让模型回答得更好，而是让模型在一个系统里持续按照你预期的风格、权限和目标行动。可以理解为面向产品化的行为控制层。",
    importance: 4,
    links: ["上下文工程", "Agent", "评测"],
    color: "amber",
  },
  {
    id: "rag",
    name: "RAG",
    summary: "检索增强生成，让模型在回答前先拿到外部知识。",
    detail:
      "RAG 的关键不是“接了向量库”这么简单，而是检索质量、切片策略、召回结果排序，以及回答时如何正确使用外部内容。",
    importance: 5,
    links: ["上下文工程", "向量数据库", "知识库"],
    color: "emerald",
  },
  {
    id: "agent",
    name: "Agent",
    summary: "能够自主规划步骤、调用工具并完成目标任务的 AI 执行体。",
    detail:
      "Agent 的核心不只是多轮对话，而是目标驱动、带状态、能执行动作。它往往依赖工具调用、记忆、上下文管理和评估反馈。",
    importance: 5,
    links: ["工作流编排", "工具调用", "记忆系统"],
    color: "rose",
  },
  {
    id: "workflow-orchestration",
    name: "工作流编排",
    summary: "把多个模型步骤、工具调用和业务节点串成可复用流程。",
    detail:
      "当一个问题无法靠单次生成解决时，就需要把意图拆解成流程。工作流编排强调节点、顺序、条件、异常回退和可观测性。",
    importance: 4,
    links: ["Agent", "结构化输出", "评测"],
    color: "blue",
  },
  {
    id: "tool-calling",
    name: "工具调用",
    summary: "让模型不只说话，还能调用搜索、数据库、代码执行等外部能力。",
    detail:
      "工具调用把模型从内容生成器扩展成任务执行器。它往往决定 AI 产品到底是“会聊天”还是“能做事”。",
    importance: 4,
    links: ["Agent", "工作流编排", "结构化输出"],
    color: "orange",
  },
  {
    id: "memory-system",
    name: "记忆系统",
    summary: "让模型在多次会话或长任务中保留用户信息、偏好和关键状态。",
    detail:
      "记忆系统不只是保存聊天记录，而是决定哪些信息该长期保留、哪些只在当前任务有效，以及如何在合适时机重新注入模型上下文。",
    importance: 4,
    links: ["上下文工程", "Agent", "RAG"],
    color: "pink",
  },
  {
    id: "structured-output",
    name: "结构化输出",
    summary: "让模型按固定 JSON、字段或 schema 返回结果，便于程序消费。",
    detail:
      "很多产品级 AI 功能最后都要喂给界面、数据库或其他系统，所以结构化输出是把模型接进业务链路的关键一步。",
    importance: 4,
    links: ["提示词工程", "工具调用", "评测"],
    color: "indigo",
  },
  {
    id: "evaluation",
    name: "评测",
    summary: "用规则、样本和指标持续验证模型输出是否可靠。",
    detail:
      "没有评测，AI 产品就只能靠主观感觉。评测让你知道哪些提示词有效、哪些流程稳定、哪些版本退化了。",
    importance: 3,
    links: ["驾驭工程", "工作流编排", "结构化输出"],
    color: "teal",
  },
];
