#!/usr/bin/env python3
"""
Sloane - A tough VC mentor persona system.
"""

import json
import os
import re
import sys
from typing import Optional, Dict, List


class Sloane:
    """
    Sloane: A top-tier Venture Partner at a Silicon Valley VC firm.
    Cold, fast, extremely competent, slightly arrogant.
    """
    
    def __init__(self):
        self.name = "Sloane"
        self.philosophy = "I don't invest in ideas; I invest in people who can communicate."
        self.current_level: Optional[int] = None
        self.scenarios: List[Dict] = []
        self._load_scenarios()
    
    def _load_scenarios(self):
        """Load scenarios from scenarios.json"""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        scenarios_path = os.path.join(script_dir, "scenarios.json")
        
        try:
            with open(scenarios_path, 'r', encoding='utf-8') as f:
                self.scenarios = json.load(f)
        except FileNotFoundError:
            self.scenarios = []
        except json.JSONDecodeError:
            self.scenarios = []
    
    def get_scenario(self, level: int) -> Optional[Dict]:
        """Get scenario by level number"""
        for scenario in self.scenarios:
            if scenario.get("level") == level:
                return scenario
        return None
    
    def start_level(self, level: int) -> str:
        """Start a specific level/scenario"""
        scenario = self.get_scenario(level)
        if not scenario:
            return f"Level {level} doesn't exist. Available levels: {', '.join(str(s['level']) for s in self.scenarios)}"
        
        self.current_level = level
        return self._format_scenario_intro(scenario)
    
    def _format_scenario_intro(self, scenario: Dict) -> str:
        """Format scenario introduction"""
        lines = [
            f"\n{'='*60}",
            f"LEVEL {scenario['level']}: {scenario['title']}",
            f"{'='*60}",
            f"Situation: {scenario.get('situation_en', scenario['situation'])}",
            f"Goal: {scenario.get('goal_en', scenario['goal'])}",
            f"{'='*60}\n",
            f"{self.name}: {scenario['sloane_line']}\n"
        ]
        return "\n".join(lines)
    
    def list_scenarios(self) -> str:
        """List all available scenarios"""
        if not self.scenarios:
            return "No scenarios available."
        
        lines = ["Available Scenarios:\n"]
        for scenario in self.scenarios:
            status = " [CURRENT]" if self.current_level == scenario['level'] else ""
            lines.append(
                f"Level {scenario['level']}: {scenario['title']}{status}\n"
                f"  {scenario.get('situation_en', scenario['situation'])}\n"
            )
        return "\n".join(lines)
        
    def process_input(self, user_input: str) -> str:
        """
        Process user input and generate Sloane's response.
        """
        user_input = user_input.strip()
        
        # Handle empty input
        if not user_input:
            return "I'm waiting. What do you have?"
        
        # Handle commands
        if user_input.lower().startswith("start level"):
            try:
                level = int(user_input.split()[-1])
                return self.start_level(level)
            except (ValueError, IndexError):
                return "Usage: 'start level <number>' (e.g., 'start level 1')"
        
        if user_input.lower() in ["scenarios", "list", "levels"]:
            return self.list_scenarios()
        
        if user_input.lower() in ["exit level", "end level"]:
            if self.current_level:
                level = self.current_level
                self.current_level = None
                return f"Exited Level {level}. Back to free mode."
            return "You're not in a level."
        
        # Handle whisper mode (Korean input starting with [Whisper])
        if user_input.startswith("[Whisper]"):
            return self._handle_whisper_mode(user_input)
        
        # If in a level, respond contextually
        if self.current_level:
            return self._process_level_input(user_input, self.current_level)
        
        # Handle greetings/small talk
        if self._is_small_talk(user_input):
            return "We don't have time. Pitch me your update."
        
        # Handle vague ideas
        if self._is_vague_idea(user_input):
            return "Everyone wants to make an app. How do you make MONEY? Be specific."
        
        # Default: Challenge them to be more specific
        return self._generate_challenge_response(user_input)
    
    def _process_level_input(self, user_input: str, level: int) -> str:
        """Process input when in a specific level/scenario"""
        scenario = self.get_scenario(level)
        if not scenario:
            return self._generate_challenge_response(user_input)
        
        # Level-specific responses based on goals
        if level == 1:  # Ice-Breaking
            if self._is_weather_talk(user_input):
                return "Weather? Really? I said something INTERESTING. Try again."
            if self._is_small_talk(user_input):
                return "That's still small talk. Elevate the conversation. What's actually interesting?"
            return "Better. But can you be more engaging? What makes you different?"
        
        elif level == 2:  # Storytelling
            if self._mentions_underdog_keywords(user_input):
                return "Good. You mentioned your background. Now make it sound like ambition, not pity. Reframe it."
            if self._sounds_pathetic(user_input):
                return "You sound like you're asking for sympathy. I don't invest in sob stories. Make it legendary."
            return "I need to see the hunger. The drive. How did your struggle make you stronger?"
        
        elif level == 3:  # The Pitch
            if not self._has_numbers(user_input):
                return "Where are the numbers? I need specifics. Revenue, margins, growth. Now."
            if not self._sounds_confident(user_input):
                return "You sound uncertain. Confidence. Conviction. Show me you believe in this."
            return "Better. But I need more. Unit economics? Customer acquisition cost? Lifetime value?"
        
        elif level == 4:  # Insider Talk
            if not self._uses_industry_terms(user_input):
                return "Too generic. Use real terms. Burn rate? Runway? Ghosted? Show me you know the game."
            if self._sounds_too_formal(user_input):
                return "This is off the record. Be real. What do you ACTUALLY think? No corporate speak."
            return "Now we're talking. Tell me more. What's really happening behind the scenes?"
        
        return self._generate_challenge_response(user_input)
    
    def _is_weather_talk(self, user_input: str) -> bool:
        """Check if input is about weather"""
        weather_keywords = ["weather", "rain", "sunny", "cloudy", "hot", "cold", "temperature", "nice day", "beautiful day"]
        user_lower = user_input.lower()
        return any(keyword in user_lower for keyword in weather_keywords)
    
    def _mentions_underdog_keywords(self, user_input: str) -> bool:
        """Check if input mentions underdog background keywords"""
        keywords = ["seoul", "poor", "neighborhood", "struggle", "difficult", "hard", "raised", "entrepreneur"]
        user_lower = user_input.lower()
        return any(keyword in user_lower for keyword in keywords)
    
    def _sounds_pathetic(self, user_input: str) -> bool:
        """Check if input sounds like a sob story"""
        pathetic_patterns = [
            r"i (was|am) (so|too|very) (poor|broke|struggling|difficult)",
            r"it was (so|really|very) (hard|difficult|tough)",
            r"i (couldn't|could not|can't) (afford|do)",
            r"feel (sorry|bad) (for|about)",
        ]
        user_lower = user_input.lower()
        return any(re.search(pattern, user_lower) for pattern in pathetic_patterns)
    
    def _has_numbers(self, user_input: str) -> bool:
        """Check if input contains numbers"""
        return bool(re.search(r'\d+', user_input))
    
    def _sounds_confident(self, user_input: str) -> bool:
        """Check if input sounds confident"""
        confident_words = ["will", "guarantee", "confident", "certain", "proven", "definitely", "absolutely"]
        weak_words = ["maybe", "perhaps", "might", "could", "possibly", "hopefully", "try"]
        user_lower = user_input.lower()
        has_confident = any(word in user_lower for word in confident_words)
        has_weak = any(word in user_lower for word in weak_words)
        return has_confident and not has_weak
    
    def _uses_industry_terms(self, user_input: str) -> bool:
        """Check if input uses VC/startup industry terms"""
        industry_terms = [
            "burn rate", "runway", "ghosted", "valuation", "term sheet",
            "due diligence", "cap table", "equity", "round", "series",
            "unicorn", "down round", "bridge", "convertible", "saas",
            "mrr", "arr", "cac", "ltv", "churn", "moat", "tam", "sam", "som"
        ]
        user_lower = user_input.lower()
        return any(term in user_lower for term in industry_terms)
    
    def _sounds_too_formal(self, user_input: str) -> bool:
        """Check if input sounds too formal/corporate"""
        formal_phrases = [
            "i would like to", "i believe that", "it is my opinion",
            "according to", "in accordance with", "with all due respect"
        ]
        user_lower = user_input.lower()
        return any(phrase in user_lower for phrase in formal_phrases)
    
    def _handle_whisper_mode(self, user_input: str) -> str:
        """
        Translate Korean whisper input to sophisticated Wall Street/Tech English.
        This is a placeholder - in production, you'd use a translation API.
        """
        korean_text = user_input.replace("[Whisper]", "").strip()
        
        # Basic Korean phrase translations (expandable)
        translations = {
            "쟤 좀 재수없네": "He's a bit full of himself.",
            "이거 진짜 어렵네": "This is genuinely challenging.",
            "시간 없는데": "We're running out of time.",
            "뭔가 이상한데": "Something seems off here.",
        }
        
        # Check for known phrases
        for korean, english in translations.items():
            if korean in korean_text:
                return f"[Translated]: {english}"
        
        # Generic translation placeholder
        return f"[Translated]: {korean_text} (Translation needed - implement API)"
    
    def _is_small_talk(self, user_input: str) -> bool:
        """
        Detect if input is small talk.
        """
        small_talk_patterns = [
            r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening)[\s!.,]*$",
            r"^how are you[\s?]*$",
            r"^what's up[\s?]*$",
        ]
        
        user_input_lower = user_input.lower()
        for pattern in small_talk_patterns:
            if re.match(pattern, user_input_lower):
                return True
        return False
    
    def _is_vague_idea(self, user_input: str) -> bool:
        """
        Detect vague app/idea statements.
        """
        vague_patterns = [
            r"i want to make (an? )?app",
            r"i have an? idea",
            r"i want to build (a|an|some)",
            r"let's create (a|an)",
        ]
        
        user_input_lower = user_input.lower()
        for pattern in vague_patterns:
            if re.search(pattern, user_input_lower):
                return True
        return False
    
    def _generate_challenge_response(self, user_input: str) -> str:
        """
        Generate a challenging response to push the user to be more specific.
        """
        challenges = [
            "Be specific. What's the unit economics?",
            "That's not a pitch. What's your unfair advantage?",
            "I need numbers. TAM, SAM, SOM. Now.",
            "How do you scale? What's your moat?",
            "Everyone says that. What makes YOU different?",
            "Show me the money. How do you monetize?",
            "That's a feature, not a company. What's the business?",
        ]
        
        # Simple hash-based selection for consistency
        import hashlib
        index = int(hashlib.md5(user_input.encode()).hexdigest(), 16) % len(challenges)
        return challenges[index]


def main():
    """
    Main CLI interface for Sloane.
    """
    sloane = Sloane()
    
    print("=" * 60)
    print(f"{sloane.name.upper()}")
    print("=" * 60)
    print(f"Philosophy: {sloane.philosophy}")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        # Single command-line argument mode
        user_input = " ".join(sys.argv[1:])
        response = sloane.process_input(user_input)
        print(f"{sloane.name}: {response}")
    else:
        # Interactive mode
        print(f"{sloane.name}: We don't have time. Pitch me your update.")
        print("\nCommands: 'scenarios' to list levels, 'start level <N>' to begin a scenario")
        print("Type 'exit' or 'quit' to leave.\n")
        
        try:
            while True:
                user_input = input("You: ").strip()
                if user_input.lower() in ['exit', 'quit', 'bye']:
                    print(f"{sloane.name}: Make it count. Goodbye.")
                    break
                
                response = sloane.process_input(user_input)
                # Check if response is a scenario intro (contains level info)
                if response.startswith("\n" + "="*60):
                    print(response)
                else:
                    print(f"{sloane.name}: {response}")
                print()
        except KeyboardInterrupt:
            print(f"\n{sloane.name}: Time's up. Come back when you're ready.")


if __name__ == "__main__":
    main()

