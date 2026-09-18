import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Find the problematic area
idx = content.find('            <div className="space-y-2">')
if idx != -1:
    print('Found at', idx)
    print(content[idx-300:idx+300])