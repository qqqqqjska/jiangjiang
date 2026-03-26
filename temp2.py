from bs4 import BeautifulSoup
with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

node = soup.find(id='balance-page')
parents = []
while node and node.name != 'body':
    if node.name != 'div' or node.has_attr('id'):
        parents.append(f"{node.name}#{node.get('id', '')}.{'.'.join(node.get('class', []))}")
    node = node.parent
print(" -> ".join(parents[::-1]))
