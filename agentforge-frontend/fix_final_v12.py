import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Fix 1: Add missing </div> to close main div after first Card
match1 = re.search(r'(</Card>\n\s*\) : \()', content)
if match1:
    print('Fix 1: Found at', match1.start())
    content = content[:match1.start()] + content[match1.start():match1.end()].replace('</Card>\n      ) : (', '</Card>\n      </div>\n      ) : (') + content[match1.end():]
    print('Fix 1 applied')
else:
    print('Fix 1: Pattern not found')

# Fix 2: Remove premature </div> after inner ternary
match2 = re.search(r'(\)\}\)\n\s*</div>\n\s*<div className="space-y-2">)', content)
if match2:
    print('Fix 2: Found at', match2.start())
    content = content[:match2.start()] + content[match2.start():match2.end()].replace(')}</div>\n            <div className="space-y-2">', ')}\n            <div className="space-y-2">') + content[match2.end():]
    print('Fix 2 applied')
else:
    print('Fix 2: Pattern not found')

# Fix 3: Remove extra </div> after first Card (before second Card)
match2b = re.search(r'(</Card>\n\s*</div>\n\s*</Card>)', content)
if match2b:
    print('Fix 2b: Found at', match2b.start())
    content = content[:match2b.start()] + content[match2b.start():match2b.end()].replace('</Card>\n          </div>\n        </Card>', '</Card>\n        </Card>') + content[match2b.end:]
    print('Fix 2b applied')
else:
    print('Fix 2b: Pattern not found')

# Fix 3: Remove extra </div> after second Card
match4 = re.search(r'(</Card>\n\s*</div>\n\s*\) : \()', content)
if match4:
    print('Fix 4: Found at', match4.start())
    content = content[:match4.start()] + content[match4.start():match4.end()].replace('</Card>\n      </div>\n      ) : (', '</Card>\n      ) : (') + content[match4.end:]
    print('Fix 4 applied')
else:
    print('Fix 4: Pattern not found')

# Fix 4: Remove trailing space after </> fragment closing
content = content.replace('</> \n', '</>\n')

# Write the fixed content
with open('src/pages/ProjectIntakePage.tsx', 'w') as f:
    f.write(content)

print('All fixes applied!')