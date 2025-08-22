# Crash Reports Configuration

TigerBug can automatically parse and categorize crash reports from your game. Set up custom templates to extract the exact information you need from your crash logs.

## Basic setup

1. Go to Admin Dashboard → Project Management
2. Click the three dots on any project → "Crash Reports"
3. Configure your settings:
   - **Enable/Disable**: Turn crash reporting on or off for this project
   - **Minimum Version**: Block crash reports from versions below this (uses semantic versioning)
   - **Custom Template**: Define how to parse your crash log format

## How the parsing works

**With a template**: You get exact control over what gets extracted from where. The parser creates a regex pattern from your template and extracts data into specific fields.

**Without a template**: TigerBug runs an automatic detection algorithm that tries to make sense of whatever crash data you throw at it. Here's how it works:

### Automatic parsing algorithm

When no template is provided, the system runs a text-based parsing algorithm to extract useful information from your crash data:

**Step 1: Section-based parsing**
The parser splits the crash data into sections based on colon-separated headers. It scans for patterns like:
```
Error: Something went wrong
Stack Trace: at function() line 42
Version: 1.2.3
```

The algorithm recognizes these common section headers:
- Error sections: "error", "exception", "short error", "crash reason", "fault", "problem", "message", "description"
- Stack sections: "stack trace", "call stack", "backtrace", "stacktrace"
- Version sections: "version", "build", "app version", "application version"
- OS sections: "os", "platform", "operating system", "system"

**Step 2: Line-by-line fallback**
If section parsing doesn't find error information, it falls back to scanning each line individually:

For error messages, it looks for lines containing:
- "error:" or "exception:"
- Takes the first match as the primary error

For stack traces, it identifies stack lines by looking for patterns like:
- Lines starting with whitespace followed by "at "
- Lines containing ".js:", ".exe", or "in " followed by file paths
- Lines that look like function calls with parentheses

Once it finds the start of a stack trace, it continues collecting lines until it hits a section boundary or unrelated content.

For version numbers, it uses regex to find patterns like:
- Semantic versions: "1.2.3", "2.0.1-beta"
- Build numbers: "build 1234"
- Any sequence of numbers separated by dots

### Similarity detection

The system also runs duplicate detection to group similar crashes. It generates a signature from the error message, stack trace, and application version. When new crashes come in, it compares signatures to find matches and increments the frequency counter instead of creating duplicate entries.

For fuzzy matching, it normalizes error messages by removing common noise (timestamps, memory addresses, random IDs) and compares similarity scores. If two crashes are 95% similar, they're considered the same issue.

### Why this matters for your game

This automatic parsing is designed to handle the messy reality of game development. Whether you're shipping a Unity game that outputs .NET stack traces, an Unreal game with C++ crashes, or a custom engine that logs to plain text files, the algorithm adapts to extract whatever useful information it can find.

The trade-off is precision vs. convenience. Automatic parsing might miss some details or misinterpret your log format, but it works out of the box with zero configuration. If you need exact control over what gets extracted, use a custom template.

## Template variables

| Variable | Captures | Example |
|----------|----------|---------|
| `%error%` | Main error message | "NullPointerException in GameManager" |
| `%stack_trace%` | Stack trace or call stack | Function call hierarchy |
| `%script%` | Script or file name | "player_controller.gml" |
| `%line%` | Line number | "142" |
| `%any%` | Wildcard - matches anything | Timestamps, file paths, etc. |

**Note**: Version and OS information are automatically captured from the crash report metadata sent by your game client, so you don't need to include `%version%` or `%os%` variables in your template.

## Template example

Say your game outputs crash logs like this:
```
CRASHLOG
Time: 05.04.2025 | 16:52:05
########################################
Short Error:
NullReferenceException in PlayerController
Error Script:
PlayerController.cs
Error Line:
142
########################################
Full Error:
Object reference not set to an instance of an object
at PlayerController.Update() in PlayerController.cs:line 142
at UnityEngine.MonoBehaviour.Internal_InvokeUpdateMethod()
########################################
File saved at: %AppData%\MyGame\crashlog.txt
```

Your template would be:
```
CRASHLOG
Time: %any%
########################################
Short Error:
%error%
Error Script:
%script%
Error Line:
%line%
########################################
Full Error:
%stack_trace%
########################################
File saved at: %any%
```

This extracts:
- **Error**: "NullReferenceException in PlayerController"
- **Script:Line**: "PlayerController.cs:142" (combined display)
- **Stack Trace**: "Object reference not set to an instance of an object\nat PlayerController.Update() in PlayerController.cs:line 142\nat UnityEngine.MonoBehaviour.Internal_InvokeUpdateMethod()"

The script and line information are automatically combined with a colon separator for display in the UI. If a script name contains colons, they will be escaped with backslashes.

## Template boundaries

The parser stops capturing at the next piece of literal text in your template. If you have:
```
Error:
%error%
########################################
```

It will capture everything after "Error:" until it hits the "########################################" line. This prevents capturing extra content you don't want.

## Strict mode

When you provide a custom template, crash reports that don't match the structure get rejected with a 400 error. This ensures you only get properly formatted reports.

Use `%any%` variables for parts that change (timestamps, file paths) while keeping the structure consistent.

## Version filtering

Set a minimum version to automatically reject crash reports from older builds. Uses semantic versioning comparison:
- "1.0.0" blocks anything below 1.0.0
- "2.1.0" allows 2.1.0 and above
- Pre-release versions like "1.0.0-beta" are normalized to "1.0.0" for comparison

## When conversion happens

Crash reports can be converted to issues. The conversion process:
1. Creates a new issue with crash details
2. Attaches the raw crash data as a file
3. Pre-fills title and description with extracted information
4. Marks the crash report as "Converted"

The generated issue description includes:
- Crash frequency and first occurrence date
- Error message in a code block
- Version and OS information (from request metadata)
- Script and line location (if captured)
- Stack trace in a code block
- Space for additional debugging notes

## Troubleshooting

| Problem | Likely cause | Solution |
|---------|--------------|----------|
| Template not matching | Structure doesn't align | Use `%any%` for variable content |
| Missing data | Variables not capturing | Check boundary text placement |
| Reports rejected | Template too strict | Add more `%any%` variables |
| Version blocking working wrong | Invalid semver format | Use proper format like "1.0.0" |

The parsing algorithm prioritizes your template first, then falls back to automatic detection if template parsing fails.