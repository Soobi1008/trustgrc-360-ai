import difflib


def create_text_diff(
    old_content: str,
    new_content: str,
    max_lines: int = 40,
) -> str:
    """
    Create a compact textual difference between two
    normalized regulatory snapshots.

    The result is intended for regulatory review,
    not for automatically changing compliance rules.
    """

    old_words = old_content.split()
    new_words = new_content.split()

    diff = difflib.unified_diff(
        old_words,
        new_words,
        fromfile="previous_snapshot",
        tofile="current_snapshot",
        lineterm="",
    )

    lines = list(diff)

    if not lines:
        return "No textual differences identified."

    limited = lines[:max_lines]

    result = "\n".join(limited)

    if len(lines) > max_lines:
        result += (
            "\n\n"
            f"... diff truncated. "
            f"{len(lines) - max_lines} additional lines omitted."
        )

    return result


def calculate_change_ratio(
    old_content: str,
    new_content: str,
) -> float:
    """
    Return an approximate proportion of content similarity.

    0.0 = completely different
    1.0 = identical
    """

    matcher = difflib.SequenceMatcher(
        None,
        old_content,
        new_content,
    )

    return matcher.ratio()


def classify_candidate_change(
    old_content: str,
    new_content: str,
) -> dict:
    """
    Preliminary technical classification.

    This is NOT a legal determination.
    """

    similarity = calculate_change_ratio(
        old_content,
        new_content,
    )

    difference = 1.0 - similarity

    if difference < 0.001:
        severity = "very_low"
    elif difference < 0.01:
        severity = "low"
    elif difference < 0.05:
        severity = "moderate"
    elif difference < 0.20:
        severity = "high"
    else:
        severity = "major"

    return {
        "similarity_ratio": round(
            similarity,
            6,
        ),
        "difference_ratio": round(
            difference,
            6,
        ),
        "technical_severity": severity,
    }