with open('backend/main.py', 'rb') as f:
    b = f.read()

target = b"sentence_end = re.compile(r'[.?!]\\s|[.?!]$|\r\n')"
replacement = b"sentence_end = re.compile(r'[.?!]\\s|[.?!]$|\\n')"

assert target in b, "Target not found in backend/main.py"
b = b.replace(target, replacement, 1)

with open('backend/main.py', 'wb') as f:
    f.write(b)

print("Regex line fixed successfully")

