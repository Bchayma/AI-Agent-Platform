"""LangGraph workflow for routing and executing the specialist agents."""

from __future__ import annotations

import json
import time
from typing import Any, TypedDict

from agents.base_agent import BaseAgent
from agents.documentation_agent import DocumentationAgent
from agents.report_agent import ReportAgent
from agents.research_agent import ResearchAgent
from agents.summarization_agent import SummarizationAgent
from rag.service import context_for_query

ROUTING_SYSTEM = """You are the routing coordinator for a multi-agent AI platform.
Choose the minimum workflow needed to satisfy the user's request.
Available agents: research, summarization, documentation, report.
Return ONLY a JSON array of agent names.
Use [] for a simple conversational request.
Use ["research", "summarization"] for research or analysis.
Use ["research", "summarization", "report"] for research plus a formal report.
Use ["summarization"] for supplied content summaries.
Use ["documentation"] for technical documentation."""


class WorkflowState(TypedDict, total=False):
    task_type: str
    payload: dict[str, Any]
    request: str
    pipeline: list[str]
    step: int
    current_content: str
    result: str
    context: str
    agents_used: list[str]
    logs: list[dict[str, str]]


class CoordinatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="CoordinatorAgent",
            role="Orchestrator",
            goal="Route tasks to the right agents and combine their outputs",
        )
        self.research = ResearchAgent()
        self.summarization = SummarizationAgent()
        self.documentation = DocumentationAgent()
        self.report = ReportAgent()
        self._agent_map = {
            "research": self.research,
            "summarization": self.summarization,
            "documentation": self.documentation,
            "report": self.report,
        }

    async def run(self, task_type: str, payload: dict) -> dict:
        start = time.time()
        self.clear_logs()
        self._clear_specialist_logs()
        self._log("start", f"Task type: {task_type}")

        graph = self._build_graph()
        initial: WorkflowState = {
            "task_type": task_type,
            "payload": payload,
            "request": self._request_for(task_type, payload),
            "current_content": self._request_for(task_type, payload),
            "step": 0,
            "agents_used": [],
            "logs": [],
        }
        state = await graph.ainvoke(initial)
        duration = round((time.time() - start) * 1000, 2)
        self._log("finish", f"Done in {duration} ms")

        specialist_logs = self._collect_logs()
        return {
            "result": state.get("result", state.get("current_content", "")),
            "agents_used": [
                "CoordinatorAgent",
                *state.get("agents_used", []),
            ],
            "duration_ms": duration,
            "logs": specialist_logs + self.get_logs(),
        }

    def _build_graph(self):
        from langgraph.graph import END, START, StateGraph

        graph = StateGraph(WorkflowState)
        graph.add_node("classify", self._classify)
        graph.add_node("retrieve", self._retrieve)
        graph.add_node("research", self._research)
        graph.add_node("summarization", self._summarization)
        graph.add_node("documentation", self._documentation)
        graph.add_node("report", self._report)
        graph.add_node("direct", self._direct)
        graph.add_node("finalize", self._finalize)
        graph.add_edge(START, "classify")
        graph.add_conditional_edges(
            "classify",
            self._route_after_classify,
            {
                "retrieve": "retrieve",
                "research": "research",
                "summarization": "summarization",
                "documentation": "documentation",
                "report": "report",
                "direct": "direct",
                "finalize": "finalize",
            },
        )
        graph.add_conditional_edges("retrieve", self._route_after_agent, self._routes())
        for node in ("research", "summarization", "documentation", "report"):
            graph.add_conditional_edges(node, self._route_after_agent, self._routes())
        graph.add_edge("direct", "finalize")
        graph.add_edge("finalize", END)
        return graph.compile()

    @staticmethod
    def _routes():
        return {
            "retrieve": "retrieve",
            "research": "research",
            "summarization": "summarization",
            "documentation": "documentation",
            "report": "report",
            "direct": "direct",
            "finalize": "finalize",
        }

    async def _classify(self, state: WorkflowState) -> dict:
        task_type = state["task_type"]
        payload = state["payload"]
        pipeline: list[str]
        if task_type == "analyze":
            depth = payload.get("depth", "standard")
            pipeline = ["research", "summarization"]
            if depth != "quick":
                pipeline.append("documentation")
        elif task_type == "report":
            pipeline = ["research", "summarization", "report"]
        elif task_type == "summarize":
            pipeline = ["summarization"]
        elif task_type == "chat":
            pipeline = await self._classify_chat(state["request"])
        else:
            pipeline = await self._classify_chat(state["request"])

        self._log("routing", f"LangGraph pipeline: {pipeline or ['direct']}")
        return {"pipeline": pipeline, "step": 0}

    async def _classify_chat(self, message: str) -> list[str]:
        if not message.strip():
            return []
        try:
            raw = await self.call_llm(f"User request: {message}", ROUTING_SYSTEM)
            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            pipeline = json.loads(clean)
            allowed = {"research", "summarization", "documentation", "report"}
            if not isinstance(pipeline, list) or not all(
                isinstance(item, str) and item in allowed for item in pipeline
            ):
                raise ValueError("Invalid routing response")
            return pipeline
        except (json.JSONDecodeError, ValueError) as exc:
            self._log("routing_fallback", str(exc))
            return []

    def _route_after_classify(self, state: WorkflowState) -> str:
        if state.get("payload", {}).get("collection"):
            return "retrieve"
        pipeline = state.get("pipeline", [])
        return pipeline[0] if pipeline else "direct"

    def _route_after_agent(self, state: WorkflowState) -> str:
        if state.get("payload", {}).get("collection") and state.get("step", 0) == 0:
            return state.get("pipeline", ["direct"])[0] if state.get("pipeline") else "direct"
        step = state.get("step", 0)
        pipeline = state.get("pipeline", [])
        return pipeline[step] if step < len(pipeline) else "finalize"

    async def _retrieve(self, state: WorkflowState) -> dict:
        payload = state["payload"]
        context = await context_for_query(
            state["request"],
            payload.get("collection", "default"),
            int(payload.get("retrieval_limit", 5)),
        )
        self._log("retrieval", f"Retrieved {len(context)} context characters")
        return {
            "context": context,
            "current_content": (
                f"User request:\n{state['request']}\n\n"
                f"Retrieved context:\n{context}"
            ),
            "step": 0,
        }

    async def _research(self, state: WorkflowState) -> dict:
        content = await self.research.run(state["current_content"])
        return self._agent_update(state, content, "ResearchAgent")

    async def _summarization(self, state: WorkflowState) -> dict:
        fmt = state["payload"].get("format", "executive" if state["task_type"] == "report" else "bullet")
        content = await self.summarization.run(state["current_content"], fmt)
        return self._agent_update(state, content, "SummarizationAgent")

    async def _documentation(self, state: WorkflowState) -> dict:
        topic = state["payload"].get("topic", state["request"])
        content = await self.documentation.run(state["current_content"], topic)
        return self._agent_update(state, content, "DocumentationAgent")

    async def _report(self, state: WorkflowState) -> dict:
        content = await self.report.run(
            state["current_content"],
            state["payload"].get("topic", state["request"]),
            state["payload"].get("include_sections"),
        )
        return self._agent_update(state, content, "ReportAgent")

    async def _direct(self, state: WorkflowState) -> dict:
        result = await self.call_llm(
            state["request"],
            "You are a helpful AI assistant. Answer clearly and accurately.",
        )
        return {"current_content": result, "result": result}

    async def _finalize(self, state: WorkflowState) -> dict:
        return {"result": state.get("current_content", state["request"])}

    def _agent_update(self, state: WorkflowState, content: str, name: str) -> dict:
        agents = [*state.get("agents_used", []), name]
        return {"current_content": content, "step": state.get("step", 0) + 1, "agents_used": agents}

    def _request_for(self, task_type: str, payload: dict) -> str:
        if task_type == "summarize":
            return payload["content"]
        return payload.get("message") or payload.get("topic") or ""

    def _clear_specialist_logs(self):
        for agent in self._agent_map.values():
            agent.clear_logs()

    def _collect_logs(self) -> list[dict]:
        logs = []
        for agent in self._agent_map.values():
            logs.extend(agent.get_logs())
            agent.clear_logs()
        return logs
