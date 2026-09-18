content = open('src/pages/ProjectIntakePage.tsx', 'r').read()
idx = content.find('            <div className="space-y-2">', 27000)
print('Found at', idx)
print(content[idx-200:idx+300])