from pypdf import PdfReader
import re

# Path to the PDF
pdf_path = '../Sample-PDFs/Mentor_Mentee_Form _Individual.pdf'

# Extract text
reader = PdfReader(pdf_path)
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"
print("Extracted text:")
print(repr(text))

# Field detection
labels = []
lines = text.split('\n')
for line in lines:
    line = line.strip()
    print(f"Line: {repr(line)}")
    if re.search(r'……+', line):
        # Detect fields separated by long sequences of dots (5 or more)
        parts = re.split(r'……+', line)
        print(f"Parts: {parts}")
        for part in parts:
            part = part.strip()
            if part:
                # Remove any remaining dots and extra spaces
                part = re.sub(r'\.+.*', '', part).strip()
                print(f"Part after sub: {repr(part)}")
                if part and not re.match(r'^\d+$', part):  # Avoid numbers only
                    labels.append(part)
    else:
        # Detect labels before ':'
        matches = re.findall(r'([^:]+):', line)
        for match in matches:
            label = match.strip()
            if label and label not in labels:
                labels.append(label)

print("Detected labels:", labels)
