"""
System Prompt — Loads and caches persona prompts.
"""
import os
from pathlib import Path
from functools import lru_cache

PROMPTS_DIR = Path(__file__).parent / "prompts"

@lru_cache(maxsize=16)
def get_system_prompt(persona: str = "krishna") -> str:
    """Returns the cached system prompt for the specified persona."""
    prompt_path = PROMPTS_DIR / f"{persona}.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    return (
        f"You are {persona.capitalize()}. "
        "Always speak in first person. Address the user appropriately. "
        "Reference your foundational texts when relevant. "
        "Use an appropriate tone for your character. Never break character."
    )
