from PyPDF2 import PdfReader

reader = PdfReader(r'c:\Users\suhas\OneDrive\Desktop\web portal\Problem Statement-2.pdf')
text = ''
for page in reader.pages:
    text += page.extract_text() + '\n---\n'

with open(r'c:\Users\suhas\OneDrive\Desktop\web portal\problem_statement.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print(text)
