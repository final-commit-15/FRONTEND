import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Check for the pattern around line 699
idx = content.find('            </div>')
while idx != -1:
    if 'space-y-2' in content[idx:idx+50]:
        print('Found at', idx)
        print(repr(content[idx-200:idx+200]))
        break
    idx = content.find('            </div>', idx + 1)

# Also check for the pattern )}</div><div className="space-y-2">
idx = content.find(')}</div>')
if idx != -1:
    print('Found )}</div> at', idx)
    print(repr(content[idx-100:idx+100]))
else:
    print('Pattern )}</div> not found')

# Check for )}\n            </div>\n            <div className="space-y-2">
pattern = r'\)\}\)\n\s*</div>\n\s*<div className="space-y-2">'
match = re.search(pattern, content)
if match:
    print('Found pattern at', match.start())
    print(repr(content[match.start():match.end()]))
else:
    print('Pattern not found')

# Check for the specific pattern around line 699
idx = content.find('            </div>')
while idx != -1:
    context = content[idx-100:idx+100]
    if 'space-y-2' in context:
        print('Found at', idx)
        print(repr(context))
        break
    idx = content.find('            </div>', idx + 1)