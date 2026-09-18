import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Fix 1: Add missing </div> to close main div after first Card (before ) : ()
# The first Card closes at position ~32220, then we need </div> before ) : (
match1 = re.search(r'(</Card>\n\s*\) : \()', content)
if match1:
    print('Fix 1: Found at', match1.start())
    content = content[:match1.start()] + content[match1.start():match1.end()].replace('</Card>\n      ) : (', '</Card>\n      </div>\n      ) : (') + content[match1.end():]
    print('Fix 1 applied')
else:
    print('Fix 1: Pattern not found')

# Fix 2: Remove premature </div> after inner ternary (before file upload)
# The pattern is: )}\n            </div>\n            <div className="space-y-2">
# But there's NO </div> between )} and <div className="space-y-2"> in the current code
# Let's check the actual content
idx = content.find(')}')
while idx != -1:
    if idx > 30700 and idx < 30800:
        print('Inner ternary end at', idx)
        print(repr(content[idx-50:idx+100]))
        break
    idx = content.find(')}', idx + 1)

# Fix 2: Remove the premature </div> at line 699 (position ~30752)
# The pattern is: )}\n            </div>\n            <div className="space-y-2">
# But looking at the actual content, there's NO </div> between )} and <div className="space-y-2">
# The </div> at line 699 is actually at a different position
# Let's search for the pattern: </div>\n            <div className="space-y-2">
pattern1 = r'(</div>\n\s*<div className="space-y-2">)'
match1 = re.search(pattern1, content)
if match1:
    print('Fix 2: Found at', match1.start())
    # Check if this is the problematic one (after inner ternary)
    context = content[match1.start()-200:match1.end()+100]
    if ')}' in content[match1.start()-200:match1.start()]:
        content = content[:match1.start()] + content[match1.start():match1.end()].replace('</div>\n            <div className="space-y-2">', '<div className="space-y-2">') + content[match1.end():]
        print('Fix 2 applied')
    else:
        print('Fix 2: Not the problematic one')
else:
    print('Fix 2: Pattern not found')

# Fix 3: Add missing </div> after first Card closes (before ) : ()
match1 = re.search(r'(</Card>\n\s*\) : \()', content)
if match1:
    print('Fix 3: Found at', match1.start())
    content = content[:match1.start()] + content[match1.start():match1.end()].replace('</Card>\n      ) : (', '</Card>\n      </div>\n      ) : (') + content[match1.end():]
    print('Fix 3 applied')
else:
    print('Fix 3: Pattern not found')

# Fix 4: Remove trailing space after </> fragment closing
content = content.replace('</> \n', '</>\n')

# Write the fixed content
with open('src/pages/ProjectIntakePage.tsx', 'w') as f:
    f.write(content)

print('All fixes applied!')