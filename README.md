# LENLU SC

LENLU SC is a cyber-styled code conversion and validation interface for DuckyScript-like source lines, rendered with a Matrix-inspired neon console theme. The app takes command streams in one panel, lints them in real time, and compiles them into AutoIt output in the next panel.

## Overview

This project presents a tactical terminal UI built around a dark phosphor palette, glowing green accents, and diagnostic telemetry panels. It is designed to feel like a high-trust assembly console rather than a generic form-based tool.

## Core Features

- Live source validation with strict, lax, and experimental lint profiles.
- Command-to-AutoIt compilation pipeline for DuckyScript-style inputs.
- Real-time diagnostic telemetry with critical and warning flags.
- Sample template loading, output copying, and buffer reset actions.
- SciTE-compatible assembly output for fast handoff into downstream tooling.

## Theme Direction

The visual language follows a cyber assembly grid aesthetic:

- Matte black surfaces with matrix-green borders and highlights.
- Mono-spaced UI text for a terminal-grade feel.
- Subtle scanline and phosphor-style overlays.
- Compact panels, badge indicators, and status logging.

## File Structure

- index.html - Main interface and layout shell.
- style.css - Cyber theme, glow effects, and scanline styling.
- compiler.js - Linter, compiler, and clipboard actions.

## How It Works

1. Enter or paste source commands into the left editor.
2. Select a lint profile to control validation strictness.
3. Run the compile pipeline to generate AutoIt output.
4. Review the diagnostic log for unresolved syntax or structural issues.
5. Copy the assembly output when the pipeline is clean.

## Notes

This README matches the same visual tone as the application: direct, minimal, technical, and built around a neon command-center identity.

## AI Integration

An integrated AI assistant can automatically convert and correct your DuckyScript-like source. Use the AI panel at the top to:

- Select a provider (default: GROQ).
- Provide the provider's API URL and your API key (the app sends a POST with a JSON `prompt` payload by default).
- Click `AI Convert & Fix` to request a corrected source and generated AutoIt assembly from the model.

Notes:
- The UI uses a generic POST behavior so you can connect GROQ, OpenAI, Anthropic, or any custom endpoint that accepts a JSON prompt and Bearer auth.
- For OpenAI, the panel pre-fills the Chat Completions endpoint; for Anthropic it pre-fills the completion endpoint; for GROQ it pre-fills the GROQ API base.
- Because this is a client-side integration, keep your keys secure and prefer using a server-side proxy for production deployments.
