# Contributing to AI Dev OS Benchmark

Thank you for your interest in contributing!

## How to Contribute

### Reporting Issues
- Use [GitHub Issues](https://github.com/yunbow/ai-dev-os-benchmark/issues) to report errors or suggest improvements
- Include the file path and check item ID (e.g., S6, E1) when reporting evaluation issues

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b improve-evaluation`)
3. Make your changes
4. Commit with a descriptive message
5. Push to your fork and open a Pull Request

### What to Contribute

| Directory | What We Need | Guidelines |
|-----------|-------------|------------|
| `spec/` | Benchmark design improvements, new evaluation dimensions | Changes affect the entire benchmark. Discuss in an Issue first. |
| `assets/prompts/` | Better prompt templates, additional conditions | Must maintain reproducibility. |
| `assets/` | Evaluation sheet refinements, new check items | Keep items objective and mechanically evaluable. |
| `results/` | Benchmark run results, analysis improvements | Include full metadata (model, date, commit hash). |
| `docs/i18n/` | Translations, translation improvements | See Translation Guide below. |

### Translation Guide

- English files are the source of truth
- Translations go in `docs/i18n/{lang}/` mirroring the English structure
- Currently supported: `ja` (Japanese)
- Keep technical terms, code blocks, URLs, and file paths in English
- Add `Languages:` footer with link back to English version

## Code of Conduct

Be respectful, constructive, and inclusive.

---

Languages: English | [日本語](docs/i18n/ja/CONTRIBUTING.md)
