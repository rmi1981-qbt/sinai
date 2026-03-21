import csv

input_file = r'c:\Qubit\OneDrive - Qubit Advisors\Qubit Advisors\Holding\Projetos\Sinai\website\celulas.csv'

# Read as windows-1252 to avoid any decoding errors.
with open(input_file, 'r', encoding='windows-1252', errors='replace') as f:
    text = f.read()

def fix_text(t):
    # Try the clean encode/decode approach first.
    # If the text is purely UTF-8 read as windows-1252, this works perfectly.
    try:
        btext = t.encode('windows-1252')
        return btext.decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass

    # Fallback to string replacements
    replacements = {
        'Ã¡':'á', 'Ã¢':'â', 'Ã£':'ã', 'Ã§':'ç', 'Ã©':'é', 'Ãª':'ê', 
        'Ã\xad':'í', 'Ã³':'ó', 'Ã´':'ô', 'Ãµ':'õ', 'Ãº':'ú', 
        'Ã¼':'ü', 'Ã€':'À', 'Ã\x81':'Á', 'Ã\x82':'Â', 'Ã\x83':'Ã', 
        'Ã\x87':'Ç', 'Ã\x89':'É', 'Ã\x8a':'Ê', 'Ã\x8d':'Í', 
        'Ã\x93':'Ó', 'Ã\x94':'Ô', 'Ã\x95':'Õ', 'Ã\x9a':'Ú',
        'Ã\x8d':'Í', 
        'ÃŠ':'Ê',
        'Ã ':'à '
    }
    for k, v in replacements.items():
        t = t.replace(k, v)
    return t

fixed = fix_text(text)
# Save it as UTF-8 properly
with open(input_file.replace('.csv', '_fixed.csv'), 'w', encoding='utf-8') as f:
    f.write(fixed)
print('Fixed file created successfully.')
