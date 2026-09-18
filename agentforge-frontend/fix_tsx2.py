import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Fix 1: Remove premature </div> after inner ternary
# Pattern: )}\n            </div>\n            <div className="space-y-2">
pattern1 = r'(\)\}\)\n\s*</div>\n\s*<div className="space-y-2">)'
match1 = re.search(pattern1, content)
if match1:
    print('Fix 1: Found at', match1.start())
    content = content[:match1.start()] + content[match1.start():match1.end()].replace(')}</div>\n            <div className="space-y-2">', ')}\n            <div className="space-y-2">') + content[match1.end():]
    print('Fix 1 applied')
else:
    print('Fix 1: Pattern not found')

# Fix 2: Remove extra </div> after first Card (before second Card)
fix2_pattern = r'(</Card>\n\s*</div>\n\s*</Card>\n\s*</div>\n\s*\) : \()'
match2 = re.search(fix2_pattern, content)
if match2:
    print('Fix 2: Found at', match2.start())
    content = content[:match2.start()] + content[match2.start():match2.end()].replace('</Card>\n          </div>\n        </Card>\n      </div>\n      ) : (', '</Card>\n        </Card>\n      ) : (') + content[match2.end()]
    print('Fix 2 applied')
else:
    print('Fix 2: Pattern not found')

# Fix 3: Remove extra </div> after second Card
fix3_pattern = r'(</Card>\n\s*</div>\n\s*\) : \()'
match3 = re.search(fix3_pattern, content)
if match3:
    print('Fix 3: Found at', match3.start())
    content = content[:match3.start()] + content[match3.start():match3.end()].replace('</Card>\n      </div>\n      ) : (', '</Card>\n      ) : (') + content[match3.end():]
    print('Fix 3 applied')
else:
    print('Fix 3: Pattern not found')

# Fix 4: Remove trailing space after </> fragment closing
content = content.replace('</> \n', '</>\n')

# Write the fixed content
with open('src/pages/ProjectIntakePage.tsx', 'w') as f:
    f.write(content)

print('All fixes applied!')