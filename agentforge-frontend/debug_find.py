import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Find the problematic pattern
idx = content.find('            </div>')
while idx != -1:
    if 'space-y-2' in content[idx:idx+50]:
        print('Found at', idx)
        print(repr(content[idx-200:idx+200]))
        break
    idx = content.find('            </div>', idx + 1)

# Also check for )}</div>
idx = content.find(')}')
while idx != -1:
    if 'space-y-2' in content[idx:idx+100]:
        print('Found )} at', idx)
        print(repr(content[idx-200:idx+200]))
        break
    idx = content.find(')}', idx + 1)