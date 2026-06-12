import pdfplumber

def pdfparser(file):
    resumetext=""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()

            if text:
                resumetext+= text+"\n"
    return resumetext