from html.parser import HTMLParser

class ParentFinder(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.target_parents = []
        self.found = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self.stack.append((tag, attrs_dict.get('id')))
        if attrs_dict.get('id') == 'balance-page':
            self.target_parents = list(self.stack)
            self.found = True

    def handle_endtag(self, tag):
        if self.stack:
            self.stack.pop()

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

parser = ParentFinder()
parser.feed(html)
if parser.found:
    print("Parents of #balance-page:")
    for tag, id_attr in parser.target_parents:
        print(f"<{tag} id='{id_attr}'>")
else:
    print("Not found")