#!/usr/bin/env python3
"""Migrate manual font-bold/semibold/medium on ThemedText to variant prop."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TEXT_SIZES = ['text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs']

BOLD_VARIANT = {
    'text-4xl': 'display',
    'text-3xl': 'h1',
    'text-2xl': 'h2',
    'text-xl': 'h3',
    'text-lg': 'h4',
    'text-base': 'h4',
    'text-sm': 'label',
    'text-xs': 'label',
}

SEMIBOLD_VARIANT = {
    'text-xl': 'subtitle',
    'text-lg': 'subtitle',
    'text-base': 'subtitle',
    'text-sm': 'bodySm',
    'text-xs': 'caption',
}

MEDIUM_VARIANT = {
    'text-xl': 'subtitle',
    'text-lg': 'subtitle',
    'text-base': 'body',
    'text-sm': 'bodySm',
    'text-xs': 'caption',
}

STRIP_WHEN_VARIANT = {
    'font-bold',
    'font-semibold',
    'font-medium',
    'font-archivo-bold',
    'font-archivo',
    'font-archivo-light',
    *TEXT_SIZES,
    'leading-none',
    'leading-tight',
    'leading-snug',
    'leading-normal',
    'leading-relaxed',
    'leading-4',
    'leading-5',
    'leading-6',
    'leading-7',
    'leading-8',
    'leading-9',
    'leading-10',
    'text-black',
    'dark:text-white',
    'text-light-text',
    'dark:text-dark-text',
}


def find_text_size(classes: list[str]) -> str | None:
    for size in TEXT_SIZES:
        if size in classes:
            return size
    return None


def strip_classes(classname: str) -> str:
    parts = [p for p in classname.split() if p and p not in STRIP_WHEN_VARIANT]
    return ' '.join(parts)


def pick_variant(classes: list[str]) -> str | None:
    size = find_text_size(classes)
    if 'font-bold' in classes:
        return BOLD_VARIANT.get(size or 'text-base', 'h4')
    if 'font-semibold' in classes:
        return SEMIBOLD_VARIANT.get(size or 'text-base', 'subtitle')
    if 'font-medium' in classes:
        return MEDIUM_VARIANT.get(size or 'text-base', 'body')
    return None


def process_themedtext_tag(tag: str) -> str:
    if 'variant=' in tag:
        return tag

    cls_match = re.search(r'className=(["\{])(.*?)(?<!\})\1', tag, re.DOTALL)
    if not cls_match:
        return tag

    quote, raw_cls = cls_match.group(1), cls_match.group(2)
    if quote == '{':
        return tag

    classes = raw_cls.split()
    variant = pick_variant(classes)
    if not variant:
        return tag

    cleaned = strip_classes(raw_cls)
    new_tag = tag

    if cleaned:
        new_tag = re.sub(
            r'className="[^"]*"',
            f'className="{cleaned}"',
            new_tag,
            count=1,
        )
    else:
        new_tag = re.sub(r'\s*className="[^"]*"', '', new_tag, count=1)

    new_tag = new_tag.replace('<ThemedText', f'<ThemedText variant="{variant}"', 1)
    return new_tag


def process_text_tag(tag: str) -> str:
    """Raw Text: swap synthetic weights for Archivo font families."""
    if 'font-archivo' in tag:
        return tag
    new_tag = tag
    new_tag = new_tag.replace('font-bold', 'font-archivo-bold')
    new_tag = new_tag.replace('font-semibold', 'font-archivo')
    new_tag = new_tag.replace('font-medium', 'font-archivo')
    if '<Text' in new_tag and 'font-archivo' not in new_tag and 'className=' in new_tag:
        new_tag = new_tag.replace('className="', 'className="font-archivo ', 1)
    return new_tag


def process_file(path: Path) -> bool:
    content = path.read_text()
    original = content

    def repl_themed(m: re.Match) -> str:
        return process_themedtext_tag(m.group(0))

    content = re.sub(r'<ThemedText\b[^>]*>', repl_themed, content)

    def repl_text(m: re.Match) -> str:
        return process_text_tag(m.group(0))

    content = re.sub(r'<Text\b[^>]*>', repl_text, content)
    content = re.sub(r'<Animated\.Text\b[^>]*>', repl_text, content)

    if content != original:
        path.write_text(content)
        return True
    return False


def main() -> None:
    changed = 0
    for path in ROOT.rglob('*.tsx'):
        if 'node_modules' in path.parts or path.parts[-1] == 'ThemedText.tsx':
            continue
        if process_file(path):
            changed += 1
            print(path.relative_to(ROOT))
    print(f'Updated {changed} files')


if __name__ == '__main__':
    main()
