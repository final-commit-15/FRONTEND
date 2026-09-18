import re

content = open('src/pages/ProjectIntakePage.tsx', 'r').read()

# Fix 1: Remove the premature </div> after the inner ternary
# Current: )}\n            </div>\n            <div className="space-y-2">
# Should be: )}\n            <div className="space-y-2">
pattern1 = r'(\)\}\)\n\s*</div>\n\s*<div className="space-y-2">)'
match1 = re.search(pattern1, content)
if match1:
    print('Fix 1: Found at', match1.start())
    content = content[:match1.start()] + content[match1.start():match1.end()].replace(')}</div>\n            <div className="space-y-2">', ')}\n            <div className="space-y-2">') + content[match1.end():]
    print('Fix 1 applied')
else:
    print('Fix 1: Pattern not found')

# Fix 2: Remove the extra </div> after the second Card (before ) : ()
# Pattern: </Card>\n      </div>\n      ) : (
fix3_pattern = r'(</Card>\n\s*</div>\n\s*\) : \()'
match3 = re.search(fix3_pattern, content)
if match3:
    print('Fix 3: Found at', match3.start())
    content = content[:match3.start()] + content[match3.start():match3.end()].replace('</Card>\n      </div>\n      ) : (', '</Card>\n      ) : (') + content[match3.end():]
    print('Fix 3 applied')
else:
    print('Fix 3: Pattern not found')

# Fix 3b: Also need to remove the </div> after the first Card (before second Card)
# Pattern: </Card>\n          </div>\n        </Card>
fix2b_pattern = r'(</Card>\n\s*</div>\n\s*</Card>)'
match2b = re.search(fix2b_pattern, content)
if match2b:
    print('Fix 2b: Found at', match2b.start())
    content = content[:match2b.start()] + content[match2b.start():match2b.end()].replace('</Card>\n          </div>\n        </Card>', '</Card>\n        </Card>') + content[match2b.end:]
    print('Fix 2b applied')
else:
    print('Fix 2b: Pattern not found')

# Fix 4: Remove trailing space after </> fragment closing
content = content.replace('</> \n', '</>\n')

# Write the fixed content
with open('src/pages/ProjectIntakePage.tsx', 'w') as f:
    f.write(content)

print('All fixes applied!')