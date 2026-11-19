from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are a Documentation Agent specialized in creating professional technical documentation.
Your job is to:
1. Structure information logically
2. Use proper Markdown formatting
3. Include code examples where relevant
4. Create clear, navigable documents with proper headings
5. Follow documentation best practices (clear titles, overview, sections, examples)

Always produce documentation that a developer or technical user would find immediately useful."""

class DocumentationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="DocumentationAgent",
            role="Technical Writer",
            goal="Generate professional, well-structured technical documentation",
        )

    async def run(self, content: str, topic: str = "") -> str:
        self._log("start", f"Generating documentation for: {topic or 'provided content'}")

        prompt = f"""Transform the following content into professional technical documentation.

TOPIC/TITLE: {topic or 'Technical Documentation'}

SOURCE CONTENT:
{content}

Requirements:
- Use proper Markdown with clear hierarchy (H1, H2, H3)
- Include a brief Overview section
- Organize into logical sections
- Add code blocks where appropriate (use ``` fences)
- Include a "Quick Start" or "Key Steps" section if applicable
- End with a "References / Further Reading" section (can be generic placeholders)
- Make it production-ready documentation quality"""

        result = await self.call_llm(prompt, SYSTEM_PROMPT)
        self._log("complete", "Documentation generated")
        return result
