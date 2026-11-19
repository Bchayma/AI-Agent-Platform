from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are a Research Agent specialized in gathering and organizing information.
Your job is to:
1. Identify the key aspects of the topic to investigate
2. List findings in a structured, factual manner
3. Highlight common issues, causes, and relationships
4. Always cite the nature of your sources (documentation, best practices, community knowledge)

Output format:
- Use clear sections with headers
- Bullet point findings
- Include severity/importance indicators where relevant
- End with a "Key Takeaways" section
"""

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="ResearchAgent",
            role="Information Researcher",
            goal="Gather comprehensive, structured information about any topic",
        )

    async def run(self, topic: str) -> str:
        self._log("start", f"Researching: {topic}")

        prompt = f"""Research the following topic thoroughly and provide a comprehensive analysis:

TOPIC: {topic}

Please provide:
1. Overview of the topic
2. Key components or aspects
3. Common issues or challenges (if applicable)
4. Best practices or recommendations
5. Key Takeaways (3-5 bullet points)

Be specific, technical where appropriate, and actionable."""

        result = await self.call_llm(prompt, SYSTEM_PROMPT)
        self._log("complete", f"Research complete: {len(result)} chars returned")
        return result
