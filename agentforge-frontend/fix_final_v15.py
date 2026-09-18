import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Fix 1: Add missing </div> after inner ternary ends (before file upload div)
# Pattern: )}\n            <div className="space-y-2">
# Should be: )}\n            </div>\n            <div className="space-y-2">
match1 = re.search(r'(\)\}\)\n\s*<div className="space-y-2">)', content)
if match1:
    print('Fix 1: Found at', match1.start())
    content = content[:match1.start()] + content[match1.start():match1.end()].replace(')}</div>\n            <div className="space-y-2">', ')}\n            </div>\n            <div className="space-y-2">') + content[match1.end():]
    print('Fix 1 applied')
else:
    print('Fix 1: Pattern not found')

# Fix 2: Add missing </div> to close main div after first Card (before ) : ()
match1 = re.search(r'(</Card>\n\s*\) : \()', content)
if match1:
    print('Fix 2: Found at', match1.start())
    content = content[:match1.start()] + content[match1.start():match1.end()].replace('</Card>\n      ) : (', '</Card>\n      </div>\n      ) : (') + content[match1.end():]
    print('Fix 1 applied')
else:
    print('Fix 2: Pattern not found')

# Fix 3: Remove extra </div> after first Card (before second Card)
fix2b_pattern = r'(</Card>\n\s*</div>\n\s*</Card>)'
match2b = re.search(r'(</Card>\n\s*</div>\n\s*</Card>)', content)
if match2b:
    print('Fix 2b: Found at', match2b.start())
    content = content[:match2b.start()] + content[match2b.start():match2b.end()].replace('</Card>\n          </div>\n        </Card>', '</Card>\n        </Card>') + content[match2b.end:]
    print('Fix 2b applied')
else:
    print('Fix 2b: Pattern not found')

# Fix 4: Remove extra </div> after second Card (before ) : ()
match3 = re.search(r'(</Card>\n\s*</div>\n\s*\) : \()', content)
if match3:
    print('Fix 4: Found at', match3.start())
    content = content[:match3.start()] + content[match3.start():match3.end()].replace('</Card>\n      </div>\n      ) : (', '</Card>\n      ) : (') + content[match3.end:]
    print('Fix 3 applied')
else:
    print('Fix 4: Pattern not found')

# Fix 4: Remove trailing space after </> fragment closing
content = content.replace('</> \n', '</>\n')

# Write the fixed content
with open('src/pages/ProjectIntakePage.tsx', 'w') as f:
    f.write(content)

print('All fixes applied!')