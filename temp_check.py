with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
idx = html.find('id="ss-journey-modal"')
if idx != -1:
    print(html[idx:idx+500])
