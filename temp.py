import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

idx = -1
for i, line in enumerate(lines):
    if 'id="balance-page"' in line:
        idx = i
        break

if idx != -1:
    start = max(0, idx - 20)
    end = min(len(lines), idx + 20)
    print("".join(lines[start:end]))
else:
    print("Not found")