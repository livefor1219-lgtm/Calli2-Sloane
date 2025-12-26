# Sloane - VC Mentor Persona

A tough, no-nonsense Venture Partner persona system that challenges users to communicate concisely and confidently.

## Philosophy

> "I don't invest in ideas; I invest in people who can communicate."

## Features

- **No Small Talk**: Immediately redirects greetings to business
- **Brutal Honesty**: Challenges vague ideas and forces specificity
- **Whisper Mode**: Translates Korean input (starting with `[Whisper]`) to sophisticated Wall Street/Tech English
- **Level-Based Scenarios**: Practice different conversation scenarios (Ice-Breaking, Storytelling, The Pitch, Insider Talk)
- **Contextual Responses**: Sloane adapts responses based on the current scenario and goals
- **Interactive CLI**: Real-time conversation mode
- **Command-line Mode**: Single-query mode for scripts

## Usage

### Interactive Mode

```bash
python sloane.py
```

### Command-line Mode

```bash
python sloane.py "I want to make an app"
```

### Whisper Mode

```bash
python sloane.py "[Whisper] 쟤 좀 재수없네"
```

### Level-Based Scenarios

Start a training scenario:

```bash
python sloane.py
# Then type: start level 1
```

Available levels:
- **Level 1: Ice-Breaking** - Elevator conversation, avoid weather talk
- **Level 2: Storytelling** - Lounge bar, frame your underdog story as ambition
- **Level 3: The Pitch** - Investor meeting, use specific numbers and confidence
- **Level 4: Insider Talk** - Off-the-record gossip, use industry terms

Commands:
- `scenarios` - List all available scenarios
- `start level <N>` - Begin a specific level (1-4)
- `exit level` - Exit current scenario and return to free mode

## Examples

```
You: Hi
Sloane: We don't have time. Pitch me your update.

You: I want to make an app
Sloane: Everyone wants to make an app. How do you make MONEY? Be specific.

You: [Whisper] 쟤 좀 재수없네
Sloane: [Translated]: He's a bit full of himself.

You: scenarios
Sloane: Available Scenarios:
       Level 1: Ice-Breaking
       Level 2: Storytelling
       Level 3: The Pitch
       Level 4: Insider Talk

You: start level 1
Sloane: ============================================================
        LEVEL 1: Ice-Breaking
        ============================================================
        Situation: Inside an elevator. Need to break the awkward silence.
        Goal: Throw out an 'interesting topic' instead of talking about the weather
        ============================================================
        Sloane: Silence makes me nervous. Say something interesting.

You: Nice weather today
Sloane: Weather? Really? I said something INTERESTING. Try again.
```

## Requirements

- Python 3.7+

## Installation

No external dependencies required. Just run:

```bash
python sloane.py
```

## Extending

### Adding Korean Translations

Edit the `translations` dictionary in the `_handle_whisper_mode` method.

### Customizing Challenge Responses

Modify the `challenges` list in `_generate_challenge_response`.

### Adding New Scenarios

Edit `scenarios.json` to add new levels. Each scenario requires:
- `level`: Integer level number
- `title`: Scenario name
- `situation`: Korean description
- `situation_en`: English description (optional, falls back to `situation`)
- `goal`: Korean goal description
- `goal_en`: English goal description (optional, falls back to `goal`)
- `sloane_line`: Sloane's opening line for this scenario

