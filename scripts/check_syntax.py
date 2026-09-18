import sys

with open('src/components/LandingHero.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

in_str = None
in_comment = False
in_block_comment = False
stack = []
i = 0
n = len(text)
while i < n:
    c = text[i]
    next_c = text[i+1] if i+1 < n else ''
    
    if in_comment:
        if c == '\n':
            in_comment = False
        i += 1
        continue
    if in_block_comment:
        if c == '*' and next_c == '/':
            in_block_comment = False
            i += 2
            continue
        i += 1
        continue
    if in_str:
        if c == '\\':
            i += 2
            continue
        if c == in_str:
            in_str = None
        i += 1
        continue
        
    if c == '/' and next_c == '/':
        in_comment = True
        i += 2
        continue
    if c == '/' and next_c == '*':
        in_block_comment = True
        i += 2
        continue
    if c in '"\'`':
        in_str = c
        i += 1
        continue
        
    if c in '{[(':
        stack.append((c, text[:i].count('\n') + 1))
    elif c in '}])':
        if not stack:
            print(f'Extra {c} at line {text[:i].count(chr(10)) + 1}')
        else:
            top, line = stack.pop()
            expected = {'{':'}', '[':']', '(':')'}[top]
            if c != expected:
                print(f'Mismatched {top} from line {line} with {c} at line {text[:i].count(chr(10)) + 1}')
    i += 1

if stack:
    print(f'Remaining in stack: {len(stack)}')
    for s in stack:
        print(f'Unclosed {s[0]} from line {s[1]}')
