from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are a Summarization Agent specialized in distilling complex information into clear, concise insights.
Your job is to:
1. Extract the most critical information
2. Eliminate redundancy
3. Preserve all key facts and action items
4. Adapt the summary style to the requested format

Always be precise — do not hallucinate or add information not present in the source material."""

class SummarizationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="SummarizationAgent",
            role="Content Summarizer",
            goal="Distill large amounts of information into clear, actionable insights",
        )

    async def run(self, content: str, format: str = "bullet") -> str:
        self._log("start", f"Summarizing {len(content)} chars in '{format}' format")

        format_instructions = {
            "bullet": "Use bullet points. Group by theme. Max 10 bullets.",
            "paragraph": "Write 2-3 coherent paragraphs. Flowing prose, no bullets.",
            "executive": (
                "Executive summary style. Start with a 1-sentence bottom line. "
                "Then: Key Findings (3 bullets), Risks/Issues (2 bullets), "
                "Recommended Actions (2-3 bullets)."
            ),
        }.get(format, "Use bullet points.")

        prompt = f"""Summarize the following content.

FORMAT INSTRUCTIONS: {format_instructions}

CONTENT TO SUMMARIZE:
{content}

Provide a clear, concise summary that captures all essential points."""

        result = await self.call_llm(prompt, SYSTEM_PROMPT)
        self._log("complete", "Summary generated")
        return result
