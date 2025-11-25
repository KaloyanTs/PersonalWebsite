#!/usr/bin/env python3
"""
Simple, local HTML smoke-check validator for this repo.

Checks performed:
- presence of meta description
- presence of lang attribute on <html>
- images without alt text or with empty alt
- links with target="_blank" missing rel (noopener noreferrer)
- form inputs/textarea without associated <label for="id"> (requires inputs to have id)
- count of Font Awesome includes
- presence of aria-live on element with id=formStatus

This is a best-effort static check and is intended to be run locally.
"""
import sys
from html.parser import HTMLParser


class Checker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta_description = False
        self.html_lang = None
        self.imgs = []
        self.a_blank_no_rel = []
        self.inputs = []
        self.labels = []
        self.fa_links = []
        self.form_status_has_aria = False
        self.ids = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name', '').lower() == 'description':
            self.meta_description = True
        if tag == 'html':
            self.html_lang = attrs.get('lang')
        if tag == 'img':
            self.imgs.append(attrs)
        if tag == 'a':
            if attrs.get('target') == '_blank' and 'rel' not in attrs:
                self.a_blank_no_rel.append(attrs.get('href', ''))
        if tag in ('input', 'textarea'):
            self.inputs.append(attrs)
            if 'id' in attrs:
                self.ids[attrs['id']] = tag
        if tag == 'label':
            if 'for' in attrs:
                self.labels.append(attrs['for'])
        if tag == 'link':
            href = attrs.get('href', '')
            if 'font-awesome' in href or 'fontawesome' in href:
                self.fa_links.append(href)
        # detect aria-live presence on formStatus element
        if 'id' in attrs and attrs.get('id') == 'formStatus':
            if 'aria-live' in attrs:
                self.form_status_has_aria = True


def run_check(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = f.read()
    except Exception as e:
        print(f"ERROR: could not read '{path}': {e}")
        return 2

    parser = Checker()
    parser.feed(data)

    problems = 0

    print('\nHTML smoke-check report for:', path)
    # Debug: show detected labels and input ids
    print('\nDEBUG: detected label "for" values:', parser.labels)
    print('DEBUG: detected input ids:', [inp.get('id') for inp in parser.inputs])

    if parser.html_lang:
        print('- html lang attribute:', parser.html_lang)
    else:
        print('WARN: <html> element has no lang attribute')
        problems += 1

    if parser.meta_description:
        print('- meta description: present')
    else:
        print('WARN: <meta name="description"> missing')
        problems += 1

    # images
    imgs_without_alt = [i for i in parser.imgs if not i.get('alt')]
    if imgs_without_alt:
        print(f'WARN: {len(imgs_without_alt)} <img> tags missing alt text')
        problems += len(imgs_without_alt)
    else:
        print('- all <img> tags have alt text')

    # target blank links
    if parser.a_blank_no_rel:
        print('WARN: links opening in new tab missing rel attributes (noopener noreferrer):')
        for href in parser.a_blank_no_rel:
            print('  -', href)
        problems += len(parser.a_blank_no_rel)
    else:
        print('- links with target="_blank" have rel attributes')

    # inputs labels
    inputs_missing_label = []
    label_for_set = set(parser.labels)
    for inp in parser.inputs:
        # Ignore hidden inputs (e.g. access_key, redirect)
        if inp.get('type', '').lower() == 'hidden':
            continue

        if 'id' in inp:
            if inp['id'] not in label_for_set:
                inputs_missing_label.append(inp)
        else:
            # no id -> cannot associate label
            inputs_missing_label.append(inp)

    if inputs_missing_label:
        print(f'WARN: {len(inputs_missing_label)} form control(s) without associated <label> (or missing id):')
        problems += len(inputs_missing_label)
    else:
        print('- form controls have associated labels')

    # font awesome includes
    if len(parser.fa_links) <= 1:
        print(f'- Font Awesome includes: {len(parser.fa_links)} (ok)')
    else:
        print(f'WARN: multiple Font Awesome includes found ({len(parser.fa_links)}). Consolidate to one.')
        problems += 1

    # formStatus aria-live
    if parser.form_status_has_aria:
        print('- formStatus has aria-live')
    else:
        print('WARN: element with id="formStatus" missing aria-live attribute')
        problems += 1

    print('\nSummary: problems found =', problems)
    return 0 if problems == 0 else 1


if __name__ == '__main__':
    path = 'index.html'
    if len(sys.argv) > 1:
        path = sys.argv[1]
    rc = run_check(path)
    sys.exit(rc)
